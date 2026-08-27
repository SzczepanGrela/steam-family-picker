#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator 2-stronicowej, przejrzystej instrukcji w białym motywie (White Edition)
z wykorzystaniem PRAWDZIWYCH zrzutów ekranu ze Steama.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, HRFlowable
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

DOCS_DIR = "/home/szcze/projects/steam-family-picker/docs"
SCREEN_DIR = os.path.join(DOCS_DIR, "screenshots")

img_switch = os.path.join(SCREEN_DIR, "1_switch.png")
img_cloud = os.path.join(SCREEN_DIR, "2_cloud.png")
img_remote = os.path.join(SCREEN_DIR, "3_remote.png")
img_offline = os.path.join(SCREEN_DIR, "4_offline.png")

# Canvas ze stylowym nagłówkiem i stopką
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
        # Górna linia i nagłówek
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(1)
        self.line(30, A4[1]-24, A4[0]-30, A4[1]-24)
        
        self.setFont("SegoeUI-Bold", 8)
        self.setFillColor(colors.HexColor("#0284c7"))
        self.drawString(30, A4[1]-18, "STEAM • INSTRUKCJA KORZYSTANIA Z KONTA WSPÓŁDZIELONEGO")
        
        # Dolna linia i stopka
        self.line(30, 24, A4[0]-30, 24)
        self.setFont("SegoeUI", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(30, 12, "Instrukcja dla grupy znajomych • Graj zawsze w trybie Offline")
        self.drawRightString(A4[0]-30, 12, f"Strona {self._pageNumber} z {page_count}")
        self.restoreState()

pdf_path = os.path.join(DOCS_DIR, "Instrukcja_Konta_Wspoldzielonego_Steam.pdf")
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
    fontSize=15,
    leading=19,
    textColor=colors.HexColor("#0f172a"),
    alignment=0,
    spaceAfter=2
)

t_subtitle = ParagraphStyle(
    "WhiteSub",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#64748b"),
    alignment=0,
    spaceAfter=6
)

h1_style = ParagraphStyle(
    "WhiteH1",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=11,
    leading=14,
    textColor=colors.HexColor("#0284c7"),
    spaceBefore=4,
    spaceAfter=3
)

b_text = ParagraphStyle(
    "WhiteBody",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=8.5,
    leading=11.5,
    textColor=colors.HexColor("#334155")
)

b_alert = ParagraphStyle(
    "WhiteAlert",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=8,
    leading=11,
    textColor=colors.HexColor("#991b1b")
)

story = []

# =========================================================================
# STRONA 1: DANE LOGOWANIA, PIERWSZE LOGOWANIE ORAZ JEDNORAZOWA KONFIGURACJA
# =========================================================================

story.append(Paragraph("Instrukcja Korzystania z Konta Współdzielonego Steam", t_title))
story.append(Paragraph("Poradnik krok po kroku: logowanie, jednorazowa konfiguracja oraz granie w trybie Offline", t_subtitle))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=6))

# 1. DANE LOGOWANIA BOX
creds_data = [
    [
        Paragraph("<b>[+] DANE DO LOGOWANIA:</b>", ParagraphStyle("CH1", parent=b_text, fontName="SegoeUI-Bold", fontSize=9, textColor=colors.HexColor("#0284c7"))),
        Paragraph("<b>[!] WAŻNE WSKAZÓWKI:</b>", ParagraphStyle("CH2", parent=b_text, fontName="SegoeUI-Bold", fontSize=9, textColor=colors.HexColor("#d97706")))
    ],
    [
        Paragraph(
            "Login: <b><font size='10' color='#0f172a'>tuzzabroware</font></b><br/>"
            "Hasło: <b><font size='10' color='#0f172a'>Czteryzera0000</font></b><br/>"
            "<font color='#16a34a'><b>[V] Zaznacz ptaszek: „Zapamiętaj moje hasło”</b></font>",
            b_text
        ),
        Paragraph(
            "• Przy 1. logowaniu Steam poprosi o <b>kod Steam Guard</b> lub zatwierdzenie.<br/>"
            "• Napisz na Discordzie/Messengerze do właściciela konta o potwierdzenie.<br/>"
            "• <b>Kategoryczny zakaz zmiany hasła, maila, nicku i numeru telefonu!</b>",
            b_text
        )
    ]
]
t_creds = Table(creds_data, colWidths=[240, 295])
t_creds.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 7),
    ('RIGHTPADDING', (0, 0), (-1, -1), 7),
]))
story.append(t_creds)
story.append(Spacer(1, 6))

# 2. KROK 1: PIERWSZE LOGOWANIE & DODANIE KONTA
story.append(Paragraph("KROK 1: Pierwsze logowanie i łatwe przełączanie kont", h1_style))
step1_data = [
    [
        RLImage(img_switch, width=180, height=106),
        Paragraph(
            "<b>Jak to działa:</b><br/>"
            "1. Zaloguj się na konto <b>tuzzabroware</b> i zaznacz <i>„Zapamiętaj moje hasło”</i>.<br/>"
            "2. Konto zostanie na stałe zapisane w Twoim kliencie Steam.<br/>"
            "3. Gdy zechcesz wrócić na swoje konto lub z powrotem na współdzielone — w lewym górnym rogu kliknij: <b>Steam &gt; Zmień konto...</b><br/>"
            "4. <b>Pobrane gry NIE znikają z dysku</b> po przełączeniu konta!",
            b_text
        )
    ]
]
t_step1 = Table(step1_data, colWidths=[190, 345])
t_step1.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_step1)
story.append(Spacer(1, 6))

# 3. KROK 2: WYŁĄCZENIE STEAM CLOUD (SPRAWDŹ TYLKO PRZY 1. LOGOWANIU)
story.append(Paragraph("KROK 2: Wyłączenie Steam Cloud (Sprawdź tylko raz przy 1. logowaniu!)", h1_style))
step2_data = [
    [
        RLImage(img_cloud, width=230, height=84),
        Paragraph(
            "<b>Dlaczego to wyłączamy?</b><br/>"
            "Z konta korzysta kilka osób. Gdyby chmura była włączona, Steam wysyłałby save'y na serwer i <b>różne osoby nadpisywałyby lub kasowałyby sobie nawzajem zapisy gry</b>.<br/>"
            "<b>Gdzie to wyłączyć:</b> Wejdź w <b>Steam &gt; Ustawienia &gt; Cloud</b> i odznacz suwak <i>„Włącz Steam Cloud”</i> (musi być <b>SZARY / OFF</b>).<br/>"
            "<font color='#b45309'><b>[!] WAŻNE:</b> Po wyłączeniu chmury Twoje save'y zapisują się <u>wyłącznie lokalnie na Twoim komputerze</u> — nikt ich nie nadpisze ani nie usunie!</font>",
            b_text
        )
    ]
]
t_step2 = Table(step2_data, colWidths=[240, 295])
t_step2.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#fca5a5")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_step2)
story.append(Spacer(1, 6))

# 4. KROK 3: WYŁĄCZENIE REMOTE PLAY (SPRAWDŹ TYLKO PRZY 1. LOGOWANIU)
story.append(Paragraph("KROK 3: Wyłączenie Remote Play (Sprawdź tylko raz przy 1. logowaniu!)", h1_style))
step3_data = [
    [
        RLImage(img_remote, width=230, height=84),
        Paragraph(
            "<b>Dlaczego to wyłączamy?</b><br/>"
            "Funkcja Remote Play służy do strumieniowania obrazu gry przez sieć. Wyłączenie jej zapobiega przypadkowemu streamowaniu Twojego ekranu na PC innego znajomego lub próbom zdalnego sterowania.<br/>"
            "<b>Gdzie to wyłączyć:</b> Wejdź w <b>Steam &gt; Ustawienia &gt; Remote Play</b> i odznacz suwak <i>„Włącz Remote Play”</i> (przełącznik <b>SZARY / OFF</b>).",
            b_text
        )
    ]
]
t_step3 = Table(step3_data, colWidths=[240, 295])
t_step3.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_step3)

# =========================================================================
# STRONA 2: JAK GRAĆ (TRYB OFFLINE) ORAZ ŻELAZNE ZASADY
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("KROK 4: Codzienne Granie w Trybie Offline (Zasada 100% Działania)", h1_style))
story.append(Paragraph(
    "<b>Dlaczego gramy ZAWSZE w trybie Offline?</b><br/>"
    "• W trybie <b>Online</b> Steam zezwala na uruchomienie gry <b>tylko 1 osobie naraz</b> (kolejna osoba natychmiast wyrzuca poprzednią z rozgrywki).<br/>"
    "• W trybie <b>Offline</b> to ograniczenie znika — <b>wiele osób może grać jednocześnie w tę samą grę bez żadnych zakłóceń!</b>",
    b_text
))
story.append(Spacer(1, 6))

step4_data = [
    [
        RLImage(img_offline, width=180, height=147),
        Paragraph(
            "<b>PROSTY CYKL — JAK POPRAWNIE GRAĆ:</b><br/><br/>"
            "<b>1. Pobranie gry:</b> Będąc Online pobierz i zainstaluj grę na dysk.<br/>"
            "<b>2. Pierwsze uruchomienie (Jednorazowo):</b> Uruchom grę raz na 30 sekund (do menu głównego), aby aktywować licencję DRM i pliki DirectX, po czym wyłącz grę.<br/>"
            "<b>3. Przejdź w Tryb Offline:</b> W lewym górnym rogu kliknij menu <b>Steam &gt; Przejdź do trybu offline...</b> &gt; wybierz <i>„Uruchom ponownie w trybie offline”</i>.<br/>"
            "<b>4. Graj do woli:</b> Uruchamiaj gry i graj <b>ZAWSZE w trybie Offline</b>!<br/>"
            "<b>5. Aktualizacje gier:</b> Gdy wyjdzie patch: wyłącz grę &gt; przejdź w tryb Online &gt; pobierz aktualizację &gt; <u>natychmiast wróć do trybu Offline</u>.",
            b_text
        )
    ]
]
t_step4 = Table(step4_data, colWidths=[190, 345])
t_step4.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
    ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#22c55e")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 7),
]))
story.append(t_step4)
story.append(Spacer(1, 10))

# ŻELAZNE ZASADY TABELA
story.append(Paragraph("Kodeks i Żelazne Zasady Korzystania z Konta", h1_style))

rules_data = [
    [
        Paragraph("<b>[X] ZAKAZY (Czego NIE robić):</b>", ParagraphStyle("R1", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#dc2626"))),
        Paragraph("<b>[V] PRAWIDŁOWE POSTĘPOWANIE:</b>", ParagraphStyle("R2", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#16a34a")))
    ],
    [
        Paragraph(
            "• <b>NIGDY nie uruchamiaj gry w trybie Online</b> (wyrzucisz z gry innego grającego znajomego!).<br/><br/>"
            "• <b>Nie włączaj Steam Cloud</b> (zepsujesz save'y sobie i innym).<br/><br/>"
            "• <b>Nie zmieniaj hasła, adresu e-mail, loginu ani nicku</b>.<br/><br/>"
            "• <b>Nie dodawaj Steam Guard na swój numer telefonu</b>.<br/><br/>"
            "• <b>Kategoryczny zakaz cheatów, trainerów i modów sieciowych</b> (ryzyko bana VAC na całe konto).",
            b_text
        ),
        Paragraph(
            "• <b>ZAWSZE graj w trybie Offline</b>.<br/><br/>"
            "• <b>Ustawienia Cloud i Remote Play konfigurujesz TYLKO RAZ przy 1. logowaniu</b> — Steam zapamięta je na Twoim PC.<br/><br/>"
            "• <b>Twoje save'y są w 100% bezpieczne lokalnie na Twoim dysku</b> (w folderze AppData / Saved Games).<br/><br/>"
            "• Po skończonej grze możesz w każdej chwili przełączyć się na swoje prywatne konto (<i>Steam &gt; Zmień konto</i>).",
            b_text
        )
    ]
]
t_rules = Table(rules_data, colWidths=[265, 270])
t_rules.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#fef2f2")),
    ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#f0fdf4")),
    ('BOX', (0, 0), (0, -1), 1.5, colors.HexColor("#f87171")),
    ('BOX', (1, 0), (1, -1), 1.5, colors.HexColor("#4ade80")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ('PADDING', (0, 0), (-1, -1), 7),
]))
story.append(t_rules)
story.append(Spacer(1, 10))

# PODSUMOWANIE
t_foot = Table([[
    Paragraph(
        "<font color='#0284c7'><b>Życzymy udanej i bezproblemowej rozgrywki!</b></font><br/>"
        "<font color='#64748b' size='8'>W razie problemów z kodem Steam Guard przy logowaniu napisz bezpośrednio do właściciela konta.</font>",
        ParagraphStyle("F1", parent=b_text, alignment=1)
    )
]], colWidths=[535])
t_foot.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_foot)

doc.build(story, canvasmaker=WhiteNumberedCanvas)
print(f"SUCCESS: 2-Page White PDF generated at {pdf_path}")
