# раскадровка ролика: времена слов -> кадры, плашки, субтитры.
# ролик пишет свой story.py: E = Ep(); E.shot(...); E.add(...); E.write(...)
import json, pathlib, re, os

ROOT = pathlib.Path(__file__).parent
NUMS = [  # слова → цифры в субтитрах (диктор читает словами, на экране — цифрами); дополняйте под свой сюжет
    (["три", "часа", "ночи"], "3 часа ночи"), (["пять", "минут"], "5 минут"), (["девятый", "этаж"], "9 этаж"),
    (["сорок", "семь"], "47"), (["восемь", "секунд"], "8 секунд")]


def bare(w):
    return re.sub(r"[^\wё]", "", w.lower())


class Ep:
    def __init__(self, work=None):
        self.work = pathlib.Path(work or os.environ["WORK"]).resolve()
        self.wj = json.loads((self.work / "build" / "words.json").read_text())
        self.sc = json.loads((self.work / "build" / "script.json").read_text())
        self.W = self.wj["words"]
        self.PH = {p["id"]: p for p in self.wj["phrases"]}
        self.PIDX = {p["id"]: p["i"] for p in self.wj["phrases"]}
        self.dur = self.wj["duration"]
        self.shots, self.ov = [], []

    # ---- время
    def ph(self, pid):
        return self.PH[pid]

    def t(self, pid):
        return self.PH[pid]["t0"]

    def te(self, pid):
        return self.PH[pid]["t1"]

    def wt(self, pid, k=0, end=False):
        ws = [w for w in self.W if w["ph"] == self.PIDX[pid]]
        return ws[k]["t1"] if end else ws[k]["t0"]

    def wfind(self, pid, stem, end=False):
        for w in self.W:
            if w["ph"] == self.PIDX[pid] and bare(w["w"]).startswith(stem):
                return w["t1"] if end else w["t0"]
        raise KeyError(f"{pid}: {stem}")

    # ---- кадры и плашки
    def shot(self, scene, t_start, p=None, cam=None):
        # первый кадр может начаться «до нуля»: тогда въезд/анимация появления уже прошли к нулевому кадру
        self.shots.append({"t0": round(t_start if not self.shots else max(0, t_start), 3), "scene": scene, "p": p or {}, "cam": cam or {}})

    def add(self, kind, t0, t1, **k):
        self.ov.append({"kind": kind, "t0": round(t0, 3), "t1": round(t1, 3), **k})

    # ---- субтитры: числа цифрами, страницы ≤2 строки по ≤14 знаков, разрыв на конце предложения и смене фразы
    def _pages(self):
        W, merged, i = self.W, [], 0
        while i < len(W):
            for seq, disp in NUMS:
                if [bare(w["w"]) for w in W[i:i + len(seq)]] == seq and len({w["ph"] for w in W[i:i + len(seq)]}) == 1:
                    last = W[i + len(seq) - 1]
                    tail = re.sub(r"^[\wё]+", "", last["w"])
                    c = next((w["c"] for w in W[i:i + len(seq)] if w["c"]), "")
                    merged.append({**W[i], "w": disp + tail, "t1": last["t1"], "c": c})
                    i += len(seq)
                    break
            else:
                merged.append(dict(W[i]))
                i += 1
        W = merged
        pages, cur, line, lines = [], [], 0, 1
        for i, w in enumerate(W):
            L_ = len(w["w"])
            new_page = bool(cur) and (W[cur[-1]]["ph"] != w["ph"] or re.search(r"[.?!:]»?$", W[cur[-1]]["w"]))
            if not new_page and cur and line + 1 + L_ > 14:
                if lines == 2:
                    new_page = True
                else:
                    W[cur[-1]]["br"] = 1
                    lines, line = 2, L_
                    cur.append(i)
                    continue
            if new_page:
                pages.append(cur)
                cur, line, lines = [], 0, 1
            cur.append(i)
            line = line + (1 if line else 0) + L_
        if cur:
            pages.append(cur)
        words = [{"w": w["w"], "t0": w["t0"], "t1": w["t1"], "c": w["c"], **({"br": 1} if w.get("br") else {})} for w in W]
        return words, pages

    def write(self, fades=(), kicks=(), cap_off=None, marks=None, look=None):
        """fades — затемнения [{t0,t1,a0,a1}], kicks — толчки камеры (удары), cap_off — где спрятать субтитры,
        marks — отметки времени для mix.py (M.MK), look — цвет: night | mono | muted | cctv | riso.
        первый кадр НЕ затемняем: в ленте он решает, листают ли дальше"""
        for i, s in enumerate(self.shots):
            s["t1"] = self.shots[i + 1]["t0"] if i + 1 < len(self.shots) else self.dur
        words, pages = self._pages()
        story = {"duration": self.dur, "shots": self.shots, "overlays": self.ov, "words": words, "pages": pages,
                 "fades": list(fades), "kicks": list(kicks), "capFrom0": True, "capOff": cap_off or [[self.wj["voice_end"] + 0.1, self.dur + 1]]}
        if look:
            story["look"] = look   # цветовое решение выпуска (engine/runtime.js LOOKS)
        (self.work / "build" / "story.json").write_text(json.dumps(story, ensure_ascii=False, indent=1))
        (self.work / "build" / "marks.json").write_text(json.dumps(marks or {}, ensure_ascii=False, indent=1))
        print(f"кадров {len(self.shots)}, плашек {len(self.ov)}, страниц субтитров {len(pages)}, длина {self.dur:.1f} с")
        print("сцены:", [s["scene"] for s in self.shots])
