# пример ролика: звук. Все эффекты синтезируются (mixlib.py); свои файлы — в sfx/ через ev("имя.mp3"), музыка — в music/.
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from mixlib import Mix, ROOT, SR, db, lp, hp, fade, reverb, tone, chime, click, thump, creak, whoosh, heartbeat, speaker, rms
import numpy as np

M = Mix()
T, TE, MK = M.T, M.TE, M.MK
T_END, T_PULL, T_NEAR = MK["end"], MK["pull"], MK["near"]

# голос колонки: маленький динамик + комната
kol = reverb(speaker(M.voice("kol")), 0.3, 0.18, seed=17)
M.vo["kol"] = kol / rms(kol) * M.R_NARR * db(-3)

# писк захвата рамки «ВЫ» в первые доли секунды — подпись канала
bip = tone(2400, 2400, 0.05)
M.put(bip, 0.04, db(-30)); M.put(bip, 0.13, db(-32))

# подложки: гул комнаты, часы, низкий дрон нарастает к финалу
B = M.beds()
bed_g = M.curve([(0, -30), (T_END - 0.01, -30), (T_END, -90), (M.DUR, -90)])
tick_g = M.curve([(0, -34), (T("end"), -34), (T("end") + 0.3, -90), (M.DUR, -90)])
drone_g = M.curve([(0, -40), (T("creak"), -30), (T("end"), -22), (T_END - 0.05, -16), (T_END, -90), (M.DUR, -90)])
amb = (B["bed"] * bed_g + B["tick"] * tick_g + B["drone"] * drone_g) * M.duck()

# толчки камеры — глухой удар
for k in M.ST["kicks"]:
    M.put(lp(thump(48, 0.6), 300), k - 0.02, db(-14))
# колонка слушает: сигнал после её вопроса
M.put(chime(), TE("k1") + 0.05, db(-24))
# половица, сердце
M.put(reverb(creak(1.0), 1.2, 0.35, seed=5), MK["creak"] - 0.05, db(-14))
M.put(fade(heartbeat(7, 72), 0.05, 0.5), MK["creak"] + 0.6, db(-12))
# рывок шнура: шорох, щелчок вилки, колонка гаснет
M.put(whoosh(0.35, 900, 5000), T_PULL - 0.35, db(-20))
M.put(click(0.015, 3), T_PULL + 0.01, db(-10))
M.put(tone(620, 140, 0.35, 0.45), T_PULL + 0.05, db(-24))
# вторая колонка в прихожей включилась; шаги и скрип ближе
M.put(reverb(chime(700, 1050), 1.2, 0.4, seed=5), T("end") - 0.1, db(-26))
for k in range(3):
    M.put(reverb(thump(80, 0.3, 30 + k), 1.0, 0.4, seed=9), T_NEAR + 0.25 + k * 0.45, db(-16 + 2 * k))
M.put(reverb(creak(1.4, 170, seed=8), 0.8, 0.3, seed=6), T_NEAR + 0.2, db(-13))

# музыка: положите свой трек в music/theme.mp3 — иначе ролик без музыки
music = None
if (ROOT / "music" / "theme.mp3").exists():
    mus_g = M.curve([(0, -2), (T("end") - 0.05, -2), (T("end"), -90), (M.DUR, -90)])
    music = M.music([("theme.mp3", 0, 0, T("end") + 0.05, 0.15)], level_db=-10, gain_curve=mus_g)

kill = np.ones(M.N, np.float32); kill[int(T_END * SR):] = 0     # после финала — тишина
M.narr *= kill; M.fx *= kill
M.finish(amb * kill, None if music is None else music * kill)
