"""Render the portfolio's link-preview images with Pillow, fontTools and Noto Serif."""

from io import BytesIO
from pathlib import Path
import subprocess

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont, ImageOps

ASSETS = Path(__file__).resolve().parents[1] / "site" / "assets"
WIDTH, HEIGHT = 1200, 630
ARTWORK = (706, 36, 450, 558)


def load_fonts():
    serif = subprocess.check_output(["fc-match", "-f", "%{file}", "Noto Serif"], text=True)
    if not serif or "NotoSerif" not in Path(serif).name:
        raise RuntimeError("Install Noto Serif before rendering the share cards.")
    body = BytesIO()
    with TTFont(ASSETS / "fonts/body.woff2") as font:
        font.flavor = None
        font.save(body)
    return serif, body.getvalue()


def card(output, title, subtitle, artwork, *, palette=("#f4f6ef", "#1d302a", "#37594b"),
         title_size=83, contain=False, fonts=None):
    paper, ink, muted = palette
    serif, body = fonts or load_fonts()
    image = Image.new("RGB", (WIDTH, HEIGHT), paper)
    x, y, w, h = ARTWORK
    art = Image.open(artwork).convert("RGB") if isinstance(artwork, Path) else artwork
    if contain:
        art.thumbnail((w, h), Image.Resampling.LANCZOS)
        image.paste(art, (x+(w-art.width)//2, y+(h-art.height)//2))
    else:
        image.paste(ImageOps.fit(art, (w,h), Image.Resampling.LANCZOS), (x,y))

    font = ImageFont.truetype(serif, title_size)
    text = ImageFont.truetype(BytesIO(body), 31)
    draw = ImageDraw.Draw(image)
    heading = title.split("\n")
    blurb = subtitle.split("\n")
    leading = round(title_size*1.13)
    height = leading*(len(heading)-1)+title_size+37+41*len(blurb)
    top = (HEIGHT-height)//2-5
    for i,line in enumerate(heading):
        if draw.textlength(line,font=font)>594:
            raise ValueError(f"Title overflows the card: {line!r}")
        draw.text((70,top+i*leading),line,font=font,fill=ink,anchor="lt")
    for i,line in enumerate(blurb):
        if draw.textlength(line,font=text)>594:
            raise ValueError(f"Subtitle overflows the card: {line!r}")
        draw.text((73,top+leading*(len(heading)-1)+title_size+37+i*41),line,
                  font=text,fill=muted,anchor="lt")
    if output.suffix==".png":
        image.save(output,optimize=True)
    else:
        image.save(output,quality=91,optimize=True,progressive=True,subsampling=0)


def collection_art(photos):
    art = Image.new("RGB", (450, 558), "#f4f6ef")
    for index,name in enumerate(("conjectures", "flyover", "factoring-bead", "cpu-switch")):
        with Image.open(photos / (name+".webp")) as source:
            tile = ImageOps.fit(source, (221,275), Image.Resampling.LANCZOS)
        art.paste(tile, (index%2*229,index//2*283))
    return art


def main():
    photos = ASSETS / "prints"
    directory = ASSETS / "share"
    directory.mkdir(exist_ok=True)
    fonts = load_fonts()
    cards = [
        ("portfolio", "Cinna Davis", "Software, mathematics\nand research", collection_art(photos), 86),
        ("about", "About\nCinna Davis", "Research, software\nand robotics", ASSETS / "studio/reefscape.webp", 82),
        ("projects", "Project shelf", "Software, experiments\nand mathematical results", collection_art(photos), 80),
        ("factoring", "Deterministic\ninteger factoring", "Worst-case bounds and\na Lean-checked proof", photos / "factoring-bead.webp", 65),
        ("hack-cpu", "The Hack CPU", "Branch prediction on a\ntwo-stage processor", photos / "cpu-switch.webp", 80),
        ("conway-99", "Conway’s\n99-graph", "A rook-grid bound for\nan open graph problem", photos / "conway.webp", 85),
        ("imsa-map", "IMSA\nschedule map", "Turn class rows into\na printable room list", photos / "schedule.webp", 82),
        ("research-notes", "Research\nnotes", "Proofs and computational\nverification records", ASSETS / "furniture/research-binding.webp", 84),
    ]
    for slug,title,blurb,art,size in cards:
        card(directory / (slug+"-v1.jpg"),title,blurb,art,title_size=size,fonts=fonts)


if __name__=="__main__":
    main()
