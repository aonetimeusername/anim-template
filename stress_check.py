# контроль ударений основного диктора (голос narr). Нужны доп. пакеты: pip install -r requirements-stress.txt
#
#   python stress_check.py --root eps/<имя>            script.json -> build/stress.json + список рискованных слов
#   python stress_check.py --root eps/<имя> --listen   ещё и файл на прослушивание build/stress_listen.m4a: фразы с рискованными
#                                                      словами из готовой дорожки audio/voice_narr.wav (нужен build/words.json,
#                                                      то есть сначала python build.py <имя> --no-render), перед каждой — номер;
#                                                      список — build/stress_listen.txt
#   python stress_check.py --ab "за́мок,замо́к"         A/B: каждое слово голосом диктора под номером -> build/stress_ab.m4a
#   --script F    другой script.json
#
# Ударения ставит ruaccent (словарь + нейросеть для омографов). Рискованные слова: омографы (замок, мука, стоит),
# слова, которых нет в словаре (ударение угадано моделью), имена и фамилии, слова с пропущенной «ё».
# Уверенность — вероятность варианта по модели ruaccent (для словарных слов 1.0). ruaccent тоже ошибается
# («ручка двери» -> «двери́» 97%), поэтому решает ухо: сомнительное — в --listen и пользователю до публикации.
#
# Знак ударения в script.json — U+0301 сразу после ударной гласной: за́мок. tts.py передаёт его в edge-tts и
# вырезает из субтитров.
#
# Автопроверку по фонемам (wav2vec2-xlsr-53-espeak-cv-ft) пробовали 17.10 — не годится: на ч.1 расходится с ожидаемым
# в 41 из 157 слов (почти всё ложные: «Тёма́», «на́чинают»), а нарочно неправильные «про́вода»/«Школа́» не отличает.
import argparse, asyncio, json, pathlib, re, subprocess, sys, tempfile, warnings

ROOT = pathlib.Path(__file__).parent
import os
DEFAULT_ROOT = os.environ.get("WORK", str(ROOT / "eps" / "example"))
STRESS = "́"
VOWELS = "аеёиоуыэюя"
WORD_RE = re.compile(r"[а-яёА-ЯЁ́]+(?:-[а-яёА-ЯЁ́]+)*")
SR = 48000


def clean(s):
    return s.replace("*", "").replace("~", "")


def vowel_pos(w):
    """индексы гласных в слове (без знака ударения)"""
    return [i for i, ch in enumerate(w.lower()) if ch in VOWELS]


def mark(w, i):
    """слово со знаком U+0301 после буквы i"""
    return w[: i + 1] + STRESS + w[i + 1:]


# ---------------- текст: ruaccent ----------------

def load_ruaccent():
    warnings.filterwarnings("ignore")
    from transformers.utils import logging as tl
    tl.set_verbosity_error()
    from ruaccent import RUAccent
    acc = RUAccent()
    acc.load(omograph_model_size="turbo3.1", use_dictionary=True)
    return acc


def softmax(x):
    import numpy as np
    e = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)


def omograph_probs(acc, sentence, k, variants):
    """вероятности вариантов омографа: k-е слово предложения в контексте (как в ruaccent, но с честным softmax)"""
    import numpy as np
    toks = re.findall(WORD_RE.pattern + r"|\d+|[^\w\s]+", sentence)
    words = [i for i, t in enumerate(toks) if WORD_RE.fullmatch(t)]
    toks[words[k]] = " <w>" + toks[words[k]] + "</w> "
    text = acc.delete_spaces_before_punc(" ".join(toks))
    text = re.sub(r"\s+(?=(?:[,.?!:;…]))", "", text)
    m = acc.omograph_model
    p = []
    for hyp in variants:
        inp = m.tokenizer(text, hyp, max_length=512, truncation=True, return_tensors="np")
        out = m.session.run(None, {a: b.astype(np.int64) for a, b in inp.items()})[0]
        p.append(float(softmax(out)[0][1]))
    p = np.array(p)
    return p / p.sum()


def model_accent(acc, w):
    """ударение из нейросети ruaccent для слова вне словаря: (индекс буквы, уверенность)"""
    import numpy as np
    m = acc.accent_model
    inp = m.tokenizer(w.lower(), return_tensors="np")
    names = {o.name: i for i, o in enumerate(m.session.get_outputs())}
    logits = m.session.run(None, {a: b.astype(np.int64) for a, b in inp.items()})[names["logits"]][0]
    pr = softmax(logits)[1: len(w) + 1, 1]          # STRESS_PRIMARY для каждой буквы (0 — служебный токен)
    vp = vowel_pos(w)
    pv = np.array([pr[i] for i in vp])
    j = int(pv.argmax())
    return vp[j], float(pv[j] / pv.sum())


def safe_accent(acc, plain):
    """ruaccent иногда падает внутри модели на незнакомом слове (onnx: token_type_ids) — тогда по словам;
    слово, на котором модель падает, остаётся без «+» и уходит в рискованные"""
    try:
        return acc.process_all(plain)
    except ValueError:
        out = []
        for tok in plain.split():
            try:
                out.append(acc.process_all(tok))
            except ValueError:
                out.append(tok)
        return " ".join(out)


def analyze_text(script_path):
    """все многосложные слова диктора: ожидаемое ударение, уверенность, чем рискованно"""
    import razdel
    sc = json.loads(pathlib.Path(script_path).read_text())
    acc = load_ruaccent()
    out = []
    for pi, ph in enumerate(sc["phrases"]):
        if ph.get("voice", "narr") != "narr":
            continue
        plain = clean(ph["text"]).replace(STRESS, "")
        acc_words = re.findall(r"[а-яёА-ЯЁ+]+(?:-[а-яёА-ЯЁ+]+)*", safe_accent(acc, plain))
        # слова субтитров (как tokens() в tts.py) -> слова внутри них
        items = [(ti, w) for ti, tk in enumerate(ph["text"].split()) for w in WORD_RE.findall(clean(tk))]
        if len(items) != len(acc_words):
            print(f"! фраза {ph.get('id', pi)}: ruaccent разбил слова иначе ({len(items)} vs {len(acc_words)}), пропускаю", file=sys.stderr)
            continue
        # предложения — для контекста омографов и для «начала предложения»
        sents = [s.text for s in razdel.sentenize(plain)]
        sent_of, k_in_sent = [], []
        for si, s in enumerate(sents):
            for k, _ in enumerate(WORD_RE.findall(s)):
                sent_of.append(si)
                k_in_sent.append(k)
        if len(sent_of) != len(items):           # не разбилось — контекстом будет вся фраза
            sents, sent_of, k_in_sent = [plain], [0] * len(items), list(range(len(items)))
        for n, ((ti, w), aw) in enumerate(zip(items, acc_words)):
            base = w.replace(STRESS, "")
            if len(vowel_pos(base)) < 2:
                continue
            lw = base.lower()
            rec = {"phrase": ph.get("id", str(pi)), "ph": pi, "tok": ti, "word": base, "text": plain,
                   "reasons": [], "risky": False}
            idx, conf = (aw.find("+") if "+" in aw else None), 1.0   # «+» стоит перед ударной гласной
            yo = [i for i, (a, b) in enumerate(zip(lw, aw.replace("+", "").lower())) if a == "е" and b == "ё"]
            if yo:                                   # ruaccent вернул ё, а в тексте е
                rec["reasons"].append("пропущена ё")
                rec["risky"] = True
                idx = yo[0]
            if STRESS in w:
                idx = w.index(STRESS) - 1
                rec["reasons"].append("уже помечено")
            elif lw in acc.omographs:
                variants = acc.omographs[lw]
                p = omograph_probs(acc, sents[sent_of[n]], k_in_sent[n], variants)
                j = int(p.argmax())
                idx, conf = variants[j].index("+"), float(p[j])
                rec["reasons"].append("омограф: " + " / ".join(f"{mark(v.replace('+', ''), v.index('+'))} {pp:.0%}" for v, pp in zip(variants, p)))
                rec["risky"] = True
            elif lw not in acc.accents and "ё" not in lw:
                idx, conf = model_accent(acc, base)
                rec["reasons"].append("нет в словаре, ударение угадано")
                rec["risky"] = True
            if base[0].isupper() and k_in_sent[n] > 0 and not rec["risky"]:
                rec["reasons"].append("имя/фамилия")
                rec["risky"] = True
            if idx is None:                          # ruaccent счёл слово безударным — берём из словаря
                hit = acc.accents.get(lw, "")
                idx = hit.index("+") if "+" in hit else (lw.index("ё") if "ё" in lw else model_accent(acc, base)[0])
            rec.update({"stress": idx, "syllable": vowel_pos(base).index(idx) + 1, "suggest": mark(base, idx),
                        "conf": round(conf, 3), "final": idx == len(base) - 1})
            out.append(rec)
    return out


# ---------------- звук: файлы на прослушивание ----------------

def pcm(path, a=0.0, b=None):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32)
    return x[int(a * SR): int(b * SR) if b else None].copy()


async def say(text, voice, tmp):
    """фраза голосом из tts.py, тишина по краям обрезана по границам слов (как в tts.py)"""
    import tts, edge_tts
    p = pathlib.Path(tmp) / f"{abs(hash((text, voice)))}.mp3"
    for attempt in range(5):                 # сервис бывает отвечает пустым потоком по несколько раз подряд
        try:
            bounds = await tts.synth(text, p, voice)
            break
        except edge_tts.exceptions.NoAudioReceived:
            await asyncio.sleep(5 * (attempt + 1))
    else:
        raise SystemExit(f"edge-tts не отдал звук: {text}")
    return pcm(p, max(0.0, bounds[0][0] - 0.04), bounds[-1][1] + 0.12)


def write_numbered(clips, path):
    """номер голосом громкой связи, пауза, клип, пауза — одним файлом m4a"""
    import numpy as np

    async def numbers():
        with tempfile.TemporaryDirectory() as tmp:
            return [await say(f"{k}.", "pa", tmp) for k in range(1, len(clips) + 1)]
    nums = asyncio.run(numbers())
    gap = lambda s: np.zeros(int(s * SR), np.float32)
    parts = [gap(0.4)]
    for n, c in zip(nums, clips):
        parts += [n * 0.8, gap(0.35), c, gap(1.3)]
    x = np.concatenate(parts)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "aac",
                    "-b:a", "160k", str(path)], input=x.tobytes(), check=True)
    return len(x) / SR


def listen_file(root, recs, out):
    """фразы с рискованными словами из готовой дорожки диктора"""
    wj = json.loads((root / "build" / "words.json").read_text())
    voice = root / "audio" / "voice_narr.wav"
    groups = {}
    for r in recs:
        if r["risky"]:
            groups.setdefault(r["ph"], []).append(r)
    clips, lines = [], []
    for k, (ph, rs) in enumerate(sorted(groups.items()), 1):
        info = wj["phrases"][ph]
        clips.append(pcm(voice, max(0.0, info["t0"] - 0.05), info["t1"] + 0.1))
        lines.append(f"{k}. «{rs[0]['text']}» — " + ", ".join(f"{r['suggest']} ({r['conf']:.0%})" for r in rs))
    d = write_numbered(clips, out)
    out.with_suffix(".txt").write_text("\n".join(lines) + "\n")
    return d, lines


def ab_file(items, out):
    """каждое слово голосом диктора, как есть (со знаком или без)"""
    async def clips():
        with tempfile.TemporaryDirectory() as tmp:
            return [await say(w + ".", "narr", tmp) for w in items]
    d = write_numbered(asyncio.run(clips()), out)
    lines = [f"{k}. {w}" for k, w in enumerate(items, 1)]
    out.with_suffix(".txt").write_text("\n".join(lines) + "\n")
    return d, lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=DEFAULT_ROOT, help="папка ролика: eps/<имя>")
    ap.add_argument("--script")
    ap.add_argument("--listen", action="store_true")
    ap.add_argument("--ab")
    ap.add_argument("--out")
    a = ap.parse_args()
    root = pathlib.Path(a.root)
    if a.ab:
        out = pathlib.Path(a.out) if a.out else root / "build" / "stress_ab.m4a"
        d, lines = ab_file([w.strip() for w in a.ab.split(",") if w.strip()], out)
        print("\n".join(lines) + f"\n-> {out} ({d:.0f} с)")
        return
    script = pathlib.Path(a.script) if a.script else root / "build" / "script.json"
    recs = analyze_text(script)
    out = pathlib.Path(a.out) if a.out else root / "build" / "stress.json"
    out.write_text(json.dumps({"script": str(script), "words": recs}, ensure_ascii=False, indent=1))
    risky = [r for r in recs if r["risky"]]
    print(f"\nрискованные слова ({len(risky)} из {len(recs)} многосложных):")
    for r in sorted(risky, key=lambda r: r["conf"]):
        fin = "  [знак на последней букве]" if r["final"] else ""
        print(f"  {r['suggest']:16s} {r['conf']:4.0%}  {'; '.join(r['reasons'])}{fin}\n      «{r['text']}»")
    print(f"\n-> {out}")
    if a.listen:
        d, lines = listen_file(root, recs, out.with_name("stress_listen.m4a"))
        print(f"-> {out.with_name('stress_listen.m4a')} ({d:.0f} с, {len(lines)} фраз)")


if __name__ == "__main__":
    main()
