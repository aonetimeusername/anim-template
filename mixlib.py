# сведение звука ролика: голоса (audio/voice_<голос>.wav) + подложки + эффекты + музыка -> audio/mix.wav (≈ -15 LUFS)
# ролик пишет свой mix.py: M = Mix(); M.put(звук, время, громкость); amb = ...; M.finish(amb, music)
# свои звуки кладите в sfx/ (ev("файл.mp3")), музыку — в music/. Если файла нет — вместо него тишина,
# а подложки (гул комнаты, низкий дрон, часы) и простые эффекты (тон, сигнал, шаг, щелчок) синтезируются здесь.
import json, subprocess, pathlib, os
import numpy as np
from scipy import signal

ROOT = pathlib.Path(__file__).parent
SR = 48000
_warned = set()


def load(p, ch=1):
    p = pathlib.Path(p)
    if not p.exists():
        if p.name not in _warned:
            print(f"  нет файла {p.relative_to(ROOT) if p.is_relative_to(ROOT) else p} — вместо него тишина")
            _warned.add(p.name)
        return np.zeros(int(0.5 * SR), np.float32)
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "f32le", "-ac", str(ch), "-ar", str(SR), "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).copy()


def ev(name):
    """звук из sfx/"""
    return load(ROOT / "sfx" / name)


def db(x):
    return 10 ** (x / 20)


def bp(x, lo, hi, order=4):
    return signal.sosfilt(signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x).astype(np.float32)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x).astype(np.float32)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x).astype(np.float32)


def ir(rt, seed, early=()):
    n = int(rt * SR)
    r = np.random.default_rng(seed).standard_normal(n) * np.exp(-6.9 * np.arange(n) / n)
    r = lp(r, 5000)
    for d, g in early:
        r[int(d * SR)] += g
    return r / np.abs(r).max()


def reverb(x, rt, wet, seed=1, early=()):
    """комната/коридор: rt — длина хвоста, с; wet — доля эха 0..1"""
    y = signal.fftconvolve(x, ir(rt, seed, early))[: len(x)]
    y *= np.sqrt((x ** 2).mean() + 1e-12) / (np.sqrt((y ** 2).mean()) + 1e-12)
    return ((1 - wet) * x + wet * y).astype(np.float32)


def fade(x, a=0.01, b=0.05):
    x = np.asarray(x, np.float32).copy()
    na, nb = min(int(a * SR), len(x)), min(int(b * SR), len(x))
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


def loop_to(x, n, xf=2.0):
    k = min(int(xf * SR), len(x) // 2)
    out = np.zeros(n, np.float32)
    pos = 0
    while pos < n:
        seg = x.copy()
        if pos > 0 and k:
            seg[:k] *= np.sqrt(np.linspace(0, 1, k))
            m_ = min(k, n - pos)
            out[pos:pos + m_] *= np.sqrt(np.linspace(1, 0, k))[:m_]
        m = min(len(seg), n - pos)
        out[pos:pos + m] += seg[:m]
        pos += max(1, len(seg) - k)
    return out


def env_follow(x, att=0.03, rel=0.35):
    a = np.abs(x)
    a = signal.sosfilt(signal.butter(1, 30, fs=SR, output="sos"), a)
    out = np.zeros_like(a)
    ca, cr = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    v = 0.0
    for i in range(0, len(a), 32):
        s = a[i]
        v = ca * v + (1 - ca) * s if s > v else cr * v + (1 - cr) * s
        out[i:i + 32] = v
    return out


def rms(x):
    nz = x[np.abs(x) > 1e-4]
    return np.sqrt((nz ** 2).mean()) + 1e-9 if len(nz) else 1e-9


# ---------- синтез: простые звуки без файлов ----------
def tone(f0, f1, dur, g=0.6):
    """синус с глиссандо f0 -> f1 (сигналы устройств, писк рамки)"""
    tt = np.arange(int(dur * SR)) / SR
    f = f0 + (f1 - f0) * tt / dur
    return fade((np.sin(2 * np.pi * np.cumsum(f) / SR) * g).astype(np.float32), 0.003, 0.03)


def chime(f0=880, f1=1320):
    """двухнотный сигнал «устройство проснулось»"""
    tail = tone(f1, f1, 0.22) * np.exp(-np.arange(int(0.22 * SR)) / SR * 9).astype(np.float32)
    return np.concatenate([tone(f0, f0, 0.09), tail])


def click(dur=0.012, seed=1):
    """щелчок: кнопка, вилка, замок"""
    n = int(dur * SR)
    x = np.random.default_rng(seed).standard_normal(n) * np.exp(-np.arange(n) / n * 8)
    return fade(hp(x, 1500) * 0.8, 0.0005, 0.003)


def thump(f=70, dur=0.25, seed=2):
    """глухой удар/шаг по полу: низкий тон + шорох"""
    tt = np.arange(int(dur * SR)) / SR
    body = np.sin(2 * np.pi * f * tt * (1 - 0.3 * tt / dur)) * np.exp(-tt * 22)
    grit = lp(np.random.default_rng(seed).standard_normal(len(tt)), 900) * np.exp(-tt * 40) * 0.5
    return fade((body + grit).astype(np.float32), 0.002, 0.05)


def creak(dur=0.9, f=210, seed=3):
    """скрип половицы/двери: дрожащий тон с шумом"""
    tt = np.arange(int(dur * SR)) / SR
    rng = np.random.default_rng(seed)
    wob = f * (1 + 0.25 * np.sin(2 * np.pi * 3.1 * tt) + 0.08 * np.cumsum(rng.standard_normal(len(tt))) / np.sqrt(len(tt)))
    saw = 2 * ((np.cumsum(wob) / SR) % 1) - 1
    x = bp(saw * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 17 * tt))), 300, 2600) * np.sin(np.pi * tt / dur) ** 0.7
    return fade(x * 0.5, 0.02, 0.1)


def whoosh(dur=0.8, lo=300, hi=3000, seed=4):
    """нарастающий шорох (переход, рывок)"""
    n = int(dur * SR)
    x = np.random.default_rng(seed).standard_normal(n) * np.linspace(0, 1, n) ** 2
    return fade(bp(x, lo, hi) * 0.6, 0.01, 0.06)


def heartbeat(n_beats=6, bpm=70):
    beat = thump(55, 0.18, 7)
    out = np.zeros(int((n_beats * 60 / bpm + 0.5) * SR), np.float32)
    for k in range(n_beats):
        i = int(k * 60 / bpm * SR)
        out[i:i + len(beat)] += beat
        j = i + int(0.26 * SR)
        out[j:j + len(beat)] += beat * 0.7
    return lp(out, 400)


def speaker(x, lo=280, hi=7000, drive=1.4):
    """голос из маленького динамика (колонка, телефон на громкой)"""
    return (np.tanh(bp(x, lo, hi) * drive) / drive).astype(np.float32)


class Mix:
    def __init__(self, work=None):
        self.work = pathlib.Path(work or os.environ.get("WORK", ROOT / "eps" / "example")).resolve()
        b = self.work / "build"
        self.ST = json.loads((b / "story.json").read_text())
        self.WJ = json.loads((b / "words.json").read_text())
        mk = b / "marks.json"
        self.MK = json.loads(mk.read_text()) if mk.exists() else {}   # отметки времени из story.py (E.write(marks=...))
        self.PH = {p["id"]: p for p in self.WJ["phrases"]}
        self.DUR = self.ST["duration"]
        self.N = int(self.DUR * SR) + SR
        self.fx = np.zeros(self.N, np.float32)
        self._voices()

    # ---- время фраз и слов
    def T(self, pid):
        return self.PH[pid]["t0"]

    def TE(self, pid):
        return self.PH[pid]["t1"]

    def word(self, pid, stem):
        """начало слова фразы pid, которое начинается на stem"""
        i = self.PH[pid]["i"]
        return next(w["t0"] for w in self.WJ["words"] if w["ph"] == i and w["w"].lower().strip("«».,!?:—").startswith(stem))

    def shots(self, scene, key):
        return [s["p"][key] for s in self.ST["shots"] if s["scene"] == scene and key in s["p"]]

    # ---- раскладка
    def put(self, src, t, g=1.0, dst=None):
        dst = self.fx if dst is None else dst
        i = int(round(t * SR))
        if i < 0:
            src, i = src[-i:], 0
        n = min(len(src), len(dst) - i)
        if n > 0:
            dst[i:i + n] += src[:n] * g

    def curve(self, points):
        """огибающая громкости: [(время, дБ), ...]"""
        ts = np.array([p[0] for p in points]) * SR
        vs = np.array([db(p[1]) for p in points])
        return np.interp(np.arange(self.N), ts, vs).astype(np.float32)

    # ---- голоса: рассказчик нормируется, остальные — на уровень рассказчика (обработку меняет mix.py ролика)
    def _vo(self, name):
        p = self.work / "audio" / f"voice_{name}.wav"
        x = load(p) if p.exists() else np.zeros(self.N, np.float32)
        return np.pad(x, (0, max(0, self.N - len(x))))[: self.N]

    def _voices(self):
        narr = hp(self._vo("narr"), 75)
        self.narr = narr / (np.abs(narr).max() + 1e-9) * db(-3)
        self.R_NARR = rms(self.narr)
        self.vo = {}
        for v in sorted({p["voice"] for p in self.WJ["phrases"]} - {"narr"}):
            x = self._vo(v)
            self.vo[v] = x / rms(x) * self.R_NARR * db(-3)

    def voice(self, name):
        """сырая дорожка голоса — для своей обработки: M.vo["kol"] = обработка(M.voice("kol"))"""
        return self._vo(name)

    # ---- подложки: из sfx/room.mp3, sfx/drone.mp3, sfx/tick.mp3, если они есть, иначе синтез
    def beds(self):
        N, rng = self.N, np.random.default_rng(11)
        tt = np.arange(N) / SR
        f = ROOT / "sfx"
        if (f / "room.mp3").exists():
            bed = loop_to(ev("room.mp3"), N, xf=3.0)
        else:   # гул комнаты: тёмный шум с медленным «дыханием»
            bed = lp(rng.standard_normal(N), 420, 3) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * tt))
        if (f / "drone.mp3").exists():
            drone = loop_to(ev("drone.mp3"), N, xf=3.0)
        else:   # низкий дрон: две близкие ноты с биением + тёмный шум
            drone = (np.sin(2 * np.pi * 55 * tt) + 0.6 * np.sin(2 * np.pi * 55.4 * tt) + 0.35 * np.sin(2 * np.pi * 82.7 * tt)
                     + 0.4 * lp(rng.standard_normal(N), 160, 3) * 8)
            drone *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * tt)
        if (f / "tick.mp3").exists():
            tick = loop_to(ev("tick.mp3"), N, xf=0.3)
        else:   # настенные часы: щелчок раз в секунду, через один — чуть ниже
            tick = np.zeros(N, np.float32)
            for k in range(int(self.DUR) + 1):
                c = click(0.01, seed=20 + k % 2) * (1 if k % 2 else 0.7)
                self.put(lp(c, 3500 if k % 2 else 2500), k + 0.05, dst=tick)
        nrm = lambda x, fc: hp(x, fc) / (np.abs(hp(x, fc)).max() + 1e-9)
        return {"bed": nrm(bed, 30), "drone": nrm(drone, 35), "tick": nrm(tick, 300)}

    def duck(self, depth=0.6, att=0.03, rel=0.35):
        """множитель, приглушающий фон под голосом рассказчика"""
        d = env_follow(self.narr, att=att, rel=rel)
        return 1 - depth * np.clip(d / (np.percentile(d, 95) + 1e-9), 0, 1)

    def music(self, segments, level_db=-9, gain_curve=None, duck_depth=0.45):
        """segments: [(файл в music/, с какой секунды файла, с какой секунды ролика, до какой секунды ролика, fade_in)]"""
        m = np.zeros(self.N, np.float32)
        for fn, src0, t0, t1, fin in segments:
            x = load(ROOT / "music" / fn)[int(src0 * SR):]
            i0, n = int(t0 * SR), min(len(x), int((t1 - t0) * SR), self.N - int(t0 * SR))
            seg = x[:n].copy()
            if fin:
                k = min(int(fin * SR), n); seg[:k] *= np.linspace(0, 1, k) ** 0.5
            k = min(int(0.03 * SR), n)
            if k: seg[-k:] *= np.linspace(1, 0, k)
            m[i0:i0 + n] += seg
        if not np.any(m):
            return m
        m = hp(m, 40)
        m = m / rms(m) * self.R_NARR * db(level_db)
        if gain_curve is not None:
            m = m * gain_curve
        return m * self.duck(duck_depth, att=0.03, rel=0.4)

    def finish(self, amb, music=None, lufs=-15.0):
        mixd = self.narr + sum(self.vo.values(), np.zeros(self.N, np.float32)) + amb + self.fx
        if music is not None:
            mixd = mixd + music
        mixd = mixd / (np.abs(mixd).max() + 1e-9) * db(-1.0)
        raw = self.work / "audio" / "mix_raw.wav"
        pcm = (np.clip(mixd, -1, 1) * 32767).astype("<i2")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(raw)], input=pcm.tobytes(), check=True)
        meas = subprocess.run(["ffmpeg", "-nostats", "-i", str(raw), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
        I = float([l for l in meas.splitlines() if l.strip().startswith("I:")][-1].split()[1])
        gain = lufs - I
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", f"volume={gain:.2f}dB,alimiter=limit=0.89:attack=3:release=60:level=disabled",
                        "-ac", "2", "-ar", str(SR), str(self.work / "audio" / "mix.wav")], check=True)
        print(f"сведение: {self.DUR:.1f} с, исходно {I:.1f} LUFS, усиление {gain:+.1f} дБ")
