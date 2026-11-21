"""Draw the project artwork as SVG, then publish its three WebP sizes."""
from html import escape
from math import cos, hypot, pi, sin
from pathlib import Path
import random
import subprocess
import tempfile

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1] / 'site' / 'assets'
W, H = 720, 900
INK = '#253e4a'
IVORY = '#f5dfad'


def path(d, fill='none', stroke='none', width=1, extra=''):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round" {extra}/>'


def rect(x, y, w, h, fill, radius=0, extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" {extra}/>'


def ellipse(x, y, rx, ry, fill, extra=''):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" {extra}/>'


def line(points, color, width, extra=''):
    return path('M' + ' '.join(f'{x:.2f},{y:.2f}' for x, y in points), stroke=color, width=width, extra=extra)


def scene(title, background, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'<title>{escape(title)}</title>\n{rect(0, 0, W, H, background)}\n{body}\n</svg>\n')


def flyover():
    art = [ellipse(105, 140, 108, 108, '#f9d299'),
           path('M0 581 128 530 227 569 381 469 511 546 594 504 720 556V751H0Z', '#ec9c78'),
           path('M0 655 104 620 221 664 364 580 487 634 597 604 720 642V840H0Z', '#d77b62'),
           path('M0 745Q189 661 398 692Q575 728 720 657V900H0Z', '#e4b455'),
           path('M0 849Q253 779 410 759Q579 746 720 690V900H0Z', '#efca6c')]
    for offset in [0, 24, 49]:
        art.append(path(f'M-20 {450+offset}C106 {285+offset} 237 {342+offset} 350 {346+offset}Q421 {349+offset} 475 268',
                        stroke='#ffdaa6', width=4 + offset / 11, extra='opacity=".74"'))
    # The wheels sit on paired struts anchored beneath the same wing spar.
    art.append('<g transform="translate(508 230) rotate(-24)">')
    art.extend([path('M-86 2-116-26-104-29-40-8 -12 8Z', '#f9dcb1'),
                path('M-104 7-119 30-99 28-52 14Z', '#d79f73'),
                path('M-96 2Q-60-2-32-20Q0-35 40-20L96-4Q112 3 96 16L-82 15Z', '#faecc4'),
                path('M-30-10Q-3-30 27-22L50-9H-33Z', '#38606a'),
                path('M-8-23 2-11 M20-23 30-11', stroke='#f2dca9', width=3),
                path('M-84 10 97 8', stroke='#ba4f44', width=5),
                path('M-13 3-83-66Q-92-78-73-76L22-8Z', '#f0cf96'),
                path('M0 1 62 69Q78 88 56 80L-29 18Z', '#f6d99f'),
                path('M16 18 19 41 26 48 M44 16 49 43 55 48', stroke='#3a4140', width=4.5),
                ellipse(26, 49, 7, 10, INK), ellipse(55, 49, 7, 10, INK),
                ellipse(27, 49, 2.4, 3, '#b79d7e'), ellipse(56, 49, 2.4, 3, '#b79d7e'),
                ellipse(105, 6, 6, 38, '#f8dba0', 'opacity=".72"'), ellipse(105, 6, 6, 5, '#665246'), '</g>'])
    rng = random.Random(9)
    for _ in range(110):
        x, y = rng.randrange(W), rng.randrange(740, H)
        rise = rng.randrange(10, 43)
        art.append(path(f'M{x} {y}q{rise*.2} {-rise*.7} {rise*.58} {-rise}', stroke=rng.choice(['#947d42', '#b79b4e', '#f3d386']), width=1.8))
    art.extend([path('M71 814q-27 5-31-10q-2-10 11-9q-5 12 20 9q-4-22 8-38l-3-18 13 9 10-12 6 19q11 10 1 21l-4 23 8 5Z', INK),
                rect(123, 785, 49, 20, '#775942', 3), ellipse(135, 793, 5, 5, IVORY), ellipse(157, 793, 5, 5, IVORY),
                path('M191 810V775q0-14 14-14 M178 811h28', stroke=INK, width=4), ellipse(210, 758, 11, 6, INK, 'transform="rotate(-28 210 758)"')])
    return scene('DOPPLERGEIST: aircraft and field microphone', '#dc766f', ''.join(art))


def factoring():
    art = [ellipse(122, 155, 132, 132, '#edcfa2'), '<g transform="rotate(-10 395 436)">',
           rect(134, 176, 640, 521, '#31394f', 13), rect(142, 161, 642, 514, '#754734', 11),
           rect(171, 193, 594, 447, '#465b85', 7)]
    for row in range(6):
        y = 226+74*row
        art.append(rect(171, y-4, 598, 8, '#e7b978', 4))
        for position in [206, 240, 274, 308, 342, 543, 577, 611, 645, 679]:
            shift = -48 if row == 5 and position == 543 else 0
            color, accent = ('#a782b5', '#c1a0cc') if position < 400 or shift else ('#e58f67', '#f8ac7b')
            art.append(rect(position+shift, y-24, 31, 48, color, 13))
            art.append(path(f'M{position+shift+6} {y-15}q-5 14 0 26', stroke=accent, width=2))
    art.extend(['</g>',
                path('M-15 899V823Q10 732 80 727l12-89q9-15 19-6l52 71q36-5 60 9l42-34q11-4 10 9l-1 61q28 16 48 39q11 34-31 50q-11 32-51 42l-9 20Z', '#f7dfb4'),
                path('M88 729 103 647 150 711Q107 713 88 729Z M221 725 265 689 258 748Q247 731 221 725Z', '#da895a'),
                path('M22 848q44-97 94-86q19 28 62 36q-38 18-59 94H19Z', '#db8d51'),
                path('M198 891Q239 849 296 810Q360 765 414 698L515 592Q529 575 540 583Q549 593 538 606Q454 722 399 791Q362 838 346 900Z', '#f7dfb4'),
                path('M520 595q7-13 15-13 M529 603q8-13 15-16 M204 764q15-18 30-6 M287 792q14-8 24 3l-9 7Z', stroke='#594540', width=3.5),
                path('M277 812q-24-4-50 9M279 817q-27 4-44 18M282 820q-23 10-33 24', stroke='#9b6b57', width=2.4)])
    return scene('Integer factoring: a cat moves a bead on an abacus', '#677ca8', ''.join(art))


def train():
    art = [ellipse(563, 253, 103, 103, '#edbd67'), path('M0 798 189 664 316 697 720 438V900H0Z', '#edbe79')]
    # Cubic center lines meet on a shared approach. Sample the normals for both rails.
    def points(control):
        result = []
        for n in range(121):
            t = n/120
            weights = [(1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t*t, t**3]
            result.append(tuple(sum(weight*point[axis] for weight, point in zip(weights, control)) for axis in [0, 1]))
        return result
    approach = points([(-33, 945), (72, 792), (218, 606), (355, 472)])
    left = points([(355, 472), (475, 325), (265, 168), (25, -35)])
    right = points([(355, 472), (473, 329), (563, 178), (757, 52)])
    rng = random.Random(21)
    for rail in (approach, left, right):
        art.append(line(rail, '#d99b4f', 98))
        for x,y in rail[::3]:
            for _ in range(6):
                dx,dy = rng.uniform(-48,48),rng.uniform(-48,48)
                art.append(ellipse(round(x+dx,1),round(y+dy,1),rng.randrange(2,8),rng.randrange(2,6),rng.choice(['#e9ab58','#c88345','#efc578'])))
    for rail in (approach, left, right):
        normals = []
        for j in range(len(rail)):
            a,b=rail[max(0,j-1)],rail[min(j+1,len(rail)-1)]
            dx,dy=b[0]-a[0],b[1]-a[1]; length=hypot(dx,dy)
            normals.append((-dy/length,dx/length))
        def offset(j,s): return tuple(rail[j][axis]+s*normals[j][axis] for axis in [0,1])
        for j in range(1,len(rail),7):
            if rail is right and j<27: continue  # shared sleepers through the switch
            art.append(line([offset(j,-41),offset(j,41)], '#35515a', 9))
        for s in [-26,26]:
            track=[offset(j,s) for j in range(len(rail))]
            art += [line(track, '#224d5c', 8), line(track, '#f9e0a7', 2.8)]
    art += [path('M495 444l38 1 14 17-45 3Z','#356371'), path('M518 445 557 398',stroke='#b74937',width=6), ellipse(557,395,9,9,'#b74937'),
            '<g transform="translate(192 667) rotate(38)">',
            rect(-39,-158,86,271,'#365560',16, 'opacity=".38" transform="translate(10 13)"'),
            rect(-39,-160,78,265,'#b64b3b',14), rect(-38,-158,76,223,'#eb6b45',13),
            rect(-36,-151,72,189,'#f5dcad',11),
            path('M-26 40h52v40h-52Z','#f5dcad'), rect(-25,48,22,24,INK,3), rect(3,48,22,24,INK,3),
            ellipse(0,88,8,7,'#ffe4a9'),
            path('M-16-103 15-121 19-94-13-74ZM-18-104 18-94M-13-73 16-77M-17-119h35',stroke=INK,width=4),
            rect(-34,103,68,11,INK,2), '</g>']
    return scene('Hack CPU: a streetcar on a continuous rail switch', '#f5dca7', ''.join(art))


def conway():
    art=[path('M0 0H720V268Q526 390 301 274T0 248Z','#718f8b'), ellipse(354,374,304,310,'#886842'),ellipse(350,368,304,305,'#d7ae72')]
    cx,cy=350,364
    def circle(rad,n): return [(cx+rad*cos(pi*2*k/n), cy+rad*sin(pi*2*k/n)) for k in range(n)]
    outer,inner=circle(271,36),circle(130,18)
    for i in range(36):
        color='#a44f49' if i%2==0 else '#325871'
        art.append(line([outer[i],inner[(i*5)%18],outer[(i+9)%36]],color,1.9,'opacity=".72"'))
    for step,color in [(11,'#365a73'),(7,'#ac5c4a')]:
        position=12 if step==11 else 7
        seq=[outer[(position+k*step)%36] for k in range(37)]
        art.append(line(seq,color,2.2,'opacity=".83"'))
        x,y=seq[-1]; spool_x=243 if step==11 else 535
        art.append(path(f'M{x:.2f} {y:.2f}C{x-51:.2f} 724 {spool_x-130} 718 {spool_x-83} 772S{spool_x-31} 824 {spool_x} 802',stroke=color,width=4))
    for x,y in outer+inner:
        art += [ellipse(round(x+1.4,2),round(y+2.7,2),6,5,'#976f47'),ellipse(round(x,2),round(y,2),4.6,4.6,IVORY)]
    for x,y,color,angle in [(247,801,'#365a73',-14),(535,802,'#ac5c4a',27)]:
        art += [f'<g transform="translate({x} {y}) rotate({angle})">',rect(0,-25,72,49,color,6),
                rect(-8,-29,13,57,'#ddbc7b',4),rect(69,-29,13,57,'#ddbc7b',4)]
        for j in range(8,69,5): art.append(path(f'M{j} -21q-2 19 0 42',stroke=IVORY,width=.9, extra='opacity=".36"'))
        art.append('</g>')
    return scene('Conway’s 99-graph: a threaded pin board and two connected spools', '#b6c28d', ''.join(art))


def cards():
    art=[]
    # Every card uses the same deck dimensions, including the offset cards.
    poses=[
      'M37 146q32-63 75-64q18-7 33-2q-19-17-44-21q-13-12 0-14q23 4 51 24q-5-21-28-38q-4-16 9-11q29 14 42 55q23 5 19 24l-23 12-23 8-15 30q-21 24-54 5l-28 20-14-4 21-24-20 5Z',
      'M48 165q-11-21 12-48q8-20 33-26q16-17 27-19q-3-21 7-49q10-11 15 4q1 19-6 40q10-15 28-25q15-5 9 10q-9 15-32 30q13 11 6 27l-20 8q1 31 34 41q15 11 0 20H69Z',
      'M26 146q5-31 50-46q24-13 52 1l16 6q-25-21-47-22q-4-10 8-11q27 3 46 22q-14-21-43-29q-5-11 8-11q28 8 46 34q20 2 26 16q7 15-15 25q-9 37-62 36H57q-35-1-31-21Z',
    ]
    for index,(x,y,angle,color) in enumerate([(72,112,-13,'#cc6354'),(373,239,12,'#8fa268'),(139,539,-16,'#586f9b')]):
        art.append(f'<g transform="translate({x} {y}) rotate({angle})">')
        art.append(rect(14,17,220,265,'#371c3b',13,'opacity=".60"'))
        for dx,dy,twist in [(21,11,13),(7,12,0),(4,8,0),(2,4,0),(0,0,0)]:
            art.append(f'<g transform="translate({dx} {dy}) rotate({twist} 110 130)">')
            art.extend([rect(0,0,220,265,IVORY,13),rect(5,5,210,255,color,10),
                        rect(13,13,194,239,'none',7,f'stroke="{IVORY}" stroke-width="2.7"'),
                        rect(19,19,182,227,'none',4,f'stroke="{IVORY}" stroke-width="1.3"'),'</g>'])
        art.append('<g transform="translate(22 26) scale(.87)">')
        art += [path(poses[index],IVORY),ellipse([175,134,172][index],[88,93,106][index],2.6,3.2,color),'</g>']
        for px,py in [(34,40),(186,220)]:
            art.append(path(f'M{px} {py-7}l6 7-6 7-6-7Z',IVORY))
        art.append('</g>')
    return scene('Solved Conjectures: three stacks of equal-sized rabbit-backed playing cards', '#652c46', ''.join(art))


def publish(name, svg):
    vectors = ROOT / 'prints' / 'vector'
    vectors.mkdir(exist_ok=True)
    source = vectors / f'{name}.svg'
    source.write_text(svg)
    with tempfile.TemporaryDirectory() as folder:
        png = Path(folder) / 'print.png'
        subprocess.run(['inkscape', str(source), '--export-width=1080', f'--export-filename={png}'],
                       check=True, stdout=subprocess.DEVNULL)
        image = Image.open(png).convert('RGB')
        rng = random.Random(19)
        grain = Image.frombytes('L', image.size, rng.randbytes(image.width * image.height))
        grain = grain.point(lambda value: round(115 + .102 * value)).convert('RGB')
        image = ImageChops.soft_light(image, grain)
        for folder, width, quality in [('prints',840,87), ('prints/shelf',420,84), ('furniture/prints',256,83)]:
            rendition=image.resize((width, int(width*H/W)), Image.Resampling.LANCZOS)
            rendition.save(ROOT / folder / f'{name}.webp', 'WEBP', quality=quality, method=6)


if __name__ == '__main__':
    for name, draw in [('flyover', flyover), ('factoring-bead', factoring), ('cpu-switch', train),
                       ('conway', conway), ('conjectures', cards)]:
        publish(name, draw())
