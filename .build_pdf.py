#!/usr/bin/env python3
"""Génère les versions PDF imprimables des documents HTML du TP.

Le rendu est confié à Chrome en mode headless. Avant impression, les
bibliothèques distantes (Tailwind, MathJax, polices Google) sont remplacées
par les copies locales du kit hors ligne : le PDF est alors reproductible
d'une machine à l'autre et ne dépend d'aucune connexion réseau. La pagination
« page / total » est inscrite ensuite, une fois le nombre de pages connu.

Prérequis : Chrome (ou Edge) et PyMuPDF (``pip install pymupdf``).

Usage :
    python .build_pdf.py                          # tous les documents
    python .build_pdf.py tp_couches_minces_fr.html  # un seul
"""

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pymupdf

RACINE = Path(__file__).resolve().parent
VENDOR = "outputs/tp_couches_minces_hors_ligne/vendor"

# Pied de page : discret, dans la marge basse laissée par @page.
POLICE_PIED = "helv"
TAILLE_PIED = 8.5
TAILLE_URL = 7.5
COULEUR_PIED = (0.42, 0.45, 0.50)
COULEUR_URL = (0.09, 0.40, 0.75)
MARGE_PIED = 26  # points depuis le bas de la page
MARGE_GAUCHE = 40  # points, alignée sur la marge de @page

# Le PDF ne donne accès ni au simulateur ni aux corrections d'ancres : chaque
# page rappelle donc l'adresse du portail, où le TP s'utilise réellement.
URL_PORTAIL = "https://tpcouchesminces.vercel.app"
MENTION_PORTAIL = {
    "fr": f"Version en ligne et simulateur interactif : {URL_PORTAIL}",
    "en": f"Online version and interactive simulator: {URL_PORTAIL}",
}

# document source -> langue du pied de page
DOCUMENTS = {
    "tp_couches_minces_fr.html": "fr",
    "tp_couches_minces_en.html": "en",
    "theorie en francais.html": "fr",
    "theorie en anglais.html": "en",
}

CHROME_CANDIDATS = [
    os.environ.get("CHROME"),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

# Feuille d'impression : fonds conservés, blocs pédagogiques non coupés,
# barre de navigation dégelée pour qu'elle ne se répète pas à chaque page.
CSS_IMPRESSION = """
    <style id="feuille-impression">
    @page { size: A4; margin: 16mm 14mm; }
    @media print {
        html, body { background: #fff !important; }
        *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .sticky { position: static !important; }
        /* Sans défilement horizontal, une ligne de code longue serait coupée. */
        pre, pre code { white-space: pre-wrap; overflow-wrap: anywhere; }
        h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
        .qbox, figure, table, .equation, .encadre, .theoreme,
        mjx-container[display="true"] {
            break-inside: avoid; page-break-inside: avoid;
        }
        a { text-decoration: none; }
    }
    </style>
"""

# (motif, remplacement) appliqués au source avant impression.
SUBSTITUTIONS = [
    # Tailwind JIT -> feuille compilée + polices locales
    (
        r'<script src="https://cdn\.tailwindcss\.com"></script>',
        f'<link rel="stylesheet" href="{VENDOR}/css/tailwind.min.css">\n'
        f'    <link rel="stylesheet" href="{VENDOR}/css/offline-fonts.css">',
    ),
    # MathJax (les deux distributions utilisées) -> paquet local
    (
        r"https://cdn\.jsdelivr\.net/npm/mathjax@3/es5/tex-(mml-)?chtml\.js",
        f"{VENDOR}/mathjax/tex-mml-chtml.js",
    ),
    # Google Fonts -> polices locales
    (
        r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">',
        f'<link rel="stylesheet" href="{VENDOR}/css/offline-fonts.css">',
    ),
    (
        r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>',
        "",
    ),
    (r"@import url\('https://fonts\.googleapis\.com/[^']*'\);", ""),
    # Un <details> replié n'imprime pas son contenu : on déplie tout.
    (r"<details(?![^>]*\bopen\b)", "<details open"),
]


def trouver_chrome():
    for chemin in CHROME_CANDIDATS:
        if chemin and Path(chemin).is_file():
            return chemin
    sortie = shutil.which("chrome") or shutil.which("msedge")
    if sortie:
        return sortie
    raise SystemExit("Chrome ou Edge introuvable. Définissez la variable CHROME.")


def piedbanniere(page, mention: str) -> None:
    """Inscrit à gauche l'adresse du portail, rendue cliquable."""
    base = page.rect.height - MARGE_PIED
    page.insert_text(
        (MARGE_GAUCHE, base),
        mention,
        fontname=POLICE_PIED,
        fontsize=TAILLE_URL,
        color=COULEUR_URL,
    )
    largeur = pymupdf.get_text_length(
        mention, fontname=POLICE_PIED, fontsize=TAILLE_URL
    )
    page.insert_link(
        {
            "kind": pymupdf.LINK_URI,
            "from": pymupdf.Rect(
                MARGE_GAUCHE, base - TAILLE_URL, MARGE_GAUCHE + largeur, base + 2
            ),
            "uri": URL_PORTAIL,
        }
    )


def paginer(pdf: Path, langue: str) -> int:
    """Compose le pied de chaque page et renvoie le nombre total de pages.

    Chrome ne sait pas produire ce pied sans y accoler l'URL du fichier
    source ; on l'ajoute donc après coup, quand le total est connu.
    """
    mention = MENTION_PORTAIL[langue]
    document = pymupdf.open(pdf)
    total = document.page_count
    for numero in range(1, total + 1):
        page = document[numero - 1]
        piedbanniere(page, mention)
        # Pagination alignée à droite : le rappel du portail occupe la gauche.
        libelle = f"{numero} / {total}"
        largeur = pymupdf.get_text_length(
            libelle, fontname=POLICE_PIED, fontsize=TAILLE_PIED
        )
        page.insert_text(
            (page.rect.width - MARGE_GAUCHE - largeur, page.rect.height - MARGE_PIED),
            libelle,
            fontname=POLICE_PIED,
            fontsize=TAILLE_PIED,
            color=COULEUR_PIED,
        )
    # Réécriture en place : sur ce support, un renommage-remplacement est
    # refusé par le système de fichiers (WinError 5).
    donnees = document.tobytes(garbage=3, deflate=True)
    document.close()
    pdf.write_bytes(donnees)
    return total


def construire(nom: str, chrome: str) -> None:
    source = RACINE / nom
    if not source.is_file():
        print(f"  ignoré (absent) : {nom}")
        return

    html = source.read_text(encoding="utf-8")
    for motif, remplacement in SUBSTITUTIONS:
        html = re.sub(motif, remplacement, html)
    html = html.replace("</head>", CSS_IMPRESSION + "</head>", 1)

    # Le temporaire reste dans le répertoire du source : les chemins relatifs
    # vers le kit hors ligne doivent continuer à se résoudre.
    temporaire = source.with_suffix(".impression.html")
    temporaire.write_text(html, encoding="utf-8")
    pdf = source.with_suffix(".pdf")

    try:
        subprocess.run(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--hide-scrollbars",
                "--no-pdf-header-footer",
                "--run-all-compositor-stages-before-draw",
                "--virtual-time-budget=45000",
                f"--print-to-pdf={pdf}",
                temporaire.as_uri(),
            ],
            check=True,
            capture_output=True,
            timeout=300,
        )
    finally:
        temporaire.unlink(missing_ok=True)

    total = paginer(pdf, DOCUMENTS.get(nom, "fr"))
    poids = pdf.stat().st_size / 1024
    print(f"  {pdf.name} : {total} pages, {poids:.0f} Ko")


def main() -> int:
    chrome = trouver_chrome()
    print(f"Moteur de rendu : {chrome}")
    for nom in sys.argv[1:] or DOCUMENTS:
        construire(nom, chrome)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
