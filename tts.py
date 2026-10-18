# озвучка: build/script.json -> audio/voice_<голос>.wav + build/words.json (время каждого слова, цвет из разметки)
# разметка в тексте: *слово* — выделенное (жёлтое; в look night/mono — белое с красным свечением), ~слово~ — красное.
# pause — пауза после фразы, с. voice — голос из VOICES (по умолчанию narr).
# ударение: знак U+0301 сразу после ударной гласной (за́мок) — уходит в edge-tts как есть, из субтитров вырезается.
#   ставить только там, где на слух диктор ошибся; иначе лучше заменить слово.
import asyncio, json, re, subprocess, pathlib, os
import edge_tts

ROOT = pathlib.Path(__file__).parent
WORK = pathlib.Path(os.environ.get("WORK", ROOT / "eps" / "example")).resolve()   # папка ролика: build/ audio/ frames/
VOICES = {  # голос: (модель edge-tts, темп, высота). Список моделей: edge-tts --list-voices | grep ru-RU
    "narr": ("ru-RU-DmitryNeural", "+22%", "-6Hz"),     # рассказчик
    "pa": ("ru-RU-SvetlanaNeural", "+0%", "-4Hz"),      # громкая связь / объявление (фильтр — в mix.py ролика)
    "tema": ("ru-RU-DmitryNeural", "+2%", "+28Hz"),     # парень из телефона
    "boy": ("ru-RU-DmitryNeural", "+10%", "+48Hz"),     # мальчик отвечает издалека
    "kol": ("ru-RU-SvetlanaNeural", "+6%", "+18Hz"),    # «устройство» (колонка, автоответчик); обработка «маленький динамик» — в mix.py ролика
    "rec": ("ru-RU-SvetlanaNeural", "-12%", "-14Hz"),   # тихий голос из записи / шёпот
}
SR = 48000
STRESS = "\u0301"


def clean(s):
    return s.replace("*", "").replace("~", "")


def tokens(s):
    """слова для субтитров с цветом из разметки: *жёлтое* ~красное~ (знаки препинания после маркера можно)"""
    out = []
    for raw in s.split():
        c = "y" if "*" in raw else ("r" if "~" in raw else "")
        out.append({"w": raw.replace("*", "").replace("~", "").replace(STRESS, ""), "c": c})
    return out


def norm(w):
    return re.sub(r"[^\wёЁ]", "", w.lower().replace(STRESS, ""))


async def synth(text, path, voice="narr"):
    for attempt in range(4):          # сервис иногда отвечает пустым потоком — повторяем
        try:
            return await _synth(text, path, voice)
        except edge_tts.exceptions.NoAudioReceived:
            await asyncio.sleep(1.5 * (attempt + 1))
    return await _synth(text, path, voice)


async def _synth(text, path, voice="narr"):
    v, rate, pitch = VOICES[voice]
    com = edge_tts.Communicate(text, v, rate=rate, pitch=pitch, boundary="WordBoundary")
    bounds = []
    with open(path, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                bounds.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
    return bounds


def dur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                                capture_output=True, text=True).stdout)


def align(toks, bounds):
    """сопоставить слова субтитров с границами TTS по порядку"""
    res, j = [], 0
    for tk in toks:
        n = norm(tk["w"])
        if not n:                      # тире и прочие знаки: своей границы у TTS нет, время возьмём у соседа
            res.append(None)
            continue
        hit = None
        for k in range(j, min(j + 4, len(bounds))):
            if n and (norm(bounds[k][2]) == n or n.startswith(norm(bounds[k][2])) or norm(bounds[k][2]).startswith(n)):
                hit = k
                break
        if hit is None and j < len(bounds):
            hit = j
        if hit is not None:
            res.append((bounds[hit][0], bounds[hit][1]))
            j = hit + 1
        else:
            res.append(None)
    # дыры — интерполяцией
    for i, r in enumerate(res):
        if r is None:
            prev = next((res[k] for k in range(i - 1, -1, -1) if res[k]), (0, 0))
            res[i] = (prev[1], prev[1] + 0.25)
    return res


async def main():
    sc = json.loads((WORK / "build" / "script.json").read_text())
    (WORK / "audio").mkdir(exist_ok=True)
    words, parts, t = [], [], sc.get("lead", 0.35)
    phrases_out = []
    for i, ph in enumerate(sc["phrases"]):
        path = WORK / "audio" / f"vo_{i:02d}.mp3"
        vc = ph.get("voice", "narr")
        bounds = await synth(clean(ph["text"]), path, vc)
        # обрезаем тишину TTS по границам слов
        cut0 = max(0.0, bounds[0][0] - 0.04) if bounds else 0.0
        cut1 = min(dur(path), bounds[-1][1] + 0.12) if bounds else dur(path)
        d = cut1 - cut0
        toks = tokens(ph["text"])
        times = align(toks, bounds)
        for tk, (a, b) in zip(toks, times):
            words.append({"w": tk["w"], "c": tk["c"], "t0": round(t + a - cut0, 3), "t1": round(t + b - cut0, 3), "ph": i})
        phrases_out.append({"i": i, "id": ph.get("id", str(i)), "voice": vc, "t0": round(t, 3), "t1": round(t + d, 3)})
        parts.append((path, t, vc, cut0, cut1))
        t += d + ph.get("pause", 0.12)
    t_end_voice = t + sc.get("tail", 0.5)
    total = t_end_voice + sc.get("end_card", {}).get("dur", 0)
    # склейка: отдельная дорожка на каждый голос — в numpy, каждый кусок ровно на своё место
    import numpy as np
    n_total = int(total * SR) + SR
    for vc in VOICES:
        mine = [(p, at, c0, c1) for p, at, v, c0, c1 in parts if v == vc]
        if not mine:
            continue
        track = np.zeros(n_total, np.float32)
        for p, at, c0, c1 in mine:
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                                 capture_output=True, check=True).stdout
            x = np.frombuffer(raw, np.float32)[int(c0 * SR): int(c1 * SR)].copy()
            k = int(0.04 * SR)
            x[-k:] *= np.linspace(1, 0, k)
            i = int(round(at * SR))
            track[i: i + len(x)] += x[: n_total - i]
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        str(WORK / "audio" / f"voice_{vc}.wav")], input=track[: int(total * SR)].tobytes(), check=True)
    (WORK / "build" / "words.json").write_text(json.dumps({"words": words, "phrases": phrases_out, "voice_end": round(t_end_voice, 3), "duration": round(total, 3)},
                                                          ensure_ascii=False, indent=1))
    n = len(words)
    print(f"озвучка {total:.1f} с, {n} слов, {n / (total / 60):.0f} слов/мин")


if __name__ == "__main__":
    asyncio.run(main())
