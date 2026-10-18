# проверка одной сцены без озвучки: лист кадров по временам
#   python scene_test.py <сцена> '<json параметров p>' --dur 6 --at 0,1,2.5,4 --out qa/scene_<сцена>.jpg [--cam '{"z0":1,"z1":1.05}']
# сцена получает (u, p, d, t): u — время от начала кадра, d — длина кадра, t — абсолютное время (здесь t = u)
import argparse, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import render
from render import run, sheet

ap = argparse.ArgumentParser()
ap.add_argument("scene"); ap.add_argument("p", nargs="?", default="{}")
ap.add_argument("--dur", type=float, default=6.0)
ap.add_argument("--at", default="0,1,2,3,4,5")
ap.add_argument("--cam", default='{"z0":1,"z1":1.04}')
ap.add_argument("--out", default=None)
ap.add_argument("--look", default="", help="цветовое решение: night | mono | muted | cctv | riso")
ap.add_argument("--extra", default="", help="черновые .js через запятую — грузятся после engine/scenes и перекрывают одноимённые сцены")
a = ap.parse_args()
ts = [float(x) for x in a.at.split(",")]
story = {"duration": a.dur, "shots": [{"t0": 0, "t1": a.dur, "scene": a.scene, "p": json.loads(a.p), "cam": json.loads(a.cam)}],
         "overlays": [], "words": [], "pages": [], "fades": [], "kicks": [], **({"look": a.look} if a.look else {})}
out = pathlib.Path(a.out or f"qa/scene_{a.scene}.jpg")
out.parent.mkdir(parents=True, exist_ok=True)
render.EXTRA = [x for x in a.extra.split(",") if x]
paths = run(ts, out.parent / (out.stem + "_frames"), story)
sheet(paths, [f"{t:.2f}s" for t in ts], out, cols=min(6, len(ts)))
print(out)
