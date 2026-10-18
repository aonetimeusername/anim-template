# сборка ролика: python build.py <имя>
#   берёт eps/<имя>/build/script.json + eps/<имя>/story.py + eps/<имя>/mix.py -> eps/<имя>/out/<имя>.mp4 (1080×1920, 30 fps)
#   --skip-tts   не озвучивать заново (текст не менялся)
#   --no-render  только озвучка, раскадровка и звук (быстро; слушать eps/<имя>/audio/mix.wav)
#   --sheet      лист кадров каждые 1.5 с -> eps/<имя>/qa/sheet.jpg (проверить картинку до полного рендера)
import argparse, os, pathlib, shutil, subprocess, sys, json

ROOT = pathlib.Path(__file__).parent.resolve()
PY = sys.executable

ap = argparse.ArgumentParser()
ap.add_argument("ep", help="имя папки в eps/")
ap.add_argument("--skip-tts", action="store_true")
ap.add_argument("--no-render", action="store_true")
ap.add_argument("--sheet", action="store_true")
ap.add_argument("--jobs", type=int, default=max(1, min(4, (os.cpu_count() or 2) // 2)), help="сколько процессов рендера")
a = ap.parse_args()

if not shutil.which("ffmpeg"):
    sys.exit("нет ffmpeg — установите его (см. README.md)")
work = ROOT / "eps" / a.ep
if not (work / "build" / "script.json").exists():
    sys.exit(f"нет {work / 'build' / 'script.json'}")
for d in ("audio", "out", "qa"):
    (work / d).mkdir(exist_ok=True)
env = {**os.environ, "WORK": str(work), "PYTHONIOENCODING": "utf-8"}


def run(*cmd):
    subprocess.run([PY, *map(str, cmd)], cwd=ROOT, env=env, check=True)


if not a.skip_tts:
    run("tts.py")
run(work / "story.py")
run(work / "mix.py")
story = work / "build" / "story.json"

if a.sheet:
    dur = json.loads(story.read_text())["duration"]
    ts = [round(k * 1.5, 2) for k in range(int(dur / 1.5) + 1)]
    run("render.py", "--story", story, "--at", ",".join(map(str, ts)), "--sheet", work / "qa" / "sheet.jpg")
    sys.exit(0)
if a.no_render:
    sys.exit(0)

frames = work / "frames"
shutil.rmtree(frames, ignore_errors=True)
frames.mkdir()
procs = []
for k in range(a.jobs):
    log = open(work / "qa" / f"render_{k}.log", "w")
    procs.append((subprocess.Popen([PY, "render.py", "--story", str(story), "--part", f"{k}/{a.jobs}"], cwd=ROOT, env=env,
                                   stdout=log, stderr=subprocess.STDOUT), log))
print(f"рендер кадров в {a.jobs} процесса…", flush=True)
bad = []
for k, (p, log) in enumerate(procs):
    p.wait(); log.close()
    if p.returncode:
        bad.append(k)
if bad:
    sys.exit(f"рендер упал: см. {', '.join(str(work / 'qa' / f'render_{k}.log') for k in bad)}")
print(f"кадров: {len(list(frames.glob('f*.png')))}")

out = work / "out" / f"{a.ep}.mp4"
COLOR = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", str(frames / "f%05d.png"), "-i", str(work / "audio" / "mix.wav"),
                "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "17",
                "-profile:v", "high", *COLOR, "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", str(out)], check=True)
# лёгкая копия — переслать в мессенджере, посмотреть на телефоне
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "6M", "-bufsize", "12M",
                *COLOR, "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(work / "out" / f"{a.ep}_small.mp4")], check=True)
shutil.rmtree(frames)
for f in sorted((work / "out").glob("*.mp4")):
    print(f"{f.relative_to(ROOT)}  {f.stat().st_size / 1e6:.1f} МБ")
