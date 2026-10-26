"""Renderiza el clip original de bienvenida; requiere Pillow y FFmpeg, solo para editar el video.

python scripts/render-intro.py --ffmpeg /ruta/ffmpeg --fonts /ruta/a/fuentes
Las fuentes deben incluir segoeui.ttf y segoeuib.ttf (Segoe UI de Windows).
"""
import argparse
import math
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ffmpeg', required=True)
parser.add_argument('--fonts', default='C:/Windows/Fonts')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'media'
OUT.mkdir(exist_ok=True)
W, H, FPS, DURATION = 1280, 720, 24, 20
INK, BLUE, CYAN, SKY, PAPER, MUTED = '#123b5a', '#087eac', '#009dcc', '#b9eafa', '#f1f8fc', '#4b6c82'
font_cache = {}
def font(size, bold=False):
    key = (size, bold)
    if key not in font_cache:
        font_cache[key] = ImageFont.truetype(str(Path(args.fonts) / ('segoeuib.ttf' if bold else 'segoeui.ttf')), size)
    return font_cache[key]

logo = Image.open(ROOT / 'public' / 'ices-logo-web.png').convert('RGBA')
logo.thumbnail((104, 60), Image.Resampling.LANCZOS)
SCENES = [
    ('UNA NECESIDAD, MUCHAS SOLUCIONES', ['Una pregunta.', 'Muchas ideas.'], '¿Qué te gustaría mejorar?', 'IDEA'),
    ('ESCUCHÁ A QUIENES LA USARÍAN', ['Escuchá.', 'Diseñá.'], 'Una solución para personas reales.', 'DISEÑO'),
    ('APRENDÉ CON CADA INTENTO', ['Probá.', 'Mejorá.'], 'Cada prueba puede cambiar la idea.', 'PRUEBA'),
    ('DESARROLLO DE SOFTWARE', ['Dale vida', 'con código.'], '¿Qué vas a crear vos?', 'CÓDIGO'),
]

def rr(d, rect, radius=22, fill='white', outline=None, width=2):
    d.rounded_rectangle(tuple(map(int, rect)), radius=radius, fill=fill, outline=outline, width=width)

def text(d, xy, value, size, fill=INK, bold=False):
    d.text(xy, value, font=font(size, bold), fill=fill, stroke_width=0)

def check(d, x, y, size=30):
    d.line([(x, y + size*.5), (x+size*.35, y+size*.85), (x+size, y)], fill=BLUE, width=6)

def phone(d, x, y, stage=1):
    rr(d, (x+6, y+10, x+286, y+410), 34, SKY)
    rr(d, (x, y, x+280, y+400), 34, 'white', INK, 4)
    rr(d, (x+100, y+16, x+180, y+22), 3, INK)
    text(d, (x+28,y+51), 'Mi agenda', 32, INK, True)
    text(d, (x+28,y+95), 'Tus próximos pasos', 20, MUTED)
    for i in range(3):
        py=y+150+i*67
        rr(d, (x+24, py, x+256, py+52), 10, PAPER, '#cde2ef', 1)
        rr(d, (x+39, py+15, x+61, py+37), 5, SKY)
        if stage > 1 and i == 0: check(d,x+37,py+15,22)
        rr(d, (x+77,py+18,x+219-i*20,py+24), 3, '#6a91a6')
        rr(d, (x+77,py+32,x+171-i*10,py+36), 2, '#bddceb')
    rr(d, (x+24,y+355,x+256,y+378), 10, BLUE)

def draw_scene(index, phase):
    im=Image.new('RGB',(W,H),PAPER)
    d=ImageDraw.Draw(im)
    # Decoración de fondo, sin destellos ni movimiento continuo en la página.
    for radius in (190,245,300):
        d.ellipse((1000-radius,350-radius,1000+radius,350+radius),outline='#e0f0f8',width=2)
    for x in range(730,1200,28):
        for y in range(110,610,28): d.ellipse((x,y,x+2,y+2),fill='#cce4ef')
    im.paste(logo,(58,27),logo)
    text(d,(183,31),'UNIVERSO ICES',24,INK,True)
    text(d,(183,65),'Desarrollo de Software',20,MUTED)
    d.line((58,111,1222,111),fill='#cde2ef',width=2)
    eyebrow, title, subtitle, label=SCENES[index]
    rr(d,(1030,34,1220,81),20,'white','#bddceb')
    label_width=d.textlength(label,font=font(20,True))
    text(d,(1125-label_width/2,43),label,20,BLUE,True)
    text(d,(62,166),eyebrow,19,BLUE,True)
    for j,line in enumerate(title): text(d,(58,205+j*99),line,82,BLUE if j else INK,True)
    text(d,(63,435),subtitle,31,MUTED)
    rr(d,(62,493,507,498),2,SKY)
    # Cada escena entra suavemente unos píxeles, el texto permanece estable.
    shift=int(16*(1-min(1,phase/.8))**3)
    layer=Image.new('RGBA',(W,H),(0,0,0,0)); g=ImageDraw.Draw(layer)
    if index==0:
        rr(g,(782,227,1201,460),32,SKY)
        rr(g,(772,213,1191,446),32,'white',INK,3)
        text(g,(823,266),'¿Y si...?',74,INK,True)
        g.polygon([(825,444),(826,488),(881,444)],fill='white')
        g.line([(826,445),(826,484),(878,446)],fill=INK,width=3)
        g.ellipse((1094,150,1168,224),fill=CYAN)
        text(g,(1119,154),'!',44,'white',True)
        text(g,(817,521),'Una idea puede ayudar.',28,BLUE,True)
    elif index==1:
        phone(g,874,150)
        rr(g,(719,360,956,436),17,SKY,INK,2)
        text(g,(747,377),'Personas',30,INK,True)
        rr(g,(972,490,1220,566),17,'white',BLUE,2)
        text(g,(997,507),'Un boceto',30,BLUE,True)
    elif index==2:
        phone(g,817,150,2)
        rr(g,(955,354,1220,455),22,SKY,BLUE,2)
        text(g,(976,379),'¡Se entiende!',31,INK,True)
        g.arc((1080,166,1195,281),20,290,fill=BLUE,width=8)
        g.polygon([(1172,171),(1198,174),(1188,198)],fill=BLUE)
        check(g,746,470,43)
        text(g,(813,568),'Escuchar y volver a probar.',24,BLUE,True)
    else:
        rr(g,(734,192,1207,455),22,'white',INK,3)
        rr(g,(735,193,1206,243),20,INK)
        g.rectangle((736,218,1205,243),fill=INK)
        for x in (760,785,810):g.ellipse((x,210,x+10,220),fill=SKY)
        text(g,(768,273),'idea',44,BLUE,True)
        text(g,(920,273),'→',44,INK,True)
        text(g,(1005,273),'app',44,BLUE,True)
        for i,width in enumerate((245,190,290)):
            rr(g,(770,350+i*25,770+width,358+i*25),4,SKY if i!=1 else '#6dbbd8')
        rr(g,(875,480,1168,552),18,SKY,BLUE,2)
        text(g,(910,495),'Crear soluciones',28,INK,True)
    im.paste(layer,(0,shift),layer)
    d=ImageDraw.Draw(im)
    d.line((58,613,1222,613),fill='#cde2ef',width=2)
    text(d,(62,641),'Tu próxima idea empieza acá.',25,INK,True)
    for i,word in enumerate(('Pensar','Diseñar','Probar','Crear')):
        x=720+i*125
        gfill=BLUE if i==index else '#a5c4d5'
        d.ellipse((x,650,x+9,659),fill=gfill)
        text(d,(x+18,639),word,20,gfill,i==index)
    return im

command=[args.ffmpeg,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
         '-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',
         '-metadata','title=Tu próxima idea empieza acá · Universo ICES',str(OUT/'desarrollo-software.mp4')]
process=subprocess.Popen(command,stdin=subprocess.PIPE)
try:
    for frame in range(FPS*DURATION):
        t=frame/FPS; index=min(3,int(t//5)); phase=t-index*5
        im=draw_scene(index,phase)
        if index>0 and phase<.4:
            im=Image.blend(draw_scene(index-1,5),im,(1-math.cos(math.pi*phase/.4))/2)
        process.stdin.write(im.tobytes())
finally:
    process.stdin.close()
if process.wait()!=0: raise SystemExit('No se pudo codificar el video')
draw_scene(0,1).save(OUT/'desarrollo-software-poster.jpg',quality=88,optimize=True)
print(f'Video original: {DURATION}s, {W}×{H}, sin audio. {OUT / "desarrollo-software.mp4"}')
