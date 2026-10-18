# пример ролика: раскадровка. Логика: колонку в спальне позвали из прихожей; вы молчите и выдёргиваете её из розетки,
# но в прихожей есть вторая колонка — и скрип становится ближе.
# Времена берём из озвучки (build/words.json): t("id") — начало фразы, te("id") — конец, wf("id", "нача") — начало слова.
# E.shot(сцена, с какого времени, параметры сцены, камера) — кадры идут друг за другом; E.add(плашка, t0, t1, ...) — поверх.
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from storylib import Ep

E = Ep()
t, te, wf = E.t, E.te, E.wfind
Z = lambda a, b, **k: dict(z0=a, z1=b, **k)          # камера: зум от z0 к z1 за кадр, ox/oy — сдвиг
T_CREAK = wf("creak", "скрип")
T_PULL = te("r2") + 0.15                             # рывок шнура
T_NEAR = wf("end", "ближ")
T_END = min(te("end") + 1.3, E.dur - 0.05)

# состояния колонок: [[t0, t1, 'speak'|'listen'], ...]
RING = [[-2, te("k1"), "speak"], [te("k1"), T_PULL, "listen"]]
HALL = [[-10, E.dur + 1, "listen"]]
BED = lambda **k: {"ring": RING, **k}
SPK = lambda **k: {"ring": RING, **k}
# схема квартиры сверху: вы в кровати, точка угрозы идёт из прихожей к двери спальни
P = dict(bed=[94, 135], spk_bed=[126, 113], hall=[202, 230], bed_door=[112, 186])
PLAN = {"you": P["bed"], "it": [[T_CREAK, 202, 236], [T_CREAK + 0.9, 150, 214]], "ping": [T_CREAK],
        "dev": [[-10, T_PULL, "spk_bed"]]}

E.shot("bedroom", -1.0, BED(), Z(1.08, 1.14, ox=-20, oy=-40))                         # 0: колонка говорит сама
E.shot("smart_speaker", t("hook") - 0.05, SPK(), Z(1.0, 1.08))
E.shot("bedroom", wf("hook", "молч") - 0.05, BED(still=True), Z(1.5, 1.6, ox=-55, oy=-70))
E.shot("bedroom", wf("hook", "её") - 0.05, BED(still=True), Z(1.2, 1.26, ox=-40, oy=-45))
E.shot("smart_speaker", t("r1") - 0.05, SPK(), Z(1.08, 1.2))                          # правило 1
E.shot("bedroom", wf("r1", "тот") - 0.05, BED(still=True), Z(1.45, 1.55, ox=-55, oy=-60))
E.shot("plan", t("creak") - 0.05, PLAN, Z(1.1, 1.16, oy=-110))                       # зло действует
E.shot("bedroom", t("r2") - 0.05, BED(), Z(1.15, 1.25, ox=-40, oy=-50))                # правило 2
E.shot("smart_speaker", wf("r2", "выдер") - 0.05, SPK(unplug=T_PULL), Z(1.0, 1.06))
E.shot("hall_speaker", t("end") - 0.05, {"red": True, "ring": HALL, "door": [T_NEAR, T_NEAR + 2.0]}, Z(1.0, 1.06))
E.shot("hall_speaker", T_NEAR - 0.05, {"red": True, "ring": HALL, "door": [T_NEAR, T_NEAR + 2.0],
                                       "occlude": [T_NEAR + 0.3, T_NEAR + 1.2]}, Z(1.1, 1.45, ox=13, oy=-41))

# фишка «Вас снимают»: видоискатель всё время (на схеме — только уголки), рамка «ВЫ» и щель двери на кадрах спальни
for i, sh in enumerate(E.shots):
    sh_t1 = E.shots[i + 1]["t0"] if i + 1 < len(E.shots) else T_END
    E.add("vf", -2 if i == 0 else sh["t0"], min(sh_t1, T_END), clock0=3 * 3600 + 4 * 60 + 12, bare=sh["scene"] == "plan")
    if sh["scene"] == "bedroom":
        E.add("peek", sh["t0"], sh_t1, peek="door", l=36, r=326)
        E.add("track", sh["t0"] if i else -0.1, sh_t1, box=[104, 222, 122, 52])
# плашки: правила и подсказки
E.add("stk", t("r1"), wf("r1", "тот") - 0.1, n="1", text="Не отвечать", x=180, y=96, rot=-2)
E.add("chip", T_CREAK, te("creak") + 0.3, text="прихожая · движение", color="red", x=180, y=150)
E.add("stk", t("r2"), wf("r2", "выдер") - 0.05, n="2", text="Из розетки", x=180, y=96, rot=1.5)
E.add("chip", t("end"), T_NEAR - 0.1, text="колонка · прихожая", color="red", x=180, y=96)

E.write(fades=[{"t0": T_END, "t1": E.dur + 1, "a0": 1, "a1": 1}],
        kicks=[wf("hook", "вы"), T_CREAK, T_PULL, T_NEAR],
        cap_off=[[te("end") + 0.6, E.dur + 1]],
        marks={"end": T_END, "creak": T_CREAK, "pull": T_PULL, "near": T_NEAR}, look="night")
