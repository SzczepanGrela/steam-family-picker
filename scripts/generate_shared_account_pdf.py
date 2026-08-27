#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator profesjonalnego poradnika PDF dla użytkowników konta współdzielonego Steam.
Wydanie 3-stronicowe, idealnie sformatowane, bez uciętych znaków i pustych przestrzeni.
"""

import os
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# 1. Rejestracja czcionek
FONT_DIR = "/home/szcze/.local/share/fonts"
SYS_TTF = "/usr/share/fonts/TTF"

regular_font = os.path.join(FONT_DIR, "segoeui.ttf") if os.path.exists(os.path.join(FONT_DIR, "segoeui.ttf")) else os.path.join(SYS_TTF, "DejaVuSans.ttf")
bold_font = os.path.join(FONT_DIR, "segoeuib.ttf") if os.path.exists(os.path.join(FONT_DIR, "segoeuib.ttf")) else os.path.join(SYS_TTF, "DejaVuSans-Bold.ttf")
italic_font = os.path.join(FONT_DIR, "segoeuii.ttf") if os.path.exists(os.path.join(FONT_DIR, "segoeuii.ttf")) else os.path.join(SYS_TTF, "DejaVuSans-Oblique.ttf")
bold_italic_font = os.path.join(FONT_DIR, "segoeuiz.ttf") if os.path.exists(os.path.join(FONT_DIR, "segoeuiz.ttf")) else os.path.join(SYS_TTF, "DejaVuSans-BoldOblique.ttf")

pdfmetrics.registerFont(TTFont("SegoeUI", regular_font))
pdfmetrics.registerFont(TTFont("SegoeUI-Bold", bold_font))
pdfmetrics.registerFont(TTFont("SegoeUI-Italic", italic_font))
pdfmetrics.registerFont(TTFont("SegoeUI-BoldItalic", bold_italic_font))

OUTPUT_DIR = "/home/szcze/projects/steam-family-picker/docs"
IMG_DIR = os.path.join(OUTPUT_DIR, "img")
os.makedirs(IMG_DIR, exist_ok=True)

def get_pil_font(size=14, bold=False):
    f_path = bold_font if bold else regular_font
    try:
        return ImageFont.truetype(f_path, size)
    except:
        return ImageFont.load_default()

# 2. Generowanie estetycznych zrzutów UI
def create_steam_cloud_ui():
    w, h = 900, 310
    img = Image.new("RGBA", (w, h), (23, 29, 37, 255))
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([10, 10, w-10, h-10], fill=(27, 40, 56, 255), outline=(62, 83, 105, 255), width=2)
    draw.rectangle([10, 10, w-10, 50], fill=(20, 30, 42, 255))
    draw.text((25, 18), "Ustawienia Steam > Cloud (Chmura)", fill=(102, 192, 244, 255), font=get_pil_font(18, True))
    
    draw.text((35, 68), "Steam Cloud umozliwia synchronizacje zapisow gry miedzy komputerami.", fill=(198, 212, 223, 255), font=get_pil_font(15, False))
    draw.text((35, 94), "Na koncie wspoldzielonym synchronizacja MUSI byc wylaczona, aby nie uszkodzic save'ow!", fill=(255, 120, 120, 255), font=get_pil_font(14, True))
    
    box_y = 130
    draw.rectangle([35, box_y, w-35, box_y + 95], fill=(16, 24, 34, 255), outline=(50, 68, 88, 255), width=1)
    
    # Switch OFF
    draw.rounded_rectangle([55, box_y + 26, 115, box_y + 64], radius=19, fill=(45, 55, 68, 255), outline=(100, 110, 125, 255), width=2)
    draw.ellipse([59, box_y + 30, 89, box_y + 60], fill=(180, 190, 200, 255))
    draw.text((130, box_y + 34), "WYLACZONE (OFF)", fill=(255, 85, 85, 255), font=get_pil_font(16, True))
    
    draw.text((320, box_y + 25), "Wlacz synchronizacje ze Steam Cloud dla aplikacji,", fill=(255, 255, 255, 255), font=get_pil_font(16, True))
    draw.text((320, box_y + 52), "ktore ja obsluguja (Musi byc ODZNACZONE / SZARE)", fill=(198, 212, 223, 255), font=get_pil_font(14, False))
    
    draw.rectangle([35, h-50, w-35, h-18], fill=(227, 94, 94, 35), outline=(227, 94, 94, 255), width=1)
    draw.text((50, h-40), "! UWAGA: Jesli opcja jest niebieska (WLACZONA) -> kliknij ja natychmiast, aby stala sie SZARA!", fill=(255, 200, 200, 255), font=get_pil_font(13, True))
    
    out_path = os.path.join(IMG_DIR, "steam_cloud.png")
    img.save(out_path)
    return out_path

def create_steam_remote_play_ui():
    w, h = 900, 280
    img = Image.new("RGBA", (w, h), (23, 29, 37, 255))
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([10, 10, w-10, h-10], fill=(27, 40, 56, 255), outline=(62, 83, 105, 255), width=2)
    draw.rectangle([10, 10, w-10, 50], fill=(20, 30, 42, 255))
    draw.text((25, 18), "Ustawienia Steam > Remote Play", fill=(102, 192, 244, 255), font=get_pil_font(18, True))
    
    draw.text((35, 68), "Remote Play pozwala na strumieniowanie gier pomiedzy urzadzeniami w sieci.", fill=(198, 212, 223, 255), font=get_pil_font(15, False))
    
    box_y = 105
    draw.rectangle([35, box_y, w-35, box_y + 95], fill=(16, 24, 34, 255), outline=(50, 68, 88, 255), width=1)
    
    # Switch OFF
    draw.rounded_rectangle([55, box_y + 26, 115, box_y + 64], radius=19, fill=(45, 55, 68, 255), outline=(100, 110, 125, 255), width=2)
    draw.ellipse([59, box_y + 30, 89, box_y + 60], fill=(180, 190, 200, 255))
    draw.text((130, box_y + 34), "WYLACZONE (OFF)", fill=(255, 85, 85, 255), font=get_pil_font(16, True))
    
    draw.text((320, box_y + 35), "Wlacz Remote Play (Przelacznik musi byc SZARY / WYLACZONY)", fill=(255, 255, 255, 255), font=get_pil_font(15, True))
    
    draw.rectangle([35, h-50, w-35, h-18], fill=(76, 156, 34, 35), outline=(76, 156, 34, 255), width=1)
    draw.text((50, h-40), "[OK] Prawidlowe ustawienie: Funkcja Remote Play jest calkowicie nieaktywna.", fill=(180, 240, 160, 255), font=get_pil_font(13, True))
    
    out_path = os.path.join(IMG_DIR, "steam_remote_play.png")
    img.save(out_path)
    return out_path

def create_steam_offline_ui():
    w, h = 900, 310
    img = Image.new("RGBA", (w, h), (23, 29, 37, 255))
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([10, 10, w-10, h-10], fill=(27, 40, 56, 255), outline=(62, 83, 105, 255), width=2)
    draw.rectangle([10, 10, w-10, 50], fill=(20, 30, 42, 255))
    draw.text((25, 18), "Menu Glowne Steam (Lewy gorny rog okna)", fill=(102, 192, 244, 255), font=get_pil_font(18, True))
    
    menu_x, menu_y = 35, 68
    draw.rectangle([menu_x, menu_y, menu_x + 370, menu_y + 175], fill=(30, 42, 58, 255), outline=(70, 95, 120, 255), width=2)
    
    items = [
        ("Zmien konto...", False),
        ("Wyloguj konto...", False),
        ("Przejdz w tryb offline...  <-- KLIKNIJ TUTAJ", True),
        ("Sprawdz dostepnosc aktualizacji...", False),
        ("Kopia zapasowa i przywracanie...", False),
        ("Ustawienia", False),
        ("Zakoncz", False)
    ]
    
    cur_y = menu_y + 6
    for item, highlight in items:
        if highlight:
            draw.rectangle([menu_x + 4, cur_y - 2, menu_x + 366, cur_y + 22], fill=(102, 192, 244, 255))
            draw.text((menu_x + 12, cur_y), item, fill=(15, 25, 35, 255), font=get_pil_font(13, True))
        else:
            draw.text((menu_x + 12, cur_y), item, fill=(200, 210, 220, 255), font=get_pil_font(13, False))
        cur_y += 24
        
    draw.rectangle([430, 68, w-35, 243], fill=(16, 24, 34, 255), outline=(50, 68, 88, 255), width=1)
    draw.text((450, 85), "Dlaczego tryb offline jest kluczowy?", fill=(255, 215, 0, 255), font=get_pil_font(16, True))
    draw.text((450, 118), "1. W trybie offline 10 osob moze grac", fill=(255, 255, 255, 255), font=get_pil_font(14, True))
    draw.text((468, 140), "jednoczesnie w te sama gre bez wyrzucania!", fill=(198, 212, 223, 255), font=get_pil_font(13, False))
    draw.text((450, 172), "2. Uruchomienie gry w trybie online natychmiast", fill=(255, 140, 140, 255), font=get_pil_font(14, True))
    draw.text((468, 194), "wyrzuci z rozgrywki innego grajacego znajomego.", fill=(198, 212, 223, 255), font=get_pil_font(13, False))
    
    draw.rectangle([35, h-50, w-35, h-18], fill=(102, 192, 244, 35), outline=(102, 192, 244, 255), width=1)
    draw.text((50, h-40), "[INFO] W oknie potwierdzenia wybierz: 'Uruchom ponownie w trybie offline' (Restart in Offline Mode).", fill=(102, 192, 244, 255), font=get_pil_font(12, True))
    
    out_path = os.path.join(IMG_DIR, "steam_offline.png")
    img.save(out_path)
    return out_path

cloud_img_path = create_steam_cloud_ui()
remote_img_path = create_steam_remote_play_ui()
offline_img_path = create_steam_offline_ui()

# 3. Definicja szablonu PDF i stylów
def draw_background(canvas_obj, doc_obj):
    canvas_obj.saveState()
    canvas_obj.setFillColor(colors.HexColor("#0f141c"))
    canvas_obj.rect(0, 0, A4[0], A4[1], fill=True, stroke=False)
    canvas_obj.restoreState()

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        # Nagłówek
        self.setFillColor(colors.HexColor("#171d25"))
        self.rect(0, A4[1]-26, A4[0], 26, fill=True, stroke=False)
        self.setStrokeColor(colors.HexColor("#1b2838"))
        self.setLineWidth(1)
        self.line(0, A4[1]-26, A4[0], A4[1]-26)
        
        self.setFont("SegoeUI-Bold", 8.5)
        self.setFillColor(colors.HexColor("#66c0f4"))
        self.drawString(35, A4[1]-18, "STEAM SHARED ACCOUNT MANUAL  |  PORADNIK UŻYTKOWNIKA")
        
        # Stopka
        self.setFillColor(colors.HexColor("#171d25"))
        self.rect(0, 0, A4[0], 26, fill=True, stroke=False)
        self.line(0, 26, A4[0], 26)
        
        self.setFont("SegoeUI", 8.5)
        self.setFillColor(colors.HexColor("#8f98a0"))
        self.drawString(35, 9, "Konto Współdzielone Steam  •  Zasady i konfiguracja trybu Offline")
        self.drawRightString(A4[0]-35, 9, f"Strona {self._pageNumber} z {page_count}")
        self.restoreState()

pdf_path = os.path.join(OUTPUT_DIR, "Instrukcja_Konta_Wspoldzielonego_Steam.pdf")
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    leftMargin=35,
    rightMargin=35,
    topMargin=38,
    bottomMargin=38
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "DocTitle",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=18,
    leading=22,
    textColor=colors.HexColor("#ffffff"),
    spaceAfter=3
)

subtitle_style = ParagraphStyle(
    "DocSubtitle",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=10,
    leading=13,
    textColor=colors.HexColor("#66c0f4"),
    spaceAfter=10
)

h1_style = ParagraphStyle(
    "SectionH1",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=13,
    leading=16,
    textColor=colors.HexColor("#66c0f4"),
    spaceBefore=8,
    spaceAfter=5
)

body_style = ParagraphStyle(
    "BodyDark",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor("#c6d4df")
)

alert_danger_style = ParagraphStyle(
    "AlertDanger",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor("#ff9999")
)

alert_success_style = ParagraphStyle(
    "AlertSuccess",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor("#b3e699")
)

story = []

# ==========================================
# STRONA 1: DANE LOGOWANIA + KROK 1 + KROK 2
# ==========================================
story.append(Paragraph("Instrukcja Korzystania z Konta Współdzielonego Steam", title_style))
story.append(Paragraph("Kompletny przewodnik konfiguracji technicznej, trybu Offline oraz zasad bezpieczeństwa", subtitle_style))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1b2838"), spaceBefore=0, spaceAfter=8))

# BOX Z DANYMI
creds_table_data = [
    [
        Paragraph("<b>[+] DANE DOSTĘPOWE DO KONTA STEAM</b>", ParagraphStyle("CredHeader", parent=body_style, fontName="SegoeUI-Bold", fontSize=10.5, textColor=colors.HexColor("#66c0f4"))),
        Paragraph("<b>[!] WAŻNE PRZY PIERWSZYM LOGOWANIU</b>", ParagraphStyle("CredHeader2", parent=body_style, fontName="SegoeUI-Bold", fontSize=10.5, textColor=colors.HexColor("#f4c266")))
    ],
    [
        Paragraph(
            "<font color='#8f98a0'>Login:</font> <b><font color='#ffffff' size='11.5'>tuzzabroware</font></b><br/><br/>"
            "<font color='#8f98a0'>Hasło:</font> <b><font color='#ffffff' size='11.5'>Czteryzera0000</font></b><br/><br/>"
            "<font color='#5c7e10'><b>[V] Zaznacz: „Zapamiętaj moje hasło”</b></font>",
            body_style
        ),
        Paragraph(
            "• Podczas 1. logowania Steam poprosi o <b>kod Steam Guard</b> lub potwierdzenie.<br/>"
            "• Napisz na Discordzie/Messengerze do właściciela konta, aby potwierdził logowanie.<br/>"
            "• <b>Nigdy nie zmieniaj hasła, adresu e-mail ani nicku konta!</b>",
            body_style
        )
    ]
]

creds_table = Table(creds_table_data, colWidths=[240, 285])
creds_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#16202d")),
    ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#2a475e")),
    ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor("#1f2d3d")),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(creds_table)
story.append(Spacer(1, 10))

# KROK 1: STEAM CLOUD
story.append(Paragraph("KROK 1: Całkowite Wyłączenie Steam Cloud (NAJWAŻNIEJSZE!)", h1_style))
story.append(Paragraph(
    "<b>Dlaczego to krytyczne:</b> Jeśli Steam Cloud pozostanie włączony, gra wyśle Twój stan zapisu (save) na serwer Valve i <b>bezpowrotnie nadpisze postępy innych znajomych</b> grających na tym koncie. Wyłączenie chmury gwarantuje, że zapisy są w 100% bezpieczne na Twoim dysku.",
    body_style
))
story.append(Spacer(1, 5))
story.append(RLImage(cloud_img_path, width=525, height=170))
story.append(Spacer(1, 5))

cloud_steps_data = [[
    Paragraph(
        "<b>Instrukcja wyłączenia:</b><br/>"
        "1. W lewym górnym rogu klienta kliknij: <b>Steam</b> &gt; <b>Ustawienia</b> (Settings).<br/>"
        "2. W menu bocznym wejdź w zakładkę <b>Cloud</b> (Chmura).<br/>"
        "3. Odznacz suwak: <b>„Włącz synchronizację ze Steam Cloud dla aplikacji, które ją obsługują”</b> (musi być <b>SZARY / OFF</b>).<br/>"
        "4. <i>(Dodatkowo dla pewności)</i> Kliknij prawym przyciskiem myszy na grę w bibliotece &gt; <b>Właściwości</b> &gt; w zakładce <b>Ogólne</b> upewnij się, że Steam Cloud jest wyłączony.",
        body_style
    )
]]
cloud_steps_table = Table(cloud_steps_data, colWidths=[525])
cloud_steps_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1b2636")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#66c0f4")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(cloud_steps_table)

story.append(PageBreak())

# ==========================================
# STRONA 2: KROK 2 (REMOTE PLAY) + KROK 3 (OFFLINE)
# ==========================================
story.append(Paragraph("KROK 2: Wyłączenie Steam Remote Play", h1_style))
story.append(Paragraph(
    "<b>Dlaczego to ważne:</b> Funkcja Remote Play służy do przesyłania obrazu gry przez sieć. Wyłączenie jej zapobiega przypadkowemu podglądaniu Twojego ekranu przez innych lub dołączaniu do Twojej sesji.",
    body_style
))
story.append(Spacer(1, 5))
story.append(RLImage(remote_img_path, width=525, height=155))
story.append(Spacer(1, 5))

remote_steps_data = [[
    Paragraph(
        "<b>Instrukcja wyłączenia:</b> Kliknij: <b>Steam</b> &gt; <b>Ustawienia</b> &gt; zakładka <b>Remote Play</b> &gt; odznacz pozycję <b>„Włącz Remote Play”</b> (przełącznik <b>SZARY / OFF</b>).",
        body_style
    )
]]
remote_table = Table(remote_steps_data, colWidths=[525])
remote_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1b2636")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#3e5369")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(remote_table)
story.append(Spacer(1, 10))

# KROK 3: CYKL GRY & TRYB OFFLINE
story.append(Paragraph("KROK 3: Prawidłowy Cykl Gry & Tryb Offline (Zasada 100% Działania)", h1_style))
story.append(Paragraph(
    "Steam pozwala uruchomić daną grę w trybie Online tylko <b>jednej osobie naraz</b>. Jeśli ktoś uruchomi grę online, natychmiast wyrzuci z rozgrywki drugą osobę. <b>W trybie Offline możecie grać wszyscy jednocześnie bez żadnych zakłóceń!</b>",
    body_style
))
story.append(Spacer(1, 5))
story.append(RLImage(offline_img_path, width=525, height=170))
story.append(Spacer(1, 5))

steps_workflow = [
    [
        Paragraph("<b>KROK PO KROKU — JAK GRAĆ:</b>", ParagraphStyle("WfH", parent=body_style, fontName="SegoeUI-Bold", textColor=colors.HexColor("#a4d007"))),
    ],
    [
        Paragraph(
            "<b>1. Pobranie gry:</b> Będąc Online pobierz i zainstaluj grę na swój dysk.<br/>"
            "<b>2. Pierwsze uruchomienie (Jednorazowo):</b> Uruchom grę raz na 30 sekund w trybie Online (aby pobrały się pliki DirectX/VC++ i aktywował klucz DRM/Denuvo), a następnie wyłącz grę.<br/>"
            "<b>3. Przejście w Offline:</b> W menu Steam (lewy górny róg) kliknij <b>Steam</b> &gt; <b>Przejdź w tryb offline...</b> &gt; wybierz <b>„Uruchom ponownie w trybie offline”</b>.<br/>"
            "<b>4. Graj do woli:</b> Uruchamiaj grę i graj <b>wyłącznie w trybie offline</b>!<br/>"
            "<b>5. Aktualizacje gier:</b> Gdy wyjdzie patch, wyjdź z gry &gt; przejdź w tryb Online &gt; zaktualizuj &gt; <u>natychmiast wróć w tryb Offline</u>.",
            body_style
        )
    ]
]
wf_table = Table(steps_workflow, colWidths=[525])
wf_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#16202d")),
    ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#5c7e10")),
    ('PADDING', (0, 0), (-1, -1), 7),
]))
story.append(wf_table)

story.append(PageBreak())

# ==========================================
# STRONA 3: KODEKS, ZASADY & FAQ
# ==========================================
story.append(Paragraph("Kodeks i Żelazne Zasady Korzystania z Konta", h1_style))
story.append(Paragraph("Aby konto służyło wszystkim przez lata bez blokad i problemów, bezwzględnie przestrzegaj poniższych zasad:", body_style))
story.append(Spacer(1, 8))

rules_data = [
    [
        Paragraph("<b>[X] CZEGO KATEGORYCZNIE NIE WOLNO ROBIĆ</b>", alert_danger_style),
        Paragraph("<b>[V] DOBRE PRAKTYKI</b>", alert_success_style)
    ],
    [
        Paragraph(
            "• <b>Nie zmieniaj hasła, maila ani loginu</b> konta.<br/><br/>"
            "• <b>Nie dodawaj Steam Guard na swój telefon</b> (numer SMS / mobilny token).<br/><br/>"
            "• <b>Nie używaj cheatów, trainerów ani modów multiplayer</b> — ryzyko permanentnego bana VAC na całe konto!<br/><br/>"
            "• <b>Nie kupuj gier ani nie podpinaj kart</b> płatniczych do tego konta.<br/><br/>"
            "• <b>Nie włączaj Steam Cloud</b>.",
            body_style
        ),
        Paragraph(
            "• <b>Zawsze graj w trybie Offline</b>.<br/><br/>"
            "• Zaznacz <b>„Zapamiętaj hasło”</b> na swoim PC, aby nie wpisywać go za każdym razem.<br/><br/>"
            "• W razie problemu z kodem logowania napisz bezpośrednio do właściciela konta.<br/><br/>"
            "• Po skończeniu gry możesz bezpiecznie przełączyć się z powrotem na swoje prywatne konto Steam w opcji <i>„Zmień konto”</i>.",
            body_style
        )
    ]
]

rules_table = Table(rules_data, colWidths=[255, 270])
rules_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#261616")),
    ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#142416")),
    ('BOX', (0, 0), (0, -1), 1.5, colors.HexColor("#e35e5e")),
    ('BOX', (1, 0), (1, -1), 1.5, colors.HexColor("#4c9c22")),
    ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor("#1f2d3d")),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(rules_table)
story.append(Spacer(1, 12))

story.append(Paragraph("Najczęstsze Pytania i Odpowiedzi (FAQ)", h1_style))

faq_data = [
    [
        Paragraph("<b>P: Gra wyrzuciła mnie z komunikatem „Konto jest używane na innym urządzeniu”?</b><br/>"
                  "<font color='#c6d4df'>O: Oznacza to, że uruchomiłeś grę w trybie Online, a inny znajomy również próbuje grać. Zamknij grę, przełącz Steam w tryb Offline (Krok 3) i uruchom grę ponownie.</font>", body_style)
    ],
    [
        Paragraph("<b>P: Czy jak przełączę się na swoje prywatne konto Steam, to stracę pobraną grę?</b><br/>"
                  "<font color='#c6d4df'>O: Nie! Pliki gry pozostają zainstalowane na Twoim dysku. Kiedy zechcesz zagrać, po prostu kliknij w lewym górnym rogu <i>Steam &gt; Zmień konto</i>, wybierz konto współdzielone w trybie offline i graj dalej.</font>", body_style)
    ],
    [
        Paragraph("<b>P: Gdzie zapisują się moje osiągnięcia i stan gry?</b><br/>"
                  "<font color='#c6d4df'>O: Zapisy gry znajdują się lokalnie w folderze Twojego użytkownika Windows (np. w <code>%USERPROFILE%/Saved Games</code> lub <code>AppData</code>). Ponieważ Steam Cloud jest wyłączony, nikt inny nie ma dostępu do Twoich save'ów.</font>", body_style)
    ]
]

faq_table = Table(faq_data, colWidths=[525])
faq_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#16202d")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#2a475e")),
    ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor("#1b2838")),
    ('PADDING', (0, 0), (-1, -1), 7),
]))
story.append(faq_table)
story.append(Spacer(1, 10))

footer_box = Table([[
    Paragraph("<font color='#66c0f4'><b>Życzymy udanej i bezproblemowej rozgrywki!</b></font><br/><font color='#8f98a0' size='8.5'>Dokument wygenerowany dla grupy znajomych konta współdzielonego Steam.</font>", ParagraphStyle("FooterP", parent=body_style, alignment=1))
]], colWidths=[525])
footer_box.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#111822")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#1b2838")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(footer_box)

# 4. Kompilacja dokumentu
doc.build(story, canvasmaker=NumberedCanvas, onFirstPage=draw_background, onLaterPages=draw_background)
print(f"SUCCESS: PDF generated at {pdf_path}")
