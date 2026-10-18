# Каталог сцен

Полное описание параметров `p` и проверенные камеры — в шапке каждого файла. Все времена в `p` — абсолютные (время ролика).
Быстро посмотреть сцену: `python scene_test.py <сцена> '<json p>' --dur 6 --at 0,1,2,3,4,5 --look night`.

## Набор «Многоэтажка» (квартира ночью) — `engine/scenes/k_*.js`

| сцена | файл | что в кадре | главные параметры |
|---|---|---|---|
| `bedroom` | k_bedroom.js | спальня, вид сбоку: девушка в кровати, колонка на тумбочке, жалюзи, щель двери | `ring`, `phone`, `under`, `still` |
| `smart_speaker` | k_smart_speaker.js | умная колонка крупно на тумбочке, стакан, свет кольца | `ring`, `unplug` (рука выдёргивает шнур), `countdown`, `redRing`, `glitch` |
| `phone_log` | k_phone_log.js | телефон в руке: «История запросов» умного дома | `tScroll`, `tHighlight`, `play`, `rows`, `newRow`, `notif`, `clock` |
| `hall_speaker` | k_hall_speaker.js | вид из спальни в коридор: вторая колонка в прихожей | `ring`, `red`, `occlude` (силуэт проходит), `door` (дверь открывается) |
| `hall_intercom` | k_hall_intercom.js | прихожая: трубка видеодомофона, дверь, парень в полный рост | `at`, `ring`, `flicker`, `knock`, `peepOff`, `bare` |
| `intercom_screen` | k_intercom_screen.js | экран домофона: площадка, дверь «47», фигура | `figure` (`kind:'stranger'`, `tag`, `d`), `glitch`, `call`, `off`, `keys`, `handle47` |
| `peephole_view` | k_peephole_view.js | вид в глазок (рыбий глаз) на площадку | `flicker`, `figure` |
| `door_lock` | k_door_lock.js | входная дверь изнутри крупно | `tKey`, `turn`, `keyhole`, `handle`, `feet`, `pass`, `peep`, `bare` |
| `coat_pocket` | k_coat_pocket.js | рука в кармане куртки, ищет ключи | `tIn`, `tOut`, `dim` |
| `plan` | k_plan.js | схема квартиры сверху, точка угрозы, рамка «ВЫ» | `you`, `it` (путь угрозы), `ping`, `dev` (активные устройства) |
| `building` | k_building.js | панельная многоэтажка ночью, окна | `you` [колонна, этаж], `climb` (свет подъезда по этажам), `off` (дом гаснет) |

## Набор «Школа ночью» — `engine/scenes/a…f_scenes.js, corridor.js, section.js, g_*.js`

| сцена | файл | что в кадре |
|---|---|---|
| `speaker_close`, `school_ext`, `endcard` | a_scenes.js | динамик громкой связи крупно; фасад школы ночью; финальный титр |
| `classroom`, `window_phone` | b_scenes.js | класс; окно и телефон |
| `journal`, `phone_ui` | c_scenes.js | классный журнал; экран телефона |
| `gym`, `door_out`, `wall_wires` | d_scenes.js | спортзал; дверь наружу; провода в стене |
| `chair_door`, `exit_canopy` | e_scenes.js | стул под ручкой двери; козырёк выхода |
| `room214_dark`, `handle` | f_scenes.js | тёмный кабинет; дверная ручка крупно |
| `corridor` | corridor.js | школьный коридор сбоку: двери, окна, динамик, люди и тени (`actors`), сирена |
| `section` | section.js | разрез школы на 3 этажа: динамики, микрофоны, кабинеты загораются |
| `horn_close` | g_horn.js | рупор громкой связи |
| `mom_close` | g_mom.js | мама крупно (образец, как рисовать человека крупно) |
| `smoke_detector` | g_smoke.js | датчик дыма на потолке |
| `yard_gate` | g_yard.js | двор и ворота ночью, снег, свет фонаря |

## Демо-сцены — `engine/scenes.js`

`black`, `demo_door`, `demo_peep`, `demo_room` — короткие примеры, как собрать сцену из готовых рисунков lib.js.

## Готовые рисунки в `engine/lib.js`

- Примитивы SVG: `R` (прямоугольник), `L` (линия), `Ci` (круг), `P` (path), `T` (текст), `G` (группа с transform).
- Время: `lin(t, a, b)` 0→1 на отрезке, `ease`, `eout`, `ein`, `mix(a, b, u)`, `clamp`, `kf(keys, u)` — ключевые кадры; шум `hash`, `noise1`.
- Рисунки: `person({x, y, h, pose: stand|walk|reach|sit|crouch|phone|look, face, t, sil})`, `shadow`, `door`, `windowW`, `candle`, `phone`, `bubble`, `radiator`, `peephole`, `dashed`, `stars`, `snow`, `speakerBox`, `rings`.
- Палитра `C` (ночь, тёмно-синие тона), градиенты `glowW` (тёплый свет), `glowC` (холодный), `glowR` (красный), `GROUND = 372`.

## Плашки поверх кадра (story.py → `E.add`)

| вид | для чего | параметры |
|---|---|---|
| `stk` | наклейка-правило «1. Не отвечать» | `n`, `text`, `x`, `y`, `rot` |
| `chip` | короткая подпись | `text`, `color`: red / dark / white / green, `x`, `y` |
| `hand` | рукописная заметка | `text`, `sub`, `x`, `y`, `rot` |
| `mono` | моноширинная подпись | `text`, `x`, `y` |
| `part` | крупный титр | `text`, `sub`, `y`, `size` |
| `track` | красная рамка захвата «ВЫ» | `box=[x,y,w,h]` или `keys=[[t,x,y,w,h],...]`, `text` |
| `vf` | видоискатель: уголки, ● REC, таймкод | `clock0` (секунды суток в t=0), `bare`, `label` |
| `peek` | передний план укрытия, откуда смотрят | `peek`: door / slit / corner, `l`, `r`, `tOpen`, `l1`, `r1` |
