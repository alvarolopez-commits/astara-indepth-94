"""Hero image of In Depth #94: takes the supplied banner (3:1, bright, teal, with a white wave at the bottom) and grades it to the page:
the wave is cropped, the hue moves from teal towards the template blue, shadows take the page purple, the left decorative pattern is dimmed,
and the banner is set on a 16:9 canvas whose top and bottom are a soft extension of its own edges (the cover is a 16:9 full-bleed image).
Usage (from the project folder):  python -X utf8 _build/make_hero94.py [DATA/hero94_source.png] [--preview out.png]
Writes deploy/img/hero94-1672.webp and deploy/img/hero94-840.webp. Parameters are at the top: change them and run again."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
argv = sys.argv[1:]
PREVIEW = argv[argv.index("--preview") + 1] if "--preview" in argv else None
args = [a for i, a in enumerate(argv) if not a.startswith("--") and (i == 0 or argv[i - 1] != "--preview")]
SRC = Path(args[0]) if args else ROOT / "DATA" / "hero94_source.png"

W, H = 1672, 941                       # cover canvas (16:9), as the #93 hero
BG = np.array([34, 30, 65]) / 255      # --bg of the page
CROP_BOTTOM = 0.82                     # keep the top 82 % of the banner: the white wave starts at about 83 %
HUE_SHIFT = 22                         # degrees: teal (180) -> blue (~202), the template accent is #8BCDFF
SAT = 0.86                             # a little less saturated
GAIN, GAMMA = 0.66, 1.18               # darken: gain on the light, gamma on the mids
LIFT = 0.60                            # shadows take this share of the page purple (screen blend)
LEFT_DIM = 0.80                        # strength of the dimming over the left decorative pattern
LEFT_REACH = 0.52                      # ... which reaches this fraction of the width
TOP = 232                              # y of the banner on the canvas (the title sits bottom-left)

src = Image.open(SRC).convert("RGB")
sw, sh = src.size
band = src.crop((0, 0, sw, int(sh * CROP_BOTTOM)))

# hue and saturation
hsv = np.asarray(band.convert("HSV")).astype(np.int16)
hsv[..., 0] = (hsv[..., 0] + round(HUE_SHIFT / 360 * 255)) % 256
hsv[..., 1] = np.clip(hsv[..., 1] * SAT, 0, 255)
a = np.asarray(Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")).astype(float) / 255

# darker, with the page purple in the shadows
a = np.clip(a, 0, 1) ** GAMMA * GAIN
a = 1 - (1 - a) * (1 - BG * LIFT)

# dim the left decorative pattern (the title sits there on wide screens)
x = np.linspace(0, 1, a.shape[1])
dim = np.clip(1 - x / LEFT_REACH, 0, 1) ** 1.3 * LEFT_DIM
a = a * (1 - dim[None, :, None]) + BG * dim[None, :, None] * .9

band = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "RGB")
bw, bh = band.size
nh = round(W * bh / bw)
band = band.resize((W, nh), Image.LANCZOS)

# 16:9 canvas: the banner in place; above and below, its own edge stretched, blurred, and fading into the page colour
canvas = Image.new("RGB", (W, H), tuple(int(c * 255) for c in BG))
def haze(edge_rows, height, flip):
    strip = band.crop((0, 0, W, edge_rows)) if not flip else band.crop((0, nh - edge_rows, W, nh))
    strip = strip.resize((W, height), Image.BICUBIC).filter(ImageFilter.GaussianBlur(38))
    return strip
FEATHER_TOP, FEATHER_BOT = 90, 110       # the banner fades into the haze instead of ending on a line
top_h, bot_y = TOP + FEATHER_TOP, TOP + nh - FEATHER_BOT      # the haze runs under the feathered edges
canvas.paste(haze(16, top_h, False), (0, 0)); canvas.paste(haze(16, H - bot_y, True), (0, bot_y))
ramp = np.ones(nh)
ramp[:FEATHER_TOP] = np.linspace(0, 1, FEATHER_TOP) ** 1.4
ramp[nh - FEATHER_BOT:] = np.linspace(1, 0, FEATHER_BOT) ** 1.4
mask = Image.fromarray((np.repeat(ramp[:, None], W, axis=1) * 255).astype(np.uint8), "L")
canvas.paste(band, (0, TOP), mask)
c = np.asarray(canvas).astype(float) / 255
y = np.arange(H)[:, None, None] / (H - 1)
top_fade = np.clip((TOP - np.arange(H)[:, None, None] + 40) / (TOP + 40), 0, 1) ** 1.2 * .62        # towards the page colour at the very top
bot_fade = np.clip((np.arange(H)[:, None, None] - (TOP + nh - 60)) / (H - (TOP + nh) + 60), 0, 1) ** 1.1 * .55
f = np.maximum(top_fade, bot_fade)
c = c * (1 - f) + BG * f
out = Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8), "RGB")

out_dir = ROOT / "deploy" / "img"
out.save(out_dir / "hero94-1672.webp", "WEBP", quality=80, method=6)
out.resize((840, round(840 * H / W)), Image.LANCZOS).save(out_dir / "hero94-840.webp", "WEBP", quality=78, method=6)
if PREVIEW: out.save(PREVIEW)
g = np.asarray(out.convert("L")).astype(float)
print(f"wrote hero94-1672.webp ({(out_dir / 'hero94-1672.webp').stat().st_size // 1024} KB) and hero94-840.webp ({(out_dir / 'hero94-840.webp').stat().st_size // 1024} KB); mean luma {g.mean():.0f} (the #93 hero: 50)")
