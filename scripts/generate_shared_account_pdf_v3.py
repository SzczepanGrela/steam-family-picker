#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generator zwięzłej, 2-stronicowej instrukcji PDF:
- Strona 1: Kompletny poradnik korzystania z konta (Logowanie, Ustawienia Cloud/Remote, Tryb Offline, Podsumowanie z wyjaśnieniem każdej zasady)
- Strona 2: Poradnik przenoszenia save'ów (Isaac, typy gier, wyjaśnienie przyczyn)
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

class CleanTwoPageCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(CleanTwoPageCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(CleanTwoPageCanvas, self).showPage()
        super(CleanTwoPageCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        # Górny nagłówek
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.8)
        self.line(26, A4[1]-20, A4[0]-26, A4[1]-20)
        
        self.setFont("SegoeUI-Bold", 7.5)
        self.setFillColor(colors.HexColor("#0284c7"))
        self.drawString(26, A4[1]-15, "STEAM • INSTRUKCJA KORZYSTANIA Z KONTA WSPÓŁDZIELONEGO")
        
        # Dolna linia i stopka
        self.line(26, 20, A4[0]-26, 20)
        self.setFont("SegoeUI", 7.5)
        self.setFillColor(colors.HexColor("#94a3b8"))
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
    fontSize=13,
    leading=16,
    textColor=colors.HexColor("#0f172a"),
    spaceAfter=1
)

t_subtitle = ParagraphStyle(
    "Sub",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=8,
    leading=10.5,
    textColor=colors.HexColor("#64748b"),
    spaceAfter=4
)

h1_style = ParagraphStyle(
    "H1",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=9.5,
    leading=12.5,
    textColor=colors.HexColor("#0284c7"),
    spaceBefore=2,
    spaceAfter=2
)

h2_style = ParagraphStyle(
    "H2",
    parent=styles["Normal"],
    fontName="SegoeUI-Bold",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#0f172a"),
    spaceBefore=2,
    spaceAfter=1
)

b_text = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="SegoeUI",
    fontSize=7.8,
    leading=10.5,
    textColor=colors.HexColor("#334155")
)

b_alert = ParagraphStyle(
    "Alert",
    parent=b_text,
    fontName="SegoeUI",
    textColor=colors.HexColor("#991b1b")
)

story = []

# =========================================================================
# STRONA 1: LOGOWANIE, USTAWIENIA, TRYB OFFLINE & PODSUMOWANIE Z WYJAŚNIENIAMI
# =========================================================================

story.append(Paragraph("Instrukcja Korzystania z Konta Współdzielonego Steam", t_title))
story.append(Paragraph("Szybki przewodnik: logowanie, jednorazowa konfiguracja, gra offline oraz zasady z wyjaśnieniem", t_subtitle))
story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=4))

# 1. DANE LOGOWANIA & ZASADA WSPÓLNEGO KONTA
creds_data = [
    [
        Paragraph("<b>DANE DO LOGOWANIA:</b>", ParagraphStyle("CH1", parent=b_text, fontName="SegoeUI-Bold", fontSize=8.5, textColor=colors.HexColor("#0284c7"))),
        Paragraph("<b>ZASADY DOSTĘPU (DLACZEGO TAK JEST?):</b>", ParagraphStyle("CH2", parent=b_text, fontName="SegoeUI-Bold", fontSize=8.5, textColor=colors.HexColor("#d97706")))
    ],
    [
        Paragraph(
            "Login: <b><font size='9.5' color='#0f172a'>tuzzabroware</font></b><br/>"
            "Hasło: <b><font size='9.5' color='#0f172a'>Czteryzera0000</font></b><br/>"
            "<font color='#16a34a'><b>[V] Zaznacz: „Zapamiętaj moje hasło”</b></font>",
            b_text
        ),
        Paragraph(
            "• <b>Steam Guard jest wyłączony</b>, aby każdy zalogował się od razu bez czekania na kody.<br/>"
            "• <b>Kategoryczny zakaz zmian hasła, maila i włączania Guard</b> — zmiana odetnie dostęp do gier pozostałym osobom w grupie.<br/>"
            "• <b>Zakaz cheatów/trainerów</b> — wykrycie oszustw nakłada blokadę VAC na całe konto dla wszystkich.",
            b_text
        )
    ]
]
t_creds = Table(creds_data, colWidths=[240, 303])
t_creds.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
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
            "• Zaloguj się na konto <b>tuzzabroware</b> i zaznacz <i>„Zapamiętaj moje hasło”</i>.<br/>"
            "• Profil zostanie zapisany w Steam — w każdej chwili możesz przełączać się między swoim prywatnym kontem a tym profilem klikając w lewym górnym rogu: <b>Steam &gt; Zmień konto...</b><br/>"
            "• <b>Pobrane gry nie znikają z dysku</b>, ponieważ pliki instalacyjne są współdzielone w systemie dla wszystkich profili Steam.",
            b_text
        )
    ]
]
t_step1 = Table(step1_data, colWidths=[155, 388])
t_step1.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_step1)
story.append(Spacer(1, 3))

# 3. KROK 2: USTAWIENIA CLOUD & REMOTE PLAY (SPRAWDŹ TYLKO PRZY 1. LOGOWANIU)
story.append(Paragraph("2. Sprawdź przy 1. logowaniu: Ustawienia Steam (Robisz tylko raz)", h1_style))

settings_grid_data = [
    [
        RLImage(img_cloud, width=175, height=63),
        Paragraph(
            "<b>WYŁĄCZ STEAM CLOUD (Steam &gt; Ustawienia &gt; Cloud &rarr; suwak OFF):</b><br/>"
            "<b>Dlaczego:</b> Ponieważ z konta korzysta kilka osób, włączona chmura powodowałaby, że zapisy z różnych komputerów <b>nadpisywałyby i kasowały postępy znajomych</b>. Po wyłączeniu chmury Twoje save'y są w 100% bezpieczne <u>lokalnie na Twoim dysku</u>.",
            b_text
        )
    ],
    [
        RLImage(img_remote, width=175, height=63),
        Paragraph(
            "<b>WYŁĄCZ REMOTE PLAY (Steam &gt; Ustawienia &gt; Remote Play &rarr; suwak OFF):</b><br/>"
            "<b>Dlaczego:</b> Zapobiega to przypadkowemu streamowaniu Twojego ekranu przez sieć na komputer innego zalogowanego znajomego lub próbom zdalnego sterowania.",
            b_text
        )
    ]
]
t_settings = Table(settings_grid_data, colWidths=[185, 358])
t_settings.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#fef2f2")),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f1f5f9")),
    ('BOX', (0, 0), (-1, 0), 0.8, colors.HexColor("#fca5a5")),
    ('BOX', (0, 1), (-1, 1), 0.8, colors.HexColor("#cbd5e1")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 3.5),
]))
story.append(t_settings)
story.append(Spacer(1, 3))

# 4. KROK 3: TRYB OFFLINE (JAK GRAĆ)
story.append(Paragraph("3. Jak grać: Tryb Offline (Zasada działania)", h1_style))
step3_data = [
    [
        RLImage(img_offline, width=145, height=118),
        Paragraph(
            "<b>DLACZEGO GRAMY W TRYBIE OFFLINE?</b><br/>"
            "W trybie <b>Online</b> Steam zezwala na uruchomienie gry <b>tylko 1 osobie naraz</b> (kolejna osoba natychmiast wyrzuca poprzednią z rozgrywki). <b>W trybie Offline ograniczenie znika — wszyscy mogą grać jednocześnie w tę samą grę bez żadnych przerw.</b><br/><br/>"
            "<b>INSTRUKCJA KROK PO KROKU:</b><br/>"
            "1. <b>Pobierz grę</b> będąc w trybie online.<br/>"
            "2. <b>Uruchom ją raz na 30 sekund</b> (do menu głównego), aby aktywować licencję DRM i DirectX, po czym wyłącz grę.<br/>"
            "3. W lewym górnym rogu kliknij <b>Steam &gt; Przejdź do trybu offline...</b> &gt; <i>„Uruchom ponownie w trybie offline”</i>.<br/>"
            "4. <b>Graj zawsze w trybie Offline.</b><br/>"
            "5. Gdy wyjdzie aktualizacja: wyłącz grę &gt; wejdź online &gt; zaktualizuj &gt; <u>wróć do trybu offline</u>.",
            b_text
        )
    ]
]
t_step3 = Table(step3_data, colWidths=[155, 388])
t_step3.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f0fdf4")),
    ('BOX', (0, 0), (-1, -1), 1.2, colors.HexColor("#22c55e")),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_step3)
story.append(Spacer(1, 3))

# 5. PODSUMOWANIE ZASAD Z WYJAŚNIENIEM (ZAMIAST DWÓCH TABEL)
summary_data = [
    [
        Paragraph(
            "<b>PODSUMOWANIE I NAJWAŻNIEJSZE ZASADY W PIGUŁCE:</b><br/>"
            "• <b>Zawsze graj w trybie Offline</b> &rarr; <i>Wyjaśnienie:</i> Aby nie wyrzucać znajomych z gry i móc grać w wiele osób naraz.<br/>"
            "• <b>Ustawienia Cloud i Remote Play sprawdzasz tylko raz przy 1. logowaniu</b> &rarr; <i>Wyjaśnienie:</i> Steam pamięta je na Twoim PC.<br/>"
            "• <b>Nie zmieniaj hasła/maila i nie włączaj Steam Guard</b> &rarr; <i>Wyjaśnienie:</i> Konto jest wspólne – zmiana zablokuje dostęp innym.<br/>"
            "• <b>Zero cheatów / trainerów</b> &rarr; <i>Wyjaśnienie:</i> Blokada VAC niszczy całe konto dla całej grupy.<br/>"
            "• <b>Wracanie na swoje konto:</b> W każdej chwili kliknij <i>Steam &gt; Zmień konto</i> — pobrane gry zostają na dysku.",
            b_text
        )
    ]
]
t_summary = Table(summary_data, colWidths=[543])
t_summary.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 4),
]))
story.append(t_summary)

# =========================================================================
# STRONA 2: PRZENOSZENIE SAVE'ÓW (ISAAC, TYPY GIER, WYJAŚNIENIA)
# =========================================================================
story.append(PageBreak())

story.append(Paragraph("Jak przenieść zapisy gry (Save'y) na nowe konto?", t_title))
story.append(Paragraph("Instrukcja podmiany plików na przykładzie The Binding of Isaac, podział typów gier oraz wyjaśnienia techniczne", t_subtitle))
story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#e2e8f0"), spaceBefore=0, spaceAfter=5))

story.append(Paragraph("1. Praktyczny przykład: The Binding of Isaac (Repentance / Rebirth)", h1_style))
story.append(Paragraph(
    "<b>Dlaczego trzeba przenosić save w Isaacu?</b> Gra przypisuje pliki zapisu do unikalnego numeru SteamID w folderze <code>Steam/userdata</code>. Aby Twoje odblokowane postacie, znaczniki (marks) i przedmioty działały na koncie <b>tuzzabroware</b>:",
    b_text
))
story.append(Spacer(1, 3))

isaac_steps_data = [
    [
        Paragraph(
            "<b>INSTRUKCJA KROK PO KROKU DLA THE BINDING OF ISAAC:</b><br/><br/>"
            "<b>1. Znajdź swój stary plik zapisu:</b><br/>"
            "Wejdź do folderu: <code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;TWÓJ_STARY_STEAM_ID&gt;\\250900\\remote\\</code><br/>"
            "<i>(<code>250900</code> to oficjalny AppID gry The Binding of Isaac. Szukany plik to np. <code>rep_persistentgamedata1.dat</code> dla Repentance lub <code>persistentgamedata1.dat</code> dla Rebirth).</i><br/><br/>"
            "<b>2. Zlokalizuj folder nowego konta tuzzabroware:</b><br/>"
            "Po pierwszym zalogowaniu na konto <b>tuzzabroware</b> i jednorazowym uruchomieniu gry, w <code>Steam\\userdata\\</code> utworzy się nowy folder z numerem ID nowego konta.<br/><br/>"
            "<b>3. Przekopiuj plik zapisu (Zrób najpierw kopię zapasową na Pulpit!):</b><br/>"
            "Skopiuj plik <code>rep_persistentgamedata1.dat</code> ze starego folderu do nowego:<br/>"
            "<code>C:\\Program Files (x86)\\Steam\\userdata\\&lt;NOWY_STEAM_ID_TUZZABROWARE&gt;\\250900\\remote\\</code><br/>"
            "<i>(W niektórych wersjach alternatywna ścieżka to: <code>%USERPROFILE%\\Documents\\My Games\\Binding of Isaac Repentance\\</code>).</i><br/><br/>"
            "<b>4. Uruchom grę:</b> Odpal grę na nowym koncie w trybie offline — Twój pełny postęp zostanie natychmiast załadowany.",
            b_text
        )
    ]
]
t_isaac = Table(isaac_steps_data, colWidths=[543])
t_isaac.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
    ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#0284c7")),
    ('PADDING', (0, 0), (-1, -1), 5),
]))
story.append(t_isaac)
story.append(Spacer(1, 5))

# TABELA TYPÓW GIER
story.append(Paragraph("2. Typy gier na Steam a kompatybilność zapisów (Gdzie są save'y i dlaczego?)", h1_style))

types_data = [
    [
        Paragraph("<b>TYP GRY</b>", ParagraphStyle("TH1", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a"))),
        Paragraph("<b>LOKALIZACJA ZAPISU</b>", ParagraphStyle("TH2", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a"))),
        Paragraph("<b>CZY TRZEBA PRZENOSIĆ? (WYJAŚNIENIE)</b>", ParagraphStyle("TH3", parent=b_text, fontName="SegoeUI-Bold", textColor=colors.HexColor("#0f172a")))
    ],
    [
        Paragraph("<b>Zapisy Globalne</b><br/><i>(Wiedźmin 3, Cyberpunk 2077, Elden Ring, Baldur's Gate 3)</i>", b_text),
        Paragraph("<code>%LOCALAPPDATA%</code><br/><code>%USERPROFILE%\\Saved Games</code><br/><code>Dokumenty\\My Games</code>", b_text),
        Paragraph("<b>NIE (100% Automatycznie):</b> Gra korzysta ze wspólnego folderu systemowego w Windowsie. Po zalogowaniu na konto <b>tuzzabroware</b> Twój save wczyta się sam bez robienia czegokolwiek.", b_text)
    ],
    [
        Paragraph("<b>Zapisy w Steam userdata</b><br/><i>(The Binding of Isaac, Hollow Knight, Dark Souls 3, Celeste)</i>", b_text),
        Paragraph("<code>Steam\\userdata\\&lt;SteamID&gt;\\&lt;AppID&gt;\\remote\\</code>", b_text),
        Paragraph("<b>TAK (Proste kopiowanie):</b> Gra dzieli foldery wg numeru SteamID. Wystarczy przekopiować pliki ze starego folderu do nowego (zgodnie z instrukcją dla Isaaca powyżej).", b_text)
    ],
    [
        Paragraph("<b>Zapisy z szyfrowaniem ID</b><br/><i>(Monster Hunter: World, gry z kontem Ubisoft / EA)</i>", b_text),
        Paragraph("Szyfrowane pliki powiązane ze stałym kluczem SteamID64", b_text),
        Paragraph("<b>WYMAGA PROGRAMU ZEWNĘTRZNEGO:</b> Save ma kryptograficzne zabezpieczenie konta. Wymaga użycia darmowego konwertera zapisu (np. <i>Save Transfer Tool</i> z NexusMods / GitHub).", b_text)
    ]
]
t_types = Table(types_data, colWidths=[155, 140, 248])
t_types.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f0fdf4")),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor("#fefce8")),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#fef2f2")),
    ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ('PADDING', (0, 0), (-1, -1), 4.5),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(t_types)
story.append(Spacer(1, 5))

# KIEDY SIĘ NIE DA + WAŻNE UWAGI Z WYJAŚNIENIEM
story.append(Paragraph("3. Kiedy NIE DA SIĘ przenieść zapisu oraz ważne ostrzeżenia", h1_style))
notes_data = [
    [
        Paragraph(
            "• <b>Gry sieciowe i Always-Online (Brak możliwości przeniesienia):</b> W grach typu <i>Destiny 2, Diablo 4, MMO, Path of Exile</i> postęp zapisywany jest wyłącznie na serwerach zewnętrznych dewelopera przypisanych do pierwotnego konta — pliki zapisu nie istnieją na dysku Twojego PC.<br/>"
            "• <b>Dlaczego wyłączony Steam Cloud jest kluczowy przed przenoszeniem?</b> Jeśli nie wyłączysz chmury (Krok 2), Steam Cloud po uruchomieniu gry pobierze pusty stan z serwera i bezpowrotnie nadpisze Twój przekopiowany save!<br/>"
            "• <b>Złota zasada bezpieczeństwa:</b> ZAWSZE przed jakimkolwiek kopiowaniem stwórz kopię zapasową (backup) starego folderu zapisu na Pulpicie.",
            ParagraphStyle("NAlert", parent=b_text, textColor=colors.HexColor("#991b1b"))
        )
    ]
]
t_notes = Table(notes_data, colWidths=[543])
t_notes.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff1f2")),
    ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#f43f5e")),
    ('PADDING', (0, 0), (-1, -1), 4.5),
]))
story.append(t_notes)

doc.build(story, canvasmaker=CleanTwoPageCanvas)
print(f"SUCCESS: Perfect 2-Page PDF generated at {pdf_path}")
