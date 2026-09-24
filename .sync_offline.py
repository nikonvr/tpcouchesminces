# -*- coding: utf-8 -*-
"""Synchronise le paquet hors ligne avec les sources a jour,
en retablissant les references locales aux bibliotheques (vendor/)."""
import io, os, re, hashlib, shutil

SRC = '.'
DST = os.path.join('outputs', 'tp_couches_minces_hors_ligne')
FILES = ['simulateur_couches_minces.html', 'tp_couches_minces_fr.html', 'tp_couches_minces_en.html',
         'theorie en francais.html']

SUBS = [
    # La théorie emploie ses propres balises de polices.
    (re.compile(r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com">'), ''),
    (re.compile(r'\s*<link href="https://fonts\.googleapis\.com/css2[^>]*rel="stylesheet">'),
     '\n    <link rel="stylesheet" href="vendor/css/offline-fonts.css">'),
    (re.compile(r'<script src="https://cdn\.tailwindcss\.com"></script>'),
     '<link rel="stylesheet" href="vendor/css/tailwind.min.css">\n    <link rel="stylesheet" href="vendor/css/offline-fonts.css">'),
    (re.compile(r'<script src="https://cdn\.jsdelivr\.net/npm/chart\.js[^"]*"></script>'),
     '<script src="vendor/js/chart.umd.js"></script>'),
    (re.compile(r'<script src="https://unpkg\.com/lucide[^"]*"></script>'),
     '<script src="vendor/js/lucide.min.js"></script>'),
    (re.compile(r'<script id="MathJax-script" async src="https://cdn\.jsdelivr\.net/npm/mathjax@3[^"]*"></script>'),
     '<script id="MathJax-script" async src="vendor/mathjax/tex-mml-chtml.js"></script>'),
    (re.compile(r'<script defer src="https://cdn\.jsdelivr\.net/npm/mathjax@3/es5/tex-chtml\.js"></script>'),
     '<script defer src="vendor/mathjax/tex-mml-chtml.js"></script>'),
    (re.compile(r"\s*@import url\('https://fonts\.googleapis\.com/css2[^']*'\);"), ''),
    # Le lien « Portail du TP » des enonces vise le site en ligne ; hors ligne,
    # il doit ramener a l'accueil local du paquet.
    (re.compile(r'<a href="https://tpcouchesminces\.vercel\.app"'), '<a href="index.html"'),
    # Le texte narratif doit lui aussi refleter le paquet autonome : sans cela
    # l'enonce affirme qu'une connexion est requise, en contradiction avec
    # index.html et README_HORS_LIGNE.md du meme dossier.
    (re.compile(r'Une connexion réseau est requise pour charger les bibliothèques graphiques '
                r'\(une distribution hors ligne existe : voir votre enseignant\)\.'),
     "Toutes les bibliothèques (graphiques, icônes, polices, équations) sont incluses dans ce dossier : "
     "aucune connexion réseau n'est nécessaire."),
    (re.compile(r'Network access is required to load the graphical libraries '
                r'\(an offline distribution exists: ask your instructor\)\.'),
     'All libraries (charts, icons, fonts, equations) are bundled in this folder: '
     'no network connection is required.'),
]

for f in FILES:
    s = io.open(os.path.join(SRC, f), encoding='utf-8').read()
    for rx, rep in SUBS:
        s = rx.sub(rep, s)
    # Fins de ligne LF explicites. Sans newline='\n', Windows ecrivait des CRLF,
    # le manifeste hachait ces CRLF, puis git enregistrait des LF : le manifeste
    # publie ne correspondait plus aux fichiers publies (4 echecs sur 42 pour
    # quiconque telechargeait le paquet). .gitattributes fige ensuite ces octets.
    io.open(os.path.join(DST, f), 'w', encoding='utf-8', newline='\n').write(s)
    left = re.findall(r'https://(?:cdn|unpkg|fonts)\.[^"\')\s]+', s)
    print('%-34s synchronise | CDN residuels : %d %s' % (f, len(left), left[:2] if left else ''))

src_x = os.path.join('outputs', 'tp_couches_minces', 'squelette_excel_couches_minces.xlsx')
dst_x = os.path.join(DST, 'outputs', 'tp_couches_minces', 'squelette_excel_couches_minces.xlsx')
if os.path.exists(src_x):
    shutil.copy2(src_x, dst_x)

# Format POSIX strict, pour que `sha256sum -c SHA256SUMS.txt` fonctionne
# reellement : empreintes en minuscules, separateur '/', fins de ligne LF.
# La version precedente ecrivait des majuscules, des antislash et des CRLF :
# l'outil standard incluait le '\r' dans le nom et rendait
# « FAILED open or read » sur les 223 fichiers, rendant le manifeste inutile.
sep = chr(92)
lines = []
for root, dirs, files in os.walk(DST):
    dirs.sort(); files.sort()
    for fn in files:
        if fn == 'SHA256SUMS.txt':
            continue
        full = os.path.join(root, fn)
        rel = os.path.relpath(full, DST).replace(sep, '/')
        h = hashlib.sha256(open(full, 'rb').read()).hexdigest()
        lines.append('%s  %s' % (h, rel))
with io.open(os.path.join(DST, 'SHA256SUMS.txt'), 'w', encoding='utf-8', newline='\n') as fh:
    fh.write('\n'.join(lines) + '\n')
print('SHA256SUMS.txt regenere : %d fichiers (format POSIX, LF)' % len(lines))
