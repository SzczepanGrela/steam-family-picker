#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator kompletnego poradnika PDF dla użytkowników konta współdzielonego Steam.
Wydanie rozszerzone (White Edition):
- Interaktywny spis treści z klikalnymi odnośnikami
- Prawdziwe zrzuty ekranu ze Steama
- Sekcja przenoszenia save'ów na przykładzie The Binding of Isaac
- Kompletna tabela kompatybilności i typów gier
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
        # Górny nagłówek
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(1)
        self.line(30, A4[1]-22, A4[0]-30, A4[1]-22)
        
        self.setFont("SegoeUI-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0284c7"))
        self.drawString(30, A4[1]-16, "STEAM • INSTRUKCJA KORZYSTANIA Z KONTA WSPÓŁDZIELONEGO")
        
        # Dolna stopka
        self.line(30, 22, A4[0]-30, 22)
        self.setFont("SegoeUI", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(30, 11, "Instrukcja dla grupy znajomych • Graj zawsze w trybie Offline • Save'y lokalne")
        self.drawRightString(A4[0]-30, 11, f"Strona {self._pageNumber} z {page_count}")
        self.restoreState()

pdf_path = os.path.join(DOCS_DIR, "Instrukcja_Konta_Wspoldzielonego_Steam.pdf")
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    leftMargin=28,
    rightMargin=28,
    topMargin=28,
    bottomMargin=28
)

styles = getSampleStyleSheet()

t_title = ParagraphStyle(
    "WhiteTitle",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#0f172a"),
    spaceAfter=2
)

t_subtitle = ParagraphStyle(
    "WhiteSub",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#64748b"),
    spaceAfter=5
)

h1_style = ParagraphStyle(
    "WhiteH1",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=10,
    leading=13,
    textColor=colors.HexColor("#0284c7"),
    spaceBefore=3,
    spaceAfter=2
)

h2_sec = ParagraphStyle(
    "WhiteH2Sec",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=9.5,
    leading=12,
    textColor=colors.HexColor("#0f172a"),
    spaceBefore=3,
    spaceAfter=2
)

b_text = ParagraphStyle(
    "WhiteBody",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=8,
    leading=10.8,
    textColor=colors.HexColor("#334155")
)

b_bold = ParagraphStyle(
    "WhiteBodyBold",
    parent=b_text,
    fontName="SegoeUI-Bold",
    textColor=colors.HexColor("#0f172a")
)

toc_link = ParagraphStyle(
    "TOCLink",
    parent=b_text,
    fontName="SegoeUI",
    fontSize=8,
    leading=10.5,
    textColor=colors.HexColor("#0284c7")
)

b_alert = ParagraphStyle(
    "WhiteAlert",
    parent=b_text,
    fontName="SegoeUI",
    fontSize=7.8,
    leading=10.5,
    textColor=colors.HexColor("#991b1b")
)

story = []

# =========================================================================
# STRONA 1: DANE LOGOWANIA, SPIS TREŚCI, PIERWSZE LOGOWANIE, CLOUD & REMOTE PLAY
# =========================================================================

story.append(Paragraph("Instrukcja Korzystania z Konta Współdzielonego Steam", t_title))
story.append(Paragraph("Kompletny przewodnik: logowanie, jednorazowa konfiguracja, tryb Offline oraz przenoszenie zapisów gry (Save'ów)", t_subtitle))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=4))

# BOX: DANE + SPIS TREŚCI (2 kolumny)
header_grid_data = [
    [
        Paragraph("<b>[+] DANE DO LOGOWANIA:</b>", ParagraphStyle("CH1", parent=b_text, fontName="SegoeUI-Bold", fontSize=8.5, textColor=colors.HexColor("#0284c7"))),
        Paragraph("<b>[=] INTERAKTYWNY SPIS TREŚCI:</b>", ParagraphStyle("CH2", parent=b_text, fontName="SegoeUI-Bold", fontSize=8.5, textColor=colors.HexColor("#0f172a")))
    ],
    [
        Paragraph(
            "Login: <b><font size='9.5' color='#0f172a'>tuzzabroware</font></b><br/>"
            "Hasło: <b><font size='9.5' color='#0f172a'>Czteryzera0000</font></b><br/>"
            "<font color='#16a34a'><b>[V] Zaznacz: „Zapamiętaj moje hasło”</b></font><br/>"
            "• Kod Steam Guard: napisz do właściciela konta.<br/>"
            "• <b>Zakaz zmiany hasła, maila i numeru telefonu!</b>",
            b_text
        ),
        Paragraph(
            "• <a href='#sec_step1' color='#0284c7'><u>1. Pierwsze logowanie & przełączanie kont</u></a> (str. 1)<br/>"
            "• <a href='#sec_step2' color='#0284c7'><u>2. Wyłączenie Steam Cloud (Zapisy lokalne)</u></a> (str. 1)<br/>"
            "• <a href='#sec_step3' color='#0284c7'><u>3. Wyłączenie Steam Remote Play</u></a> (str. 1)<br/>"
            "• <a href='#sec_step4' color='#0284c7'><u>4. Codzienne granie: Tryb Offline (Zasada 100%)</u></a> (str. 2)<br/>"
            "• <a href='#sec_rules' color='#0284c7'><u>5. Kodeks & Żelazne Zasady współdzielenia</u></a> (str. 2)<br/>"
            "• <a href='#sec_saves' color='#0284c7'><u>6. <b>Przenoszenie save'ów (np. The Binding of Isaac)</b></u></a> (str. 3)<br/>"
            "• <a href='#sec_types' color='#0284c7'><u>7. Typy gier, częste błędy i kiedy save nie zadziała</u></a> (str. 3)",
            toc_link
        )
    ]
]
t_header = Table(header_grid_data, colWidths=[240, 299])
t_header.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_header)
story.append(Spacer(1, 4))

# KROK 1
story.append(Paragraph("<a name='sec_step1'/><b>KROK 1: Pierwsze logowanie i łatwe przełączanie kont</b>", h1_style))
step1_data = [
    [
        RLImage(img_switch, width=155, height=91),
        Paragraph(
            "<b>Jak to działa:</b><br/>"
            "1. Zaloguj się na konto <b>tuzzabroware</b> i zaznacz <i>„Zapamiętaj moje hasło”</i>.<br/>"
            "2. Konto zostanie na stałe przypisane do Twojego klienta Steam.<br/>"
            "3. Gdy chcesz wrócić na swoje prywatne konto lub na konto współdzielone — w lewym górnym rogu kliknij: <b>Steam &gt; Zmień konto...</b><br/>"
            "4. <b>Pobrane gry NIE znikają z dysku</b> po przełączeniu konta (są gotowe do gry).",
            b_text
        )
    ]
]
t_step1 = Table(step1_data, colWidths=[165, 374])
t_step1.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_step1)
story.append(Spacer(1, 4))

# KROK 2: STEAM CLOUD
story.append(Paragraph("<a name='sec_step2'/><b>KROK 2: Wyłączenie Steam Cloud (Sprawdź tylko raz przy 1. logowaniu!)</b>", h1_style))
step2_data = [
    [
        RLImage(img_cloud, width=200, height=72),
        Paragraph(
            "<b>Dlaczego to wyłączamy?</b><br/>"
            "Z konta korzysta kilka osób. Gdyby chmura była włączona, Steam wysyłałby save'y na serwer i <b>różne osoby nadpisywałyby lub kasowałyby sobie nawzajem zapisy gry</b>.<br/>"
            "<b>Gdzie to wyłączyć:</b> Wejdź w <b>Steam &gt; Ustawienia &gt; Cloud</b> i odznacz suwak <i>„Włącz Steam Cloud”</i> (musi być <b>SZARY / OFF</b>).<br/>"
            "<font color='#b45309'><b>[!] BARDZO WAŻNE:</b> Po wyłączeniu chmury Twoje save'y zapisują się <u>wyłącznie lokalnie na Twoim komputerze</u> — są w 100% bezpieczne i nikt inny ich nie nadpisze!</font>",
            b_text
        )
    ]
]
t_step2 = Table(step2_data, colWidths=[210, 329])
t_step2.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#fca5a5")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_step2)
story.append(Spacer(1, 4))

# KROK 3: REMOTE PLAY
story.append(Paragraph("<a name='sec_step3'/><b>KROK 3: Wyłączenie Remote Play (Sprawdź tylko raz przy 1. logowaniu!)</b>", h1_style))
step3_data = [
    [
        RLImage(img_remote, width=200, height=72),
        Paragraph(
            "<b>Dlaczego to wyłączamy?</b><br/>"
            "Funkcja Remote Play służy do strumieniowania obrazu gry przez sieć. Wyłączenie jej zapobiega przypadkowemu przesyłaniu Twojego ekranu na PC innego znajomego lub próbom zdalnego sterowania.<br/>"
            "<b>Gdzie to wyłączyć:</b> Wejdź w <b>Steam &gt; Ustawienia &gt; Remote Play</b> i odznacz suwak <i>„Włącz Remote Play”</i> (przełącznik <b>SZARY / OFF</b>).",
            b_text
        )
    ]
]
t_step3 = Table(step3_data, colWidths=[210, 329])
t_step3.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_step3)

# =========================================================================
# STRONA 2: TRYB OFFLINE (JAK GRAĆ), KODEKS ZASAD & FAQ
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("<a name='sec_step4'/><b>KROK 4: Codzienne Granie w Trybie Offline (Zasada 100% Działania)</b>", h1_style))
story.append(Paragraph(
    "<b>Dlaczego gramy ZAWSZE w trybie Offline?</b><br/>"
    "• W trybie <b>Online</b> Steam zezwala na uruchomienie gry <b>tylko 1 osobie naraz</b> (kolejna osoba natychmiast wyrzuca poprzednią z rozgrywki).<br/>"
    "• W trybie <b>Offline</b> to ograniczenie znika — <b>wiele osób może grać jednocześnie w tę samą grę bez żadnych zakłóceń!</b>",
    b_text
))
story.append(Spacer(1, 4))

step4_data = [
    [
        RLImage(img_offline, width=170, height=139),
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
t_step4 = Table(step4_data, colWidths=[180, 359])
t_step4.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
    ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#22c55e")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_step4)
story.append(Spacer(1, 6))

# ŻELAZNE ZASADY TABELA
story.append(Paragraph("<a name='sec_rules'/><b>Kodeks i Żelazne Zasady Korzystania z Konta</b>", h1_style))

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
t_rules = Table(rules_data, colWidths=[265, 274])
t_rules.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#fef2f2")),
    ('BACKGROUND', (1, 0), (1, -1), colors.HexColor("#f0fdf4")),
    ('BOX', (0, 0), (0, -1), 1.5, colors.HexColor("#f87171")),
    ('BOX', (1, 0), (1, -1), 1.5, colors.HexColor("#4ade80")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_rules)
story.append(Spacer(1, 6))

# FAQ MINI
story.append(Paragraph("Najczęstsze Pytania i Odpowiedzi (FAQ)", h2_sec))
faq_box_data = [
    [
        Paragraph(
            "• <b>Komunikat: „Konto jest używane na innym urządzeniu”?</b> &rarr; Uruchomiłeś grę Online. Zamknij ją, włącz tryb Offline (Krok 4) i uruchom grę ponownie.<br/>"
            "• <b>Czy po przełączeniu konta na swoje znikają gry?</b> &rarr; Nie! Wszystkie pobrane pliki gier pozostają na Twoim dysku gotowe do uruchomienia.",
            b_text
        )
    ]
]
t_faq = Table(faq_box_data, colWidths=[539])
t_faq.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_faq)

# =========================================================================
# STRONA 3: PORADNIK PRZENOSZENIA SAVE'ÓW (ISAAC, TYPY GIER, PROBLEMY)
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("<a name='sec_saves'/><b>Jak przenieść moje zapisy (Save'y) na konto tuzzabroware?</b>", t_title))
story.append(Paragraph("Kompletny poradnik krok po kroku: gdzie szukać plików zapisu, jak je podmienić oraz kiedy save zadziała", t_subtitle))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=4))

story.append(Paragraph("Praktyczny przykład: Przenoszenie save'a w The Binding of Isaac (Repentance / Rebirth)", h1_style))
story.append(Paragraph(
    "W grze <i>The Binding of Isaac</i> zapisy gry są powiązane z unikalnym numerem SteamID gracza. Aby przenieść swoje odblokowane postacie, przedmioty i postępy na konto <b>tuzzabroware</b>, wykonaj poniższe kroki:",
    b_text
))
story.append(Spacer(1, 3))

isaac_steps_data = [
    [
        Paragraph(
            "<b>INSTRUKCJA KROK PO KROKU DLA THE BINDING OF ISAAC:</b><br/><br/>"
            "<b>Krok 1 (Znajdź swój stary save):</b> Wejdź do folderu Steama na swoim dysku:<br/>"
            "<code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;TWÓJ_STARY_STEAM_ID&gt;\\250900\\remote\\</code><br/>"
            "<i>(Uwaga: <code>250900</code> to oficjalny AppID gry The Binding of Isaac: Rebirth/Repentance).</i><br/>"
            "Znajdziesz tam pliki zapisu, np.: <code>rep_persistentgamedata1.dat</code> (dla Repentance) lub <code>persistentgamedata1.dat</code> (dla Rebirth).<br/><br/>"
            "<b>Krok 2 (Znajdź folder konta tuzzabroware):</b><br/>"
            "Po pierwszym zalogowaniu na konto <b>tuzzabroware</b> i jednorazowym odpaleniu gry w folderze <code>Steam\\userdata\\</code> pojawi się <u>nowy folder z numerem SteamID nowego konta</u>.<br/><br/>"
            "<b>Krok 3 (Podmiana plików zapisu):</b><br/>"
            "1. <b>Zrób kopię zapasową (Backup)</b> swoich starych plików na Pulpit.<br/>"
            "2. Skopiuj plik <code>rep_persistentgamedata1.dat</code> ze starego folderu do nowego:<br/>"
            "<code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;NOWY_STEAM_ID_TUZZABROWARE&gt;\\250900\\remote\\</code><br/>"
            "3. <i>(Alternatywna ścieżka dokumentów):</i> W niektórych wersjach Isaaca zapisy znajdują się również w:<br/>"
            "<code>%USERPROFILE%\\Documents\\My Games\\Binding of Isaac Repentance\\</code> &rarr; skopiuj pliki z przedrostkiem daty na najnowszy slot.<br/><br/>"
            "<b>Krok 4 (Weryfikacja):</b> Uruchom grę na koncie <b>tuzzabroware w trybie Offline</b> — wszystkie Twoje odblokowane postacie, znaczniki i przedmioty będą aktywne!",
            b_text
        )
    ]
]
t_isaac = Table(isaac_steps_data, colWidths=[539])
t_isaac.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#0284c7")),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_isaac)
story.append(Spacer(1, 5))

# TABELA ZGODNOŚCI I TYPY GIER
story.append(Paragraph("<a name='sec_types'/><b>Typy gier na Steam a możliwość przeniesienia zapisu (Zgodność)</b>", h1_style))

types_data = [
    [
        Paragraph("<b>TYP GRY</b>", ParagraphStyle("TH1", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a"))),
        Paragraph("<b>GDZIE SĄ SAVE'Y?</b>", ParagraphStyle("TH2", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a"))),
        Paragraph("<b>CZY DA SIĘ PRZENIEŚĆ? / JAK TO ZROBIĆ?</b>", ParagraphStyle("TH3", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a")))
    ],
    [
        Paragraph("<b>[Typ 1: Automatyczny]</b><br/><b>Zapisy Globalne</b><br/><i>(Wiedźmin 3, Cyberpunk 2077, Elden Ring, Baldur's Gate 3)</i>", b_text),
        Paragraph("<code>%LOCALAPPDATA%</code><br/><code>%USERPROFILE%\\Saved Games</code><br/><code>Dokumenty\\My Games</code>", b_text),
        Paragraph("<b>100% AUTOMATYCZNIE (ZERO PRACY):</b> Gra czyta ten sam folder Windowsa bez względu na konto Steam. Po zalogowaniu na <b>tuzzabroware</b> Twój save załaduje się sam!", b_text)
    ],
    [
        Paragraph("<b>[Typ 2: Kopiowanie]</b><br/><b>Zapisy w userdata</b><br/><i>(The Binding of Isaac, Hollow Knight, Dark Souls 3, Celeste)</i>", b_text),
        Paragraph("<code>Steam\\userdata\\&lt;SteamID&gt;\\&lt;AppID&gt;\\remote\\</code>", b_text),
        Paragraph("<b>BARDZO ŁATWE (KOPIOWANIE):</b> Wystarczy przekopiować pliki zapisu ze starego folderu <code>userdata/&lt;Stary_ID&gt;</code> do <code>userdata/&lt;Nowy_ID&gt;</code> (tak jak w instrukcji Isaaca wyżej).", b_text)
    ],
    [
        Paragraph("<b>[Typ 3: Szyfrowany]</b><br/><b>Zapisy z kluczem ID</b><br/><i>(Monster Hunter: World, gry Capcom / Ubisoft / EA)</i>", b_text),
        Paragraph("Szyfrowany plik powiązany ze stałym numerem SteamID64 konta", b_text),
        Paragraph("<b>WYMAGA PROGRAMU ZEWNĘTRZNEGO:</b> Save ma zabezpieczenie kryptograficzne. Przeniesienie wymaga użycia darmowego narzędzia (np. <i>Save Transfer Tool</i> z NexusMods / GitHub) lub edytora hex.", b_text)
    ]
]
t_types = Table(types_data, colWidths=[155, 140, 244])
t_types.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f0fdf4")),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor("#fefce8")),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#fef2f2")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 4),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(t_types)
story.append(Spacer(1, 4))

# KIEDY NIE DA SIĘ PRZENIEŚĆ + BŁĘDY
story.append(Paragraph("Kiedy NIE DA SIĘ przenieść save'a oraz najczęstsze błędy:", h2_sec))
issues_data = [
    [
        Paragraph(
            "• <b>Kiedy się nie da:</b> W grach typu <b>Always-Online / Gry sieciowe</b> (np. <i>Destiny 2, Diablo 4, Path of Exile, MMO, gry z kontem Paradox/Ubisoft</i>), gdzie postęp jest zapisywany wyłącznie na serwerach dewelopera, a nie na Twoim dysku.<br/>"
            "• <b>Błąd nr 1 (Brak wyłączenia Steam Cloud):</b> Jeśli nie wyłączysz chmury przed przeniesieniem, Steam Cloud po uruchomieniu nadpisze Twój przekopiowany plik pustym stanem ze swoich serwerów!<br/>"
            "• <b>ZŁOTA ZASADA: ZAWSZE zrób kopię zapasową (Backup)</b> swojego starego save'a na Pulpit przed jakimkolwiek kopiowaniem!",
            b_alert
        )
    ]
]
t_issues = Table(issues_data, colWidths=[539])
t_issues.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff1f2")),
    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#f43f5e")),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_issues)

doc.build(story, canvasmaker=WhiteNumberedCanvas)
print(f"SUCCESS: 3-Page White PDF generated at {pdf_path}")
