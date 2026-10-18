# рендер кадров: engine/index.html + build/story.json -> PNG 1080x1920
#   python render.py               — все кадры в frames/ (30 fps)
#   python render.py --at 1,5.5,9 [--story my.json --sheet qa/x/at.jpg]  — контактный лист
import json, sys, pathlib, os
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
WORK = pathlib.Path(os.environ.get("WORK", ROOT / "eps" / "example")).resolve()   # папка ролика: build/ audio/ frames/
FPS = 30
EXTRA = []


def run(times, outdir, story, start_index=0, clean=True):
    outdir.mkdir(parents=True, exist_ok=True)
    if clean:
        for f in outdir.glob("f*.png"):
            f.unlink()
    with sync_playwright() as p:
        try:
            b = p.chromium.launch(channel="chrome")      # установленный Google Chrome
        except Exception:
            b = p.chromium.launch()                      # или Chromium из `python -m playwright install chromium`
        pg = b.new_page(viewport={"width": 360, "height": 640}, device_scale_factor=3)
        pg.goto((ROOT / "engine" / "index.html").as_uri())
        for js in sorted((ROOT / "engine" / "scenes").glob("*.js")):
            pg.add_script_tag(path=str(js))
        for js in EXTRA:                       # черновые сцены (scene_test.py --extra)
            pg.add_script_tag(path=str(js))
        pg.evaluate("document.fonts.ready")
        pg.evaluate("s => init(s)", story)
        # прогрев шрифтов: отрисовать все варианты
        pg.evaluate("render(0,0)")
        pg.evaluate("document.fonts.ready")
        paths = []
        for i, t in enumerate(times):
            pg.evaluate(f"render({t},{round(t * FPS)})")
            path = outdir / f"f{start_index + i:05d}.png"
            pg.screenshot(path=str(path))
            paths.append(path)
            if i % 150 == 0:
                print(f"{t:.1f}s", flush=True)
        b.close()
    return paths


def sheet(paths, labels, out, cols=6, w=270):
    from PIL import Image, ImageDraw
    h = int(w * 16 / 9)
    rows = (len(paths) + cols - 1) // cols
    s = Image.new("RGB", (cols * (w + 8), rows * (h + 24)), (45, 45, 45))
    d = ImageDraw.Draw(s)
    for i, (p, lab) in enumerate(zip(paths, labels)):
        x, y = (i % cols) * (w + 8) + 4, (i // cols) * (h + 24) + 20
        s.paste(Image.open(p).convert("RGB").resize((w, h)), (x, y))
        d.text((x, y - 15), lab, fill=(255, 220, 0))
    s.save(out, quality=88)


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--at", help="времена через запятую -> контактный лист")
    ap.add_argument("--story", default=str(WORK / "build" / "story.json"))
    ap.add_argument("--sheet", default=str(ROOT / "qa" / "at.jpg"), help="куда положить контактный лист")
    ap.add_argument("--part", default="0/1", help="k/n — рендерить k-ю из n частей (для параллельного запуска)")
    ap.add_argument("--extra", default="", help="черновые сцены .js через запятую (перекрывают одноимённые)")
    a = ap.parse_args()
    EXTRA[:] = [x for x in a.extra.split(",") if x]
    story = json.loads(pathlib.Path(a.story).read_text())
    if a.at:
        ts = [float(x) for x in a.at.split(",")]
        sheet_path = pathlib.Path(a.sheet)
        paths = run(ts, sheet_path.parent / (sheet_path.stem + "_frames"), story)
        sheet(paths, [f"{t:.2f}s" for t in ts], sheet_path, cols=min(6, len(ts)))
        print(sheet_path)
    else:
        n = int(round(story["duration"] * FPS))
        k, m = map(int, a.part.split("/"))
        lo, hi = n * k // m, n * (k + 1) // m
        run([i / FPS for i in range(lo, hi)], WORK / "frames", story, start_index=lo, clean=False)
        print(f"frames {lo}..{hi - 1} of {n}")
