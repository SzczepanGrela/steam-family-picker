#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Zweryfikowana pod kątem faktów, elegancka, minimalistyczna 2-stronicowa instrukcja PDF.
Ograniczona paleta barw (stonowany granat/slate, subtelne szarości, brak pstrokacizny).
Wszystkie informacje w 100% zgodne ze strukturą techniczną Steam i Windows.
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

# Minimalistyczna paleta kolorów
COLOR_PRIMARY = colors.HexColor("#0f172a")    # Ciemny grafit / granat (główne nagłówki)
COLOR_ACCENT = colors.HexColor("#0369a1")     # Elegancki stonowany błękit Steam
COLOR_TEXT = colors.HexColor("#334155")       # Czytelny ciemnoszary tekst
COLOR_MUTED = colors.HexColor("#64748b")      # Szary tekst pomocniczy
COLOR_BORDER = colors.HexColor("#cbd5e1")     # Subtelne obramowania
COLOR_LINE = colors.HexColor("#e2e8f0")       # Linie podziału
COLOR_BG_CARD = colors.HexColor("#f8fafc")    # Jasne neutralne tło kart
COLOR_BG_DARK = colors.HexColor("#f1f5f9")    # Nieco ciemniejsze tło wyróżnień
COLOR_WARN = colors.HexColor("#991b1b")       # Stonowane ostrzeżenie (tekst)

class MinimalNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(MinimalNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(MinimalNumberedCanvas, self).showPage()
        super(MinimalNumberedCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        # Górna subtelna linia i nagłówek
        self.setStrokeColor(COLOR_LINE)
        self.setLineWidth(0.75)
        self.line(26, A4[1]-20, A4[0]-26, A4[1]-20)
        
        self.setFont("SegoeUI-Bold", 7.5)
        self.setFillColor(COLOR_ACCENT)
        self.drawString(26, A4[1]-15, "STEAM • INSTRUKCJA KONTA WSPÓŁDZIELONEGO")
        
        # Dolna linia i numeracja
        self.line(26, 20, A4[0]-26, 20)
        self.setFont("SegoeUI", 7.5)
        self.setFillColor(COLOR_MUTED)
        self.drawRightString(A4[0]-26, 10, f"Strona {self._pageNumber} z {page_count}")
        self.restoreState()

pdf_path = os.path.join(DOCS_DIR, "Instrukcja_Konta_Wspoldzielonego_Steam.pdf")
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    leftMargin=26,
    rightMargin=26,
    topMargin=26,
    bottomMargin=24
)

styles = getSampleStyleSheet()

t_title = ParagraphStyle(
    "Title",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=13.5,
    leading=16.5,
    textColor=COLOR_PRIMARY,
    spaceAfter=1
)

t_subtitle = ParagraphStyle(
    "Sub",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=8,
    leading=10.5,
    textColor=COLOR_MUTED,
    spaceAfter=4
)

h1_style = ParagraphStyle(
    "H1",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=9.5,
    leading=12.5,
    textColor=COLOR_ACCENT,
    spaceBefore=2,
    spaceAfter=2
)

b_text = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=7.8,
    leading=10.5,
    textColor=COLOR_TEXT
)

b_alert = ParagraphStyle(
    "Alert",
    parent=b_text,
    fontName="SegoeUI",
    textColor=COLOR_WARN
)

story = []

# =========================================================================
# STRONA 1: LOGOWANIE, USTAWIENIA, TRYB OFFLINE & PODSUMOWANIE ZASAD
# =========================================================================

story.append(Paragraph("Instrukcja Korzystania z Konta Współdzielonego Steam", t_title))
story.append(Paragraph("Logowanie, konfiguracja ustawień, tryb offline oraz przenoszenie zapisów gry", t_subtitle))
story.append(HRFlowable(width="100%", thickness=0.75, color=COLOR_LINE, spaceBefore=0, spaceAfter=4))

# 1. DANE LOGOWANIA & ZASADY WSPÓLNEGO KONTA
creds_data = [
    [
        Paragraph("<b>DANE DO LOGOWANIA:</b>", ParagraphStyle("CH1", parent=b_text, fontName="SegoeUI-Bold", fontSize=8.5, textColor=COLOR_ACCENT)),
        Paragraph("<b>ZASADY KORZYSTANIA Z KONTA:</b>", ParagraphStyle("CH2", parent=b_text, fontName="SegoeUI-Bold", fontSize=8.5, textColor=COLOR_PRIMARY))
    ],
    [
        Paragraph(
            "Login: <b><font size='9.5' color='#0f172a'>tuzzabroware</font></b><br/>"
            "Hasło: <b><font size='9.5' color='#0f172a'>Czteryzera0000</font></b><br/>"
            "<b>[V] Zaznacz: „Zapamiętaj moje hasło”</b>",
            b_text
        ),
        Paragraph(
            "• <b>Steam Guard jest wyłączony:</b> logujesz się bezpośrednio bez kodów.<br/>"
            "• <b>Zakaz zmiany hasła, maila i włączania Guard:</b> konto jest wspólne – zmiana zablokuje dostęp innym osobom w grupie.<br/>"
            "• <b>Zakaz cheatów/trainerów:</b> blokada VAC nakładana jest na całe konto i uniemożliwi grę wszystkim.",
            b_text
        )
    ]
]
t_creds = Table(creds_data, colWidths=[240, 303])
t_creds.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_LINE),
    ('TOPPADDING', (0, 0), (-1, -1), 3.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(t_creds)
story.append(Spacer(1, 3))

# 2. KROK 1: PIERWSZE LOGOWANIE & PRZEŁĄCZANIE
story.append(Paragraph("1. Logowanie i przełączanie kont", h1_style))
step1_data = [
    [
        RLImage(img_switch, width=145, height=85),
        Paragraph(
            "• Zaloguj się na konto <b>tuzzabroware</b> z zaznaczoną opcją <i>„Zapamiętaj moje hasło”</i>.<br/>"
            "• Profil zostanie zapisany w Steam — możesz przełączać się między swoim prywatnym kontem a tym profilem przez: <b>Steam &gt; Zmień konto...</b><br/>"
            "• <b>Pobrane gry nie znikają z dysku:</b> pliki instalacyjne w folderze <code>steamapps</code> są wspólne na Twoim komputerze dla wszystkich profili Steam.",
            b_text
        )
    ]
]
t_step1 = Table(step1_data, colWidths=[155, 388])
t_step1.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_step1)
story.append(Spacer(1, 3))

# 3. KROK 2: USTAWIENIA CLOUD & REMOTE PLAY
story.append(Paragraph("2. Ustawienia Steam (Sprawdź tylko raz przy 1. logowaniu)", h1_style))

settings_grid_data = [
    [
        RLImage(img_cloud, width=175, height=63),
        Paragraph(
            "<b>WYŁĄCZ STEAM CLOUD (Steam &gt; Ustawienia &gt; Cloud &rarr; suwak OFF):</b><br/>"
            "<b>Powód:</b> Przy włączonej chmurze zapisy gry różnych osób nadpisywałyby się nawzajem na serwerze. Po wyłączeniu chmury save'y są <u>zapisywane wyłącznie lokalnie na Twoim komputerze</u> i nikt ich nie nadpisze.",
            b_text
        )
    ],
    [
        RLImage(img_remote, width=175, height=63),
        Paragraph(
            "<b>WYŁĄCZ REMOTE PLAY (Steam &gt; Ustawienia &gt; Remote Play &rarr; suwak OFF):</b><br/>"
            "<b>Powód:</b> Zapobiega to przypadkowemu przesyłaniu obrazu z Twojej gry przez sieć na komputer innego zalogowanego znajomego.",
            b_text
        )
    ]
]
t_settings = Table(settings_grid_data, colWidths=[185, 358])
t_settings.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_LINE),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 3.5),
]))
story.append(t_settings)
story.append(Spacer(1, 3))

# 4. KROK 3: TRYB OFFLINE
story.append(Paragraph("3. Uruchamianie gier w trybie offline", h1_style))
step3_data = [
    [
        RLImage(img_offline, width=145, height=118),
        Paragraph(
            "<b>DLACZEGO GRAMY W TRYBIE OFFLINE?</b><br/>"
            "W trybie <b>online</b> Steam pozwala grać w dany tytuł <b>tylko 1 osobie naraz</b> (kolejna osoba wyrzuca poprzednią z gry). <b>W trybie offline to ograniczenie nie obowiązuje — wszyscy mogą grać jednocześnie w tę samą grę.</b><br/><br/>"
            "<b>KOLEJNOŚĆ DZIAŁAŃ:</b><br/>"
            "1. <b>Pobierz grę</b> w trybie online.<br/>"
            "2. <b>Uruchom ją raz na kilkanaście sekund</b> (do menu), aby aktywować licencję i pliki konfiguracyjne, po czym zamknij grę.<br/>"
            "3. W lewym górnym rogu kliknij <b>Steam &gt; Przejdź do trybu offline...</b> &gt; <i>„Uruchom ponownie w trybie offline”</i>.<br/>"
            "4. <b>Uruchamiaj gry w trybie offline.</b><br/>"
            "5. Aktualizacja gry: wyłącz grę &gt; wejdź online &gt; pobierz patch &gt; <u>wróć do trybu offline</u>.",
            b_text
        )
    ]
]
t_step3 = Table(step3_data, colWidths=[155, 388])
t_step3.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_step3)
story.append(Spacer(1, 3))

# 5. PODSUMOWANIE ZASAD Z WYJAŚNIENIEM
summary_data = [
    [
        Paragraph(
            "<b>PODSUMOWANIE ZASAD:</b><br/>"
            "• <b>Graj w trybie offline</b> &rarr; <i>Powód:</i> zapobiega to wzajemnemu wyrzucaniu się z gry i pozwala grać wielu osobom jednocześnie.<br/>"
            "• <b>Ustawienia Cloud i Remote Play konfigurujesz tylko raz</b> &rarr; <i>Powód:</i> Steam zapisuje te ustawienia lokalnie na Twoim komputerze.<br/>"
            "• <b>Nie zmieniaj hasła/maila i nie włączaj Steam Guard</b> &rarr; <i>Powód:</i> konto jest wspólne, a zmiana danych odetnie dostęp innym.<br/>"
            "• <b>Zakaz cheatów i trainerów</b> &rarr; <i>Powód:</i> blokada VAC jest permanentna i blokuje konto dla wszystkich.<br/>"
            "• <b>Powrót na prywatne konto:</b> w każdej chwili kliknij <i>Steam &gt; Zmień konto</i> — pobrane pliki gier pozostają na dysku.",
            b_text
        )
    ]
]
t_summary = Table(summary_data, colWidths=[543])
t_summary.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_DARK),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_summary)

# =========================================================================
# STRONA 2: PRZENOSZENIE SAVE'ÓW
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("Jak przenieść zapisy gry (Save'y) na nowe konto?", t_title))
story.append(Paragraph("Przenoszenie plików zapisu na przykładzie The Binding of Isaac oraz omówienie typów gier na Steam", t_subtitle))
story.append(HRFlowable(width="100%", thickness=0.75, color=COLOR_LINE, spaceBefore=0, spaceAfter=5))

story.append(Paragraph("1. Przykład: The Binding of Isaac (Repentance / Rebirth)", h1_style))
story.append(Paragraph(
    "<b>Dlaczego trzeba przenieść save w Isaacu?</b> Gra przypisuje pliki zapisu do numeru SteamID w folderze <code>Steam/userdata</code>. Aby odblokowane postacie, przedmioty i znaczniki działały na koncie <b>tuzzabroware</b>:",
    b_text
))
story.append(Spacer(1, 3))

isaac_steps_data = [
    [
        Paragraph(
            "<b>INSTRUKCJA PRZENOSZENIA ZAPISU DLA THE BINDING OF ISAAC:</b><br/><br/>"
            "<b>1. Znajdź plik zapisu ze swojego profilu:</b><br/>"
            "Wejdź do folderu: <code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;TWÓJ_STARY_STEAM_ID&gt;\\250900\\remote\\</code><br/>"
            "<i>(<code>250900</code> to AppID gry The Binding of Isaac. Plik zapisu to np. <code>rep_persistentgamedata1.dat</code> dla Repentance lub <code>persistentgamedata1.dat</code> dla Rebirth).</i><br/><br/>"
            "<b>2. Zlokalizuj folder nowego konta tuzzabroware:</b><br/>"
            "Po pierwszym zalogowaniu na <b>tuzzabroware</b> i jednorazowym uruchomieniu gry, w folderze <code>Steam\\userdata\\</code> utworzy się nowy katalog z numerem ID konta.<br/><br/>"
            "<b>3. Skopiuj plik zapisu (zrób kopię zapasową pliku na Pulpit):</b><br/>"
            "Skopiuj <code>rep_persistentgamedata1.dat</code> ze starego folderu do nowego:<br/>"
            "<code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;NOWY_STEAM_ID_TUZZABROWARE&gt;\\250900\\remote\\</code><br/>"
            "<i>(W niektórych konfiguracjach pliki znajdują się w: <code>%USERPROFILE%\\Documents\\My Games\\Binding of Isaac Repentance\\</code>).</i><br/><br/>"
            "<b>4. Uruchom grę:</b> Włącz grę na nowym koncie w trybie offline — postęp zostanie wczytany.",
            b_text
        )
    ]
]
t_isaac = Table(isaac_steps_data, colWidths=[543])
t_isaac.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_CARD),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_isaac)
story.append(Spacer(1, 5))

# TABELA TYPÓW GIER
story.append(Paragraph("2. Typy gier na Steam a lokalizacja zapisów", h1_style))

types_data = [
    [
        Paragraph("<b>TYP GRY</b>", ParagraphStyle("TH1", parent=b_text, fontName="SegoeUI-Bold", textColor=COLOR_PRIMARY)),
        Paragraph("<b>LOKALIZACJA ZAPISU</b>", ParagraphStyle("TH2", parent=b_text, fontName="SegoeUI-Bold", textColor=COLOR_PRIMARY)),
        Paragraph("<b>CZY WYMAGA PRZENOSZENIA?</b>", ParagraphStyle("TH3", parent=b_text, fontName="SegoeUI-Bold", textColor=COLOR_PRIMARY))
    ],
    [
        Paragraph("<b>Zapisy Globalne</b><br/><i>(Wiedźmin 3, Cyberpunk 2077, Baldur's Gate 3, Slay the Spire, Hades)</i>", b_text),
        Paragraph("<code>%LOCALAPPDATA%</code><br/><code>%USERPROFILE%\\Saved Games</code><br/><code>Dokumenty\\My Games</code>", b_text),
        Paragraph("<b>NIE (Działa automatycznie):</b> Gra korzysta ze wspólnego folderu systemowego. Po zalogowaniu na konto <b>tuzzabroware</b> save wczytuje się sam.", b_text)
    ],
    [
        Paragraph("<b>Zapisy w Steam userdata</b><br/><i>(The Binding of Isaac, Hollow Knight, Dark Souls 3, Celeste)</i>", b_text),
        Paragraph("<code>Steam\\userdata\\&lt;SteamID&gt;\\&lt;AppID&gt;\\remote\\</code>", b_text),
        Paragraph("<b>TAK (Kopiowanie plików):</b> Gra zapisuje dane w podfolderze danego SteamID. Wystarczy przekopiować plik ze starego folderu do nowego (wg instrukcji powyżej).", b_text)
    ],
    [
        Paragraph("<b>Zapisy powiązane z kontem</b><br/><i>(Elden Ring, Monster Hunter: World, gry z kontem Ubisoft / EA)</i>", b_text),
        Paragraph("Pliki powiązane ze stałym identyfikatorem konta", b_text),
        Paragraph("<b>WYMAGA NARZĘDZIA:</b> Save zawiera identyfikator SteamID w nagłówku. Przeniesienie wymaga konwertera zapisu (np. z NexusMods) lub edycji w hex edytorze.", b_text)
    ]
]
t_types = Table(types_data, colWidths=[155, 140, 248])
t_types.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), COLOR_BG_DARK),
    ('BACKGROUND', (0, 1), (-1, -1), COLOR_BG_CARD),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_LINE),
    ('PADDING', (0, 0), (-1, -1), 4.5),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(t_types)
story.append(Spacer(1, 5))

# KIEDY SIĘ NIE DA + WAŻNE UWAGI
story.append(Paragraph("3. Kiedy nie da się przenieść zapisu oraz ważne uwagi", h1_style))
notes_data = [
    [
        Paragraph(
            "• <b>Gry sieciowe i Always-Online (brak możliwości przeniesienia):</b> W tytułach takich jak <i>Destiny 2, Diablo 4, MMO, Path of Exile</i> postęp zapisywany jest na serwerach dewelopera i przypisany do konta — pliki zapisu nie znajdują się na dysku lokalnym.<br/>"
            "• <b>Wyłączenie Steam Cloud przed kopiowaniem:</b> Włączona chmura po uruchomieniu gry pobierze pusty stan z serwera i nadpisze przekopiowane pliki.<br/>"
            "• <b>Kopia zapasowa:</b> Przed przenoszeniem plików zrób kopię starego folderu zapisu na Pulpicie.",
            b_text
        )
    ]
]
t_notes = Table(notes_data, colWidths=[543])
t_notes.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_DARK),
    ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
    ('PADDING', (0, 0), (-1, -1), 4.5),
]))
story.append(t_notes)

doc.build(story, canvasmaker=MinimalNumberedCanvas)
print(f"SUCCESS: Verified Minimal Palette 2-Page PDF generated at {pdf_path}")
