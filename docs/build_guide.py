"""Render the maintained Markdown guide. Optional dependency: reportlab.
Run from any directory: python3 docs/build_guide.py
Does not read or modify the project canvas.
"""
from pathlib import Path
import re
from html import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'output/pdf/guia-desafio-atualizado.pdf'
DEST.parent.mkdir(parents=True, exist_ok=True)
FONT = Path('/usr/share/fonts/noto')
if (FONT / 'NotoSans-Regular.ttf').exists():
    pdfmetrics.registerFont(TTFont('Guide', str(FONT / 'NotoSans-Regular.ttf')))
    pdfmetrics.registerFont(TTFont('GuideBold', str(FONT / 'NotoSans-Bold.ttf')))
    pdfmetrics.registerFontFamily('Guide', normal='Guide', bold='GuideBold', italic='Guide', boldItalic='GuideBold')
    normal, bold = 'Guide', 'GuideBold'
else:
    normal, bold = 'Helvetica', 'Helvetica-Bold'
green, ink, muted, line = [colors.HexColor(x) for x in ['#287354','#243d32','#73837a','#dfe8e1']]
styles = {
    'body': ParagraphStyle('body', fontName=normal, fontSize=10, leading=14.8, textColor=ink, spaceAfter=9, splitLongWords=True),
    'title': ParagraphStyle('title', fontName=bold, fontSize=24, leading=29, textColor=green, spaceAfter=18),
    'sub': ParagraphStyle('sub', fontName=bold, fontSize=11, leading=16, textColor=green, spaceBefore=6, spaceAfter=7, keepWithNext=True),
    'bullet': ParagraphStyle('bullet', fontName=normal, fontSize=10, leading=14.3, textColor=ink, leftIndent=11, firstLineIndent=-9, spaceAfter=6),
    'cell': ParagraphStyle('cell', fontName=normal, fontSize=9, leading=12.4, textColor=ink, spaceAfter=0),
    'head': ParagraphStyle('head', fontName=bold, fontSize=9, leading=12.4, textColor=colors.white),
    'small': ParagraphStyle('small', fontName=normal, fontSize=9, leading=13, textColor=muted, spaceAfter=9),
}

def inline(text):
    text = text.replace('→', ' / ').replace('—', '-').replace('–', '-').replace('\u2011','-')
    text = escape(text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: '<a href="'+m[2]+'" color="#287354"><u>'+m[1]+'</u></a>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<font color="#426652">\1</font>', text)
    return text

class PageCanvas(Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.states = []
    def showPage(self):
        self.states.append(dict(self.__dict__))
        self._startPage()
    def save(self):
        count = len(self.states)
        for state in self.states:
            self.__dict__.update(state)
            self.setFillColor(muted)
            self.setFont(normal,8)
            self.drawString(43,28,'PMI SLEEP 5  /  GUIA DO PROJETO  /  VERSÃO 2')
            self.drawRightString(A4[0]-43,28, f'{self._pageNumber:02d} / {count:02d}')
            Canvas.showPage(self)
        Canvas.save(self)

def frame(canvas, doc):
    w,h=A4
    canvas.saveState()
    canvas.setFillColor(green)
    canvas.rect(0,h-7,w,7,fill=1,stroke=0)
    canvas.setFont(bold,13)
    canvas.drawString(43,h-39,'krilltech')
    canvas.setFillColor(muted)
    canvas.setFont(normal,8)
    canvas.drawRightString(w-43,h-37,'INTELIGÊNCIA DE CRÉDITO  /  12 SET 2026')
    canvas.setStrokeColor(line)
    canvas.line(43,h-50,w-43,h-50)
    canvas.line(43,44,w-43,44)
    canvas.restoreState()

lines=(ROOT/'docs/guia-desafio-atualizado.md').read_text().splitlines()
story=[]
i=0
section=0
while i<len(lines):
    s=lines[i].strip()
    if not s:
        i+=1;continue
    if s.startswith('## '):
        if section: story.append(PageBreak())
        section+=1
        title=s[3:]
        num, title=title.split('. ',1)
        story.append(Paragraph(f'GUIA DO DESAFIO  /  {num}',styles['small']))
        story.append(Paragraph(inline(title),styles['title']))
        i+=1;continue
    if section==0:
        i+=1;continue
    if s.startswith('### '):
        story.append(Paragraph(inline(s[4:]),styles['sub']))
        i+=1;continue
    if s.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            cells=[x.strip() for x in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r'[:\- ]+', c) for c in cells): rows.append(cells)
            i+=1
        n=len(rows[0]);width=A4[0]-86
        widths={2:[.32,.68],3:[.25,.365,.385]}.get(n,[1/n]*n)
        cells=[[Paragraph(inline(c),styles['head' if r==0 else 'cell']) for c in row] for r,row in enumerate(rows)]
        table=Table(cells,colWidths=[width*x for x in widths],repeatRows=1,hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),green),('VALIGN',(0,0),(-1,-1),'TOP'),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#f0f5f0'),colors.HexColor('#fafcfa')]),
            ('LINEBELOW',(0,0),(-1,-1),.45,colors.white),
            ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
            ('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
        ]))
        story += [table,Spacer(1,12)]
        continue
    if s.startswith('- '):
        story.append(Paragraph('- '+inline(s[2:]),styles['bullet']))
        i+=1;continue
    if re.match(r'^\d+\. ',s):
        story.append(Paragraph(inline(s),styles['bullet']))
        i+=1;continue
    parts=[s];i+=1
    while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','- ')):
        parts.append(lines[i].strip());i+=1
    story.append(Paragraph(inline(' '.join(parts)),styles['body']))

doc=SimpleDocTemplate(str(DEST),pagesize=A4,leftMargin=43,rightMargin=43,topMargin=68,bottomMargin=58,
    title='Krilltech | Guia do desafio e da solução - Versão 2',author='PMI Sleep 5',subject='Contexto, frontend mock e integração do projeto')
doc.build(story,onFirstPage=frame,onLaterPages=frame,canvasmaker=PageCanvas)
print(DEST)
