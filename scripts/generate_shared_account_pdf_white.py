#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kompaktowa, 1-STRONICOWA instrukcja w białym, czytelnym motywie (White Edition)
z miniaturami ze Steama i prostymi punktami.
"""

import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_DIR = "/home/szcze/.local/share/fonts"
SYS_TTF = "/usr/share/fonts/TTF"

regular_font = os.path.join(FONT_DIR, "segoeui.ttf") if os.path.exists(os.path.join(FONT_DIR, "segoeui.ttf")) else os.path.join(SYS_TTF, "DejaVuSans.ttf")
bold_font = os.path.join(FONT_DIR, "segoeuib.ttf") if os.path.exists(os.path.join(FONT_DIR, "segoeuib.ttf")) else os.path.join(SYS_TTF, "DejaVuSans-Bold.ttf")

pdfmetrics.registerFont(TTFont("SegoeUI", regular_font))
pdfmetrics.registerFont(TTFont("SegoeUI-Bold", bold_font))

OUTPUT_DIR = "/home/szcze/projects/steam-family-picker/docs"
IMG_DIR = os.path.join(OUTPUT_DIR, "img_white")
os.makedirs(IMG_DIR, exist_ok=True)

def get_pil_font(size=14, bold=False):
    f_path = bold_font if bold else regular_font
    try:
        return ImageFont.truetype(f_path, size)
    except:
        return ImageFont.load_default()

# Miniatury UI dla białego szablonu
def create_white_cloud_mini():
    w, h = 600, 160
    img = Image.new("RGB", (w, h), (24, 32, 44))
    draw = ImageDraw.Draw(img)
    
    # Nagłówek okna
    draw.rectangle([0, 0, w, 36], fill=(16, 22, 32))
    draw.text((15, 9), "Ustawienia Steam > Cloud", fill=(102, 192, 244), font=get_pil_font(15, True))
    
    # Switch
    draw.rounded_rectangle([25, 60, 85, 98], radius=19, fill=(55, 65, 80), outline=(100, 115, 135), width=2)
    draw.ellipse([29, 64, 59, 94], fill=(180, 190, 200))
    draw.text((98, 70), "WYŁĄCZONE (SZARY)", fill=(255, 100, 100), font=get_pil_font(15, True))
    
    draw.text((280, 60), "Włącz synchronizację ze Steam Cloud", fill=(255, 255, 255), font=get_pil_font(15, True))
    draw.text((280, 84), "(Suwak MUSI być wyłączony / odznaczony)", fill=(160, 175, 190), font=get_pil_font(13, False))
    
    # Ramka ostrzeżenia
    draw.rectangle([10, 120, w-10, 150], fill=(60, 20, 20), outline=(200, 60, 60), width=1)
    draw.text((20, 127), "! Wyłączenie chmury chroni zapisy gry (save'y) przed skasowaniem!", fill=(255, 180, 180), font=get_pil_font(12, True))
    
    out_path = os.path.join(IMG_DIR, "cloud_mini.png")
    img.save(out_path)
    return out_path

def create_white_offline_mini():
    w, h = 600, 160
    img = Image.new("RGB", (w, h), (24, 32, 44))
    draw = ImageDraw.Draw(img)
    
    # Menu lewe
    draw.rectangle([10, 10, 260, 150], fill=(30, 42, 58), outline=(60, 85, 115), width=1)
    draw.text((20, 18), "Zmień konto...", fill=(180, 195, 210), font=get_pil_font(12, False))
    draw.rectangle([12, 42, 258, 72], fill=(102, 192, 244))
    draw.text((20, 48), "Przejdź w tryb offline...  <--", fill=(10, 20, 30), font=get_pil_font(13, True))
    draw.text((20, 82), "Ustawienia", fill=(180, 195, 210), font=get_pil_font(12, False))
    draw.text((20, 112), "Zakończ", fill=(180, 195, 210), font=get_pil_font(12, False))
    
    # Prawa strona
    draw.rectangle([280, 10, w-10, 150], fill=(16, 24, 35), outline=(50, 70, 95), width=1)
    draw.text((295, 22), "Dlaczego tryb Offline?", fill=(255, 215, 0), font=get_pil_font(14, True))
    draw.text((295, 52), "• W trybie offline wszyscy mogą grać", fill=(255, 255, 255), font=get_pil_font(13, True))
    draw.text((305, 74), "jednocześnie w tę samą grę.", fill=(180, 195, 210), font=get_pil_font(12, False))
    draw.text((295, 104), "• Granie online wyrzuca innych graczy!", fill=(255, 120, 120), font=get_pil_font(13, True))
    
    out_path = os.path.join(IMG_DIR, "offline_mini.png")
    img.save(out_path)
    return out_path

cloud_img = create_white_cloud_mini()
offline_img = create_white_offline_mini()

# Canvas z białym tłem i delikatnymi liniami
class WhiteNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(WhiteNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(WhiteNumberedCanvas, self).showPage()
        super(WhiteNumberedCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        # Delikatny nagłówek
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(1)
        self.line(30, A4[1]-24, A4[0]-30, A4[1]-24)
        
        self.setFont("SegoeUI-Bold", 8)
        self.setFillColor(colors.HexColor("#0284c7"))
        self.drawString(30, A4[1]-18, "STEAM • INSTRUKCJA KONTA WSPÓŁDZIELONEGO")
        
        # Stopka
        self.line(30, 24, A4[0]-30, 24)
        self.setFont("SegoeUI", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(30, 12, "Instrukcja dla grupy znajomych • Graj zawsze w trybie Offline")
        self.drawRightString(A4[0]-30, 12, f"Strona {self._pageNumber} z {page_count}")
        self.restoreState()

pdf_path = os.path.join(OUTPUT_DIR, "Instrukcja_Konta_Wspoldzielonego_Steam.pdf")
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    leftMargin=30,
    rightMargin=30,
    topMargin=32,
    bottomMargin=30
)

styles = getSampleStyleSheet()

t_title = ParagraphStyle(
    "WhiteTitle",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=16,
    leading=20,
    textColor=colors.HexColor("#0f172a"),
    alignment=1,
    spaceAfter=2
)

t_subtitle = ParagraphStyle(
    "WhiteSub",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=9.5,
    leading=12,
    textColor=colors.HexColor("#64748b"),
    alignment=1,
    spaceAfter=8
)

h2_style = ParagraphStyle(
    "WhiteH2",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=11,
    leading=14,
    textColor=colors.HexColor("#0f172a"),
    spaceBefore=6,
    spaceAfter=4
)

b_text = ParagraphStyle(
    "WhiteBody",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=9,
    leading=12.5,
    textColor=colors.HexColor("#334155")
)

b_bold = ParagraphStyle(
    "WhiteBodyBold",
    parent=b_text,
    fontName="SegoeUI-Bold",
    textColor=colors.HexColor("#0f172a")
)

story = []

story.append(Paragraph("Instrukcja Korzystania z Konta Współdzielonego Steam", t_title))
story.append(Paragraph("Szybki poradnik logowania, konfiguracji i poprawnego grania w trybie Offline", t_subtitle))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=6))

# 1. DANE LOGOWANIA
creds_data = [
    [
        Paragraph("<b>DANE DO LOGOWANIA:</b>", ParagraphStyle("CH1", parent=b_text, fontName="SegoeUI-Bold", fontSize=9.5, textColor=colors.HexColor("#0284c7"))),
        Paragraph("<b>PIERWSZE LOGOWANIE:</b>", ParagraphStyle("CH2", parent=b_text, fontName="SegoeUI-Bold", fontSize=9.5, textColor=colors.HexColor("#d97706")))
    ],
    [
        Paragraph(
            "Login: <b><font size='10.5' color='#0f172a'>tuzzabroware</font></b><br/>"
            "Hasło: <b><font size='10.5' color='#0f172a'>Czteryzera0000</font></b><br/>"
            "<font color='#16a34a'><b>[V] Zaznacz: „Zapamiętaj moje hasło”</b></font>",
            b_text
        ),
        Paragraph(
            "• Przy 1. logowaniu Steam poprosi o <b>kod Steam Guard</b>.<br/>"
            "• Napisz na Discordzie/Messengerze do właściciela o potwierdzenie.<br/>"
            "• <b>Kategoryczny zakaz zmiany hasła, maila i nicku!</b>",
            b_text
        )
    ]
]
t_creds = Table(creds_data, colWidths=[245, 290])
t_creds.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(t_creds)
story.append(Spacer(1, 6))

# 2. KROK 1: STEAM CLOUD
story.append(Paragraph("KROK 1: Wyłącz Steam Cloud (NAJWAŻNIEJSZE!)", h2_style))
story.append(Paragraph("<b>Dlaczego:</b> Włączona chmura powoduje <u>nadpisywanie lub kasowanie save'ów</u> innych graczy. Wyłącz ją raz po zalogowaniu:", b_text))
story.append(Spacer(1, 3))

cloud_row = [
    [
        RLImage(cloud_img, width=285, height=76),
        Paragraph(
            "<b>Ścieżka w kliencie Steam:</b><br/>"
            "1. W lewym górnym rogu kliknij: <b>Steam</b> &gt; <b>Ustawienia</b>.<br/>"
            "2. Wejdź w zakładkę <b>Cloud</b> (Chmura).<br/>"
            "3. <b>Odznacz suwak:</b> <i>„Włącz synchronizację ze Steam Cloud...”</i> (musi być <b>SZARY / OFF</b>).",
            b_text
        )
    ]
]
t_cloud = Table(cloud_row, colWidths=[290, 245])
t_cloud.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_cloud)
story.append(Spacer(1, 6))

# 3. KROK 2: POBRANIE & TRYB OFFLINE
story.append(Paragraph("KROK 2: Pobranie gry i Przejście w Tryb Offline", h2_style))
story.append(Paragraph("Steam pozwala grać online tylko 1 osobie naraz. <b>W trybie Offline możecie grać wszyscy jednocześnie bez wyrzucania!</b>", b_text))
story.append(Spacer(1, 3))

offline_row = [
    [
        RLImage(offline_img, width=285, height=76),
        Paragraph(
            "<b>Prawidłowy cykl gry:</b><br/>"
            "1. <b>Pobierz grę</b> w trybie Online.<br/>"
            "2. <b>Uruchom ją raz na 1 min</b> (do menu) i wyłącz.<br/>"
            "3. W menu Steam kliknij <b>„Przejdź w tryb offline...”</b>.<br/>"
            "4. <b>Graj ZAWSZE w trybie Offline!</b>",
            b_text
        )
    ]
]
t_offline = Table(offline_row, colWidths=[290, 245])
t_offline.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_offline)
story.append(Spacer(1, 6))

# 4. KROK 3: WYŁĄCZENIE REMOTE PLAY (1 linijka)
t_remote = Table([[
    Paragraph("<b>KROK 3 (Opcjonalnie): Wyłącz Remote Play</b> — Wejdź w <i>Steam &gt; Ustawienia &gt; Remote Play</i> i odznacz <i>„Włącz Remote Play”</i> (zapobiega przypadkowemu streamowaniu obrazu na PC innego znajomego).", b_text)
]], colWidths=[535])
t_remote.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_remote)
story.append(Spacer(1, 6))

# 5. ŻELAZNE ZASADY & FAQ
story.append(Paragraph("Żelazne Zasady Współdzielenia Konta", h2_style))

rules_data = [
    [
        Paragraph("<b>[X] ZAKAZY (Czego NIE robić):</b>", ParagraphStyle("R1", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#dc2626"))),
        Paragraph("<b>[V] DOBRE PRAKTYKI:</b>", ParagraphStyle("R2", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#16a34a")))
    ],
    [
        Paragraph(
            "• <b>NIGDY nie graj w trybie Online</b> (wyrzucisz innych).<br/>"
            "• <b>Nie włączaj Steam Cloud</b> (zepsujesz save'y).<br/>"
            "• <b>Nie zmieniaj hasła, maila ani nicku</b>.<br/>"
            "• <b>Nie dodawaj Steam Guard na swój telefon</b>.<br/>"
            "• <b>Zero cheatów / trainerów</b> (ryzyko bana VAC).",
            b_text
        ),
        Paragraph(
            "• <b>ZAWSZE graj w trybie Offline</b>.<br/>"
            "• Po skończonej grze możesz bezpiecznie przełączyć się na swoje prywatne konto (<i>Steam &gt; Zmień konto</i>).<br/>"
            "• Zainstalowane gry NIE znikają z dysku po przełączeniu konta.<br/>"
            "• Twoje save'y są bezpieczne na Twoim dysku (folder AppData).",
            b_text
        )
    ]
]
t_rules = Table(rules_data, colWidths=[265, 270])
t_rules.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#fef2f2")),
    ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#f0fdf4")),
    ('BOX', (0, 0), (0, -1), 1, colors.HexColor("#f87171")),
    ('BOX', (1, 0), (1, -1), 1, colors.HexColor("#4ade80")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_rules)
story.append(Spacer(1, 6))

# Stopka końcowa
t_foot = Table([[
    Paragraph("<font color='#0284c7'><b>Życzymy udanej gry! W razie problemów z kodem Guard napisz do właściciela konta.</b></font>", ParagraphStyle("F1", parent=b_text, alignment=1))
]], colWidths=[535])
t_foot.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_foot)

doc.build(story, canvasmaker=WhiteNumberedCanvas)
print(f"SUCCESS: 1-Page White PDF generated at {pdf_path}")
