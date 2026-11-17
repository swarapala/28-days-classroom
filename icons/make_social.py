# Link preview image (1200x630) for emails, texts, Google Classroom and social posts.
# Run with: python3 icons/make_social.py   (needs Pillow; reads icons/icon-512.png and the game font)
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
INK, CREAM, ROSE, HL, DIM, LINE = "#1d1828", "#f3e9d2", "#e36b7b", "#f2c14e", "#b3acc2", "#3a3150"
img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)
font = lambda size: ImageFont.truetype("play/fonts/Jersey15.woff2", size)
# soft pixel "stars" and a frame
for i in range(90):
    x, y = (i * 137) % W, (i * 89 + (i * i) % 53) % H
    d.rectangle([x, y, x + 3, y + 3], fill=LINE)
d.rectangle([18, 18, W - 19, H - 19], outline=CREAM, width=6)
d.rectangle([28, 28, W - 29, H - 29], outline=INK, width=4)
# the cycle-clock icon, scaled up with hard pixel edges
icon = Image.open("icons/icon-512.png").convert("RGBA").resize((352, 352), Image.NEAREST)
img.paste(icon, (88, (H - 352) // 2), icon)
# title
x0 = 500
f_big, f_mid, f_small = font(170), font(54), font(40)
d.text((x0 + 6, 96 + 8), "28", font=f_big, fill=LINE)
d.text((x0, 96), "28", font=f_big, fill=ROSE)
w28 = d.textlength("28 ", font=f_big)
d.text((x0 + w28 + 6, 96 + 8), "DAYS", font=f_big, fill=LINE)
d.text((x0 + w28, 96), "DAYS", font=f_big, fill=CREAM)
# badge
badge = "Classroom Edition"
bw = d.textlength(badge, font=f_mid)
d.rounded_rectangle([x0, 300, x0 + bw + 44, 300 + 74], radius=10, fill=HL)
d.text((x0 + 22, 304), badge, font=f_mid, fill=INK)
# tagline + address
d.text((x0, 412), "A free game that teaches", font=f_mid, fill=CREAM)
d.text((x0, 468), "the menstrual cycle", font=f_mid, fill=CREAM)
d.text((x0, 548), "learn28days.org", font=f_small, fill=DIM)
img.save("icons/social.png", optimize=True)
print("saved icons/social.png")
