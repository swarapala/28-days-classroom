# Pixel-art icon: the game's cycle clock. A 32x32 pixel grid, scaled up with hard edges.
import math, sys
from PIL import Image
N = 32
INK, PANEL, CREAM, GAP = (29, 24, 40, 255), (46, 39, 64, 255), (243, 233, 210, 255), (29, 24, 40, 255)
PH = [((217, 80, 95, 255), 1, 5), ((233, 160, 79, 255), 6, 13), ((79, 174, 132, 255), 14, 14), ((123, 127, 212, 255), 15, 28)]
def phase_color(day):
    for col, a, b in PH:
        if a <= day <= b: return col
img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
px = img.load()
c = (N - 1) / 2
for y in range(N):
    for x in range(N):
        # rounded square background
        dx, dy = max(0, abs(x - c) - 11.5), max(0, abs(y - c) - 11.5)
        if math.hypot(dx, dy) <= 4.6: px[x, y] = INK
        r = math.hypot(x - c, y - c)
        if 7.6 <= r <= 13.6:
            ang = (math.degrees(math.atan2(x - c, -(y - c))) + 360) % 360   # 0 = straight up, clockwise
            day = int(ang / (360 / 28)) + 1
            col = phase_color(day)
            if day == 1: col = (240, 110, 120, 255)
            px[x, y] = col
        elif 13.6 < r <= 14.6 and px[x, y][3]: px[x, y] = PANEL
# needle pointing at day 1 (top), and a center dot
for y in range(9, 16): px[15, y] = CREAM; px[16, y] = CREAM
for (x, y) in [(14, 15), (15, 15), (16, 15), (17, 15), (14, 16), (15, 16), (16, 16), (17, 16), (15, 17), (16, 17), (15, 14), (16, 14)]: px[x, y] = CREAM
img.save("icon32.png")
for size in (16, 48, 180, 192, 512):
    img.resize((size, size), Image.NEAREST if size % 32 == 0 or size > 32 else Image.LANCZOS).save(f"icon{size}.png")
img.resize((256, 256), Image.NEAREST).save("preview256.png")
img.save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("ok")
