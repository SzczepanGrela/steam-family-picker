#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Maksymalnie prosta, przejrzysta i zwięzła instrukcja PDF (bez powtórzeń i zbędnego tekstu).
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

class CleanNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(CleanNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(CleanNumberedCanvas, self).showPage()
        super(CleanNumberedCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        # Górna subtelna linia
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.8)
        self.line(30, A4[1]-24, A4[0]-30, A4[1]-24)
        
        self.setFont("SegoeUI-Bold", 8)
        self.setFillColor(colors.HexColor("#0284c7"))
        self.drawString(30, A4[1]-18, "STEAM • INSTRUKCJA KONTA WSPÓŁDZIELONEGO")
        
        # Dolna linia i czysty numer strony
        self.line(30, 24, A4[0]-30, 24)
        self.setFont("SegoeUI", 8)
        self.setFillColor(colors.HexColor("#94a3b8"))
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
    "Title",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=15,
    leading=19,
    textColor=colors.HexColor("#0f172a"),
    spaceAfter=2
)

t_subtitle = ParagraphStyle(
    "Sub",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#64748b"),
    spaceAfter=6
)

h1_style = ParagraphStyle(
    "H1",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=10.5,
    leading=14,
    textColor=colors.HexColor("#0284c7"),
    spaceBefore=4,
    spaceAfter=3
)

b_text = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=8.5,
    leading=11.8,
    textColor=colors.HexColor("#334155")
)

toc_link = ParagraphStyle(
    "TOC",
    parent=b_text,
    fontName="SegoeUI",
    fontSize=8.5,
    leading=11.5,
    textColor=colors.HexColor("#0284c7")
)

story = []

# =========================================================================
# STRONA 1: DANE, SPIS TREŚCI, LOGOWANIE, CLOUD & REMOTE PLAY
# =========================================================================

story.append(Paragraph("Instrukcja Korzystania z Konta Współdzielonego Steam", t_title))
story.append(Paragraph("Szybki poradnik: logowanie, konfiguracja, gra offline oraz przenoszenie zapisów", t_subtitle))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=6))

# BOX: DANE LOGOWANIA
creds_data = [
    [
        Paragraph("<b>DANE DO LOGOWANIA</b>", ParagraphStyle("H_Cred", parent=b_text, fontName="SegoeUI-Bold", fontSize=9, textColor=colors.HexColor("#0284c7"))),
        Paragraph("<b>INFORMACJE STARTOWE</b>", ParagraphStyle("H_Info", parent=b_text, fontName="SegoeUI-Bold", fontSize=9, textColor=colors.HexColor("#0f172a")))
    ],
    [
        Paragraph(
            "Login: <b><font size='10' color='#0f172a'>tuzzabroware</font></b><br/>"
            "Hasło: <b><font size='10' color='#0f172a'>Czteryzera0000</font></b><br/>"
            "<font color='#16a34a'><b>[V] Zaznacz: „Zapamiętaj moje hasło”</b></font>",
            b_text
        ),
        Paragraph(
            "• <b>Steam Guard jest wyłączony</b> — logujesz się od razu bez kodów.<br/>"
            "• Po zalogowaniu konto zostaje na stałe w pamięci Steam na Twoim PC.<br/>"
            "• Zakaz zmiany hasła, adresu e-mail oraz włączania Steam Guard.",
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

# KROK 1
story.append(Paragraph("<a name='sec_step1'/><b>1. Pierwsze logowanie i przełączanie kont</b>", h1_style))
step1_data = [
    [
        RLImage(img_switch, width=170, height=100),
        Paragraph(
            "• Zaloguj się na konto <b>tuzzabroware</b> i zaznacz <i>„Zapamiętaj moje hasło”</i>.<br/>"
            "• Konto zostanie zapisane w pamięci Steam.<br/>"
            "• W każdej chwili możesz przełączać się między swoim prywatnym kontem a tym profilem klikając w lewym górnym rogu: <b>Steam &gt; Zmień konto...</b><br/>"
            "• Gry zainstalowane na dysku pozostają dostępne bez konieczności ponownego pobierania.",
            b_text
        )
    ]
]
t_step1 = Table(step1_data, colWidths=[180, 355])
t_step1.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_step1)
story.append(Spacer(1, 6))

# KROK 2: JEDNORAZOWE SPRAWDZENIE USTAWIEŃ (CLOUD + REMOTE PLAY)
story.append(Paragraph("<a name='sec_step2'/><b>2. Sprawdź przy 1. logowaniu: Ustawienia Steam (Robisz to tylko raz)</b>", h1_style))

cloud_box_data = [
    [
        RLImage(img_cloud, width=210, height=76),
        Paragraph(
            "<b>WYŁĄCZ STEAM CLOUD:</b><br/>"
            "Ścieżka: <b>Steam &gt; Ustawienia &gt; Cloud</b> &rarr; odznacz suwak <i>„Włącz Steam Cloud”</i> (SZARY / OFF).<br/>"
            "<b>Dlaczego:</b> Gdyby chmura była włączona, zapisy różnych osób nadpisywałyby się nawzajem na serwerze. Po wyłączeniu chmury Twoje save'y są <u>wyłącznie lokalnie na Twoim komputerze</u> i nikt ich nie dotknie.",
            b_text
        )
    ]
]
t_cloud = Table(cloud_box_data, colWidths=[220, 315])
t_cloud.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#fca5a5")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_cloud)
story.append(Spacer(1, 5))

remote_box_data = [
    [
        RLImage(img_remote, width=210, height=76),
        Paragraph(
            "<b>WYŁĄCZ REMOTE PLAY:</b><br/>"
            "Ścieżka: <b>Steam &gt; Ustawienia &gt; Remote Play</b> &rarr; odznacz suwak (SZARY / OFF).<br/>"
            "<b>Dlaczego:</b> Zapobiega to przypadkowemu przesyłaniu obrazu gry przez sieć na komputer innego zalogowanego znajomego.",
            b_text
        )
    ]
]
t_remote = Table(remote_box_data, colWidths=[220, 315])
t_remote.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_remote)

# =========================================================================
# STRONA 2: JAK GRAĆ (OFFLINE) ORAZ ZASADY
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("<a name='sec_step3'/><b>3. Jak grać: Tryb Offline & Zasady</b>", h1_style))
story.append(Paragraph(
    "<b>Dlaczego gramy w trybie Offline?</b><br/>"
    "W trybie <b>Online</b> Steam pozwala grać w dany tytuł tylko 1 osobie naraz (kolejna wyrzuca poprzednią z gry). <b>W trybie Offline każdy może grać w tę samą grę jednocześnie bez zakłóceń.</b>",
    b_text
))
story.append(Spacer(1, 5))

step4_data = [
    [
        RLImage(img_offline, width=175, height=143),
        Paragraph(
            "<b>INSTRUKCJA KROK PO KROKU:</b><br/><br/>"
            "1. <b>Pobierz grę</b> będąc online.<br/>"
            "2. <b>Uruchom ją raz na 30 sekund</b> (do menu głównego), po czym zamknij grę.<br/>"
            "3. W lewym górnym rogu kliknij <b>Steam &gt; Przejdź do trybu offline...</b> &gt; wybierz <i>„Uruchom ponownie w trybie offline”</i>.<br/>"
            "4. <b>Graj do woli w trybie Offline.</b><br/>"
            "5. Gdy pojawi się aktualizacja gry: wyłącz grę &gt; przejdź w tryb online &gt; pobierz patch &gt; wróć do trybu offline.",
            b_text
        )
    ]
]
t_step4 = Table(step4_data, colWidths=[185, 350])
t_step4.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
    ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#22c55e")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_step4)
story.append(Spacer(1, 8))

# ZASADY
story.append(Paragraph("Zasady korzystania z konta", h1_style))

rules_data = [
    [
        Paragraph("<b>CZEGO NIE WOLNO:</b>", ParagraphStyle("R1", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#dc2626"))),
        Paragraph("<b>DOBRE PRAKTYKI:</b>", ParagraphStyle("R2", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#16a34a")))
    ],
    [
        Paragraph(
            "• <b>Nie graj online</b> (wyrzucisz innego znajomego z gry).<br/>"
            "• <b>Nie włączaj Steam Cloud</b> (zepsujesz zapisy gry).<br/>"
            "• <b>Nie zmieniaj hasła, loginu ani maila</b>.<br/>"
            "• <b>Nie włączaj Steam Guard</b> na swój numer/telefon.<br/>"
            "• <b>Zero cheatów i trainerów</b> (ryzyko bana VAC).",
            b_text
        ),
        Paragraph(
            "• <b>Graj w trybie Offline</b>.<br/>"
            "• Ustawienia Cloud i Remote Play sprawdzasz tylko raz przy 1. logowaniu — Steam pamięta je na Twoim PC.<br/>"
            "• Twoje save'y są w 100% bezpieczne lokalnie na Twoim dysku.<br/>"
            "• Po skończonej grze możesz wrócić na swoje prywatne konto (<i>Steam &gt; Zmień konto</i>).",
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
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_rules)

# =========================================================================
# STRONA 3: PRZENOSZENIE SAVE'ÓW (ISAAC, TYPY GIER, WYJĄTKI)
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("<a name='sec_saves'/><b>4. Jak przenieść zapisy gry (Save'y) na nowe konto?</b>", t_title))
story.append(Paragraph("Instrukcja podmiany plików zapisu na przykładzie The Binding of Isaac oraz podział gier wg kompatybilności", t_subtitle))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=5))

story.append(Paragraph("Przykład: The Binding of Isaac (Repentance / Rebirth)", h1_style))
story.append(Paragraph(
    "W <i>The Binding of Isaac</i> zapisy są przypisane do numeru SteamID. Aby przenieść postęp i odblokowane postacie na konto <b>tuzzabroware</b>:",
    b_text
))
story.append(Spacer(1, 3))

isaac_steps_data = [
    [
        Paragraph(
            "<b>1. Znajdź swój stary save:</b><br/>"
            "Wejdź do folderu: <code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;TWÓJ_STARY_STEAM_ID&gt;\\250900\\remote\\</code><br/>"
            "<i>(<code>250900</code> to AppID Isaaca. Plik zapisu to np. <code>rep_persistentgamedata1.dat</code>).</i><br/><br/>"
            "<b>2. Znajdź folder konta tuzzabroware:</b><br/>"
            "Po pierwszym zalogowaniu na <b>tuzzabroware</b> i uruchomieniu gry, w <code>Steam\\userdata\\</code> utworzy się nowy folder z ID nowego konta.<br/><br/>"
            "<b>3. Skopiuj plik zapisu:</b><br/>"
            "Skopiuj <code>rep_persistentgamedata1.dat</code> ze starego folderu do nowego:<br/>"
            "<code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;NOWY_STEAM_ID_TUZZABROWARE&gt;\\250900\\remote\\</code><br/>"
            "<i>(Zawsze zrób wcześniej kopię zapasową pliku na Pulpit!)</i>.<br/><br/>"
            "<b>4. Gotowe:</b> Uruchom grę w trybie offline — Twój postęp będzie załadowany.",
            b_text
        )
    ]
]
t_isaac = Table(isaac_steps_data, colWidths=[535])
t_isaac.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#0284c7")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_isaac)
story.append(Spacer(1, 6))

# TABELA TYPÓW GIER
story.append(Paragraph("Jak różne gry na Steam przechowują zapisy?", h1_style))

types_data = [
    [
        Paragraph("<b>TYP GRY</b>", ParagraphStyle("TH1", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a"))),
        Paragraph("<b>LOKALIZACJA SAVE'A</b>", ParagraphStyle("TH2", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a"))),
        Paragraph("<b>CZY TRZEBA PRZENOSIĆ?</b>", ParagraphStyle("TH3", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a")))
    ],
    [
        Paragraph("<b>Zapisy Globalne</b><br/><i>(Wiedźmin 3, Cyberpunk 2077, Elden Ring, Baldur's Gate 3)</i>", b_text),
        Paragraph("<code>%LOCALAPPDATA%</code><br/><code>%USERPROFILE%\\Saved Games</code><br/><code>Dokumenty\\My Games</code>", b_text),
        Paragraph("<b>NIE (Działa samo):</b> Gra korzysta ze wspólnego folderu w Windowsie. Po zalogowaniu na nowe konto Twój save wczyta się automatycznie.", b_text)
    ],
    [
        Paragraph("<b>Zapisy w userdata</b><br/><i>(The Binding of Isaac, Hollow Knight, Dark Souls 3, Celeste)</i>", b_text),
        Paragraph("<code>Steam\\userdata\\&lt;SteamID&gt;\\&lt;AppID&gt;\\remote\\</code>", b_text),
        Paragraph("<b>TAK (Kopiowanie):</b> Wystarczy przekopiować pliki ze starego folderu SteamID do nowego (zgodnie z instrukcją wyżej).", b_text)
    ],
    [
        Paragraph("<b>Zapisy szyfrowane</b><br/><i>(Monster Hunter: World, gry z kontem Ubisoft / EA)</i>", b_text),
        Paragraph("Szyfrowane stałym kluczem SteamID konta", b_text),
        Paragraph("<b>WYMAGA PROGRAMU:</b> Zapis jest powiązany z kontem. Wymaga użycia darmowego konwertera zapisu (np. z NexusMods).", b_text)
    ]
]
t_types = Table(types_data, colWidths=[155, 140, 240])
t_types.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f0fdf4")),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor("#fefce8")),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#fef2f2")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 5),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(t_types)
story.append(Spacer(1, 6))

# KIEDY SIĘ NIE DA
notes_data = [
    [
        Paragraph(
            "• <b>Kiedy się nie da przenieść save'a:</b> W grach typu <b>Always-Online / sieciowych</b> (np. <i>Destiny 2, Diablo 4, MMO</i>), gdzie postęp jest zapisywany wyłącznie na serwerach dewelopera, a nie na Twoim dysku.<br/>"
            "• <b>Pamiętaj:</b> Przed przenoszeniem plików zawsze upewnij się, że Steam Cloud jest wyłączony (Krok 2), a przed podmianą zrób kopię zapasową starego save'a.",
            ParagraphStyle("NAlert", parent=b_text, textColor=colors.HexColor("#991b1b"))
        )
    ]
]
t_notes = Table(notes_data, colWidths=[535])
t_notes.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff1f2")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#f43f5e")),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_notes)

doc.build(story, canvasmaker=CleanNumberedCanvas)
print(f"SUCCESS: Clean 3-Page PDF generated at {pdf_path}")
