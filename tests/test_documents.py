# -*- coding: utf-8 -*-
"""Tests des documents : simulateur, énoncés FR/EN, cours, paquet hors ligne.

Ce fichier vérifie ce que le code JavaScript ne peut pas voir : la cohérence
entre les quatre documents, l'intégrité du paquet autonome, la validité du
balisage et l'absence de français résiduel dans la version anglaise.

Lancement :  python tests/test_documents.py
"""

import hashlib
import html as htmllib
import io
import os
import re
import subprocess
import sys
import unicodedata
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SIMULATEUR = "simulateur_couches_minces.html"
ENONCE_FR = "tp_couches_minces_fr.html"
ENONCE_EN = "tp_couches_minces_en.html"
COURS = "theorie en francais.html"
HORS_LIGNE = os.path.join("outputs", "tp_couches_minces_hors_ligne")

FORMULE_FRESNEL = "H L 2H L H L H L 2H L H L H L 2H L H L"

_echecs = []
_total = [0]


def titre(nom):
    print("\n" + "=" * 78)
    print(nom)
    print("=" * 78)


def groupe(nom):
    print("\n  " + nom)


def verifie(libelle, condition, detail=""):
    _total[0] += 1
    if condition:
        print(f"    OK    {libelle}")
    else:
        _echecs.append((libelle, detail))
        print(f"    ECHEC {libelle}" + (f"  — {detail}" if detail else ""))
    return bool(condition)


def lit(chemin):
    with io.open(os.path.join(RACINE, chemin), encoding="utf-8") as fh:
        return fh.read()


def sans_code(html):
    """Retire scripts, styles et commentaires : ne reste que le contenu balisé."""
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    return html


def texte_visible(html):
    """Prose réellement lue par l'étudiant, attributs et balises retirés."""
    corps = sans_code(html)
    # Une vraie balise commence par une lettre, « / » ou « ! » : « $< 150$ »
    # est du texte, et le prendre pour une balise avalerait la prose qui suit.
    corps = re.sub(r"<(?=[A-Za-z/!])[^>]*>", " ", corps)
    return re.sub(r"\s+", " ", htmllib.unescape(corps))


DOCS = {}


# ===========================================================================
titre("TESTS DES DOCUMENTS — énoncés, simulateur, cours, paquet hors ligne")

groupe("1. Présence et lisibilité des fichiers du corpus")
for nom in (SIMULATEUR, ENONCE_FR, ENONCE_EN, COURS, "index.html"):
    chemin = os.path.join(RACINE, nom)
    existe = os.path.isfile(chemin)
    verifie(f"« {nom} » est présent", existe)
    if existe:
        try:
            DOCS[nom] = lit(nom)
            verifie(f"« {nom} » est un UTF-8 valide", True)
        except UnicodeDecodeError as e:
            verifie(f"« {nom} » est un UTF-8 valide", False, str(e))

# Le mojibake typique d'un fichier relu dans le mauvais encodage.
for nom, src in DOCS.items():
    suspects = re.findall(r"[ÃÂ][\x80-\xbf\u0080-\u00bf]", src)
    verifie(f"« {nom} » ne contient pas de caractères recodés par erreur",
            len(suspects) == 0, f"{len(suspects)} occurrence(s)")


# ---------------------------------------------------------------------------
groupe("2. Prescription de fabrication : la même dans les quatre documents")

motif_formule = re.compile(
    r"H\s*L\s*2H\s*L\s*H\s*L\s*H\s*L\s*2H\s*L\s*H\s*L\s*H\s*L\s*2H\s*L\s*H\s*L")
for nom in (SIMULATEUR, ENONCE_FR, ENONCE_EN):
    n = len(motif_formule.findall(DOCS.get(nom, "")))
    verifie(f"« {nom} » cite la prescription à 18 couches", n >= 1, f"{n} occurrence(s)")

# La formule doit compter 18 jetons et trois couches doubles.
jetons = FORMULE_FRESNEL.split()
verifie("la formule de référence compte 18 couches", len(jetons) == 18, str(len(jetons)))
verifie("elle comporte exactement trois couches doubles",
        sum(1 for j in jetons if j.startswith("2")) == 3)
verifie("les couches doubles sont en positions 3, 9 et 15",
        [i + 1 for i, j in enumerate(jetons) if j.startswith("2")] == [3, 9, 15])
verifie("elle n'emploie que les matériaux H et L",
        all(j.lstrip("0123456789.") in ("H", "L") for j in jetons))

# Verrouillage 1–15, variables 16–18.
sim = DOCS.get(SIMULATEUR, "")
verifie("le simulateur fige les quinze premières couches",
        "layer.locked = i < 15" in sim.replace("  ", " "),
        "motif « locked = i < 15 » introuvable")
verifie("le simulateur impose le périmètre BFGS 16-18 pour le préréglage Fresnel",
        "setOptimizationScope('specific', '16-18'" in sim)


# ---------------------------------------------------------------------------
groupe("3. Bandes spectrales de mesure")

BANDES = [("460", "500"), ("535", "565"), ("620", "680")]
for nom in (SIMULATEUR, ENONCE_FR, ENONCE_EN):
    src = DOCS.get(nom, "")
    for lo, hi in BANDES:
        present = re.search(rf"{lo}\s*(?:–|-|—|&ndash;|to|à)\s*{hi}", src) is not None
        verifie(f"« {nom} » énonce la bande {lo}–{hi} nm", present)

# Le simulateur doit déclarer ces bandes dans sa spécification figée.
verifie("la spécification Qr du simulateur est figée sur les trois bandes",
        all(re.search(rf"lmin:\s*{lo},\s*lmax:\s*{hi}", sim) for lo, hi in BANDES))
verifie("le pas de la grille Qr est 0,5 nm",
        re.search(r"qr:\s*\{\s*step:\s*0\.5\s*\}", sim) is not None)


# ---------------------------------------------------------------------------
groupe("4. Hypothèses du modèle de fabrication")

for nom in (ENONCE_FR, ENONCE_EN):
    src = texte_visible(DOCS.get(nom, ""))
    verifie(f"« {nom} » annonce l'écart-type σ = Δd/2",
            re.search(r"\\?sigma\s*=\s*\\?Delta\s*d\s*/\s*2|σ\s*=\s*Δd\s*/\s*2", src) is not None)
verifie("la graine du tirage est figée à 42 dans le simulateur",
        re.search(r"const\s+seed\s*=\s*42\s*;", sim) is not None)
verifie("le simulateur perturbe toutes les couches, pas seulement les libres",
        "baseThicknesses.map" in sim)


# ---------------------------------------------------------------------------
groupe("5. Balisage HTML")

for nom, src in DOCS.items():
    ids = re.findall(r'\sid="([^"]+)"', src)
    doublons = sorted({i for i in ids if ids.count(i) > 1})
    verifie(f"« {nom} » : aucun identifiant HTML dupliqué",
            not doublons, ", ".join(doublons[:6]))

# Un « < » suivi immédiatement d'une lettre ouvre une balise fantôme et fait
# disparaître du texte. Dans les formules, il doit rester un espace ou &lt;.
for nom, src in DOCS.items():
    corps = sans_code(src)
    corps = re.sub(r"<\s*/?[A-Za-z][A-Za-z0-9]*(\s[^<>]*)?/?>", " ", corps)
    fautifs = re.findall(r"<[A-Za-z]", corps)
    verifie(f"« {nom} » : aucun « < » ne peut être pris pour une balise",
            not fautifs, f"{len(fautifs)} occurrence(s) : {fautifs[:5]}")

# Liens locaux : la cible doit exister.
for nom, src in DOCS.items():
    cibles = re.findall(r'href="(?!https?:|mailto:|#)([^"]+)"', src)
    manquants = []
    for c in cibles:
        chemin = c.split("#")[0].split("?")[0]
        if not chemin:
            continue
        chemin = htmllib.unescape(chemin).replace("%20", " ")
        if not os.path.exists(os.path.join(RACINE, chemin)):
            manquants.append(c)
    verifie(f"« {nom} » : tous les liens de fichier pointent vers une cible existante",
            not manquants, ", ".join(sorted(set(manquants))[:4]))

# Ancres internes : #quelquechose doit correspondre à un id du même document.
for nom, src in DOCS.items():
    ids = set(re.findall(r'\sid="([^"]+)"', src))
    ancres = set(re.findall(r'href="#([^"]+)"', src))
    orphelines = sorted(a for a in ancres if a and a not in ids)
    verifie(f"« {nom} » : toutes les ancres internes existent",
            not orphelines, ", ".join(orphelines[:6]))


# ---------------------------------------------------------------------------
groupe("5 bis. Indices et exposants")

# $T_pass$ se rend « T_p ass » : au-delà d'un caractère, un indice ou un
# exposant LaTeX exige des accolades. Même chose pour ^.
def segments_math(texte):
    out = []
    for m in re.finditer(r"\$\$(.+?)\$\$", texte, flags=re.S):
        out.append(m.group(1))
    sans_bloc = re.sub(r"\$\$.+?\$\$", " ", texte, flags=re.S)
    for m in re.finditer(r"\$([^$\n]+?)\$", sans_bloc):
        out.append(m.group(1))
    return out


for nom, src in DOCS.items():
    corps = sans_code(src)
    fautes = []
    for m in segments_math(corps):
        for f in re.finditer(r"_(?!\{)([A-Za-z]{2,}|\d{2,})", m):
            fautes.append(f"indice « {f.group(0)} » dans ${m.strip()[:50]}$")
        for f in re.finditer(r"\^(?!\{)([A-Za-z]{2,}|\d{2,}|-\d)", m):
            fautes.append(f"exposant « {f.group(0)} » dans ${m.strip()[:50]}$")
    verifie(f"« {nom} » : tout indice ou exposant de plus d'un caractère est accolé",
            not fautes, f"{len(fautes)} cas, ex. {fautes[0] if fautes else ''}")

# Un $ orphelin casse tout le rendu MathJax de la page.
for nom, src in DOCS.items():
    corps = sans_code(src)
    sans_bloc = re.sub(r"\$\$.+?\$\$", " ", corps, flags=re.S)
    n = len(re.findall(r"(?<!\\)\$", sans_bloc))
    verifie(f"« {nom} » : les délimiteurs mathématiques vont par paires",
            n % 2 == 0, f"{n} délimiteurs « $ » isolés ou impairs")

# Une page qui écrit des formules sans charger MathJax les affiche en clair :
# le portail montrait ainsi « $Q_r$ » aux étudiants.
for nom, src in DOCS.items():
    formules = segments_math(sans_code(src))
    charge = re.search(r"<script[^>]*src=\"[^\"]*mathjax", src, re.I) is not None
    verifie(f"« {nom} » : ses formules sont rendues (MathJax chargé, ou aucune formule)",
            charge or not formules,
            f"{len(formules)} formule(s) affichée(s) en clair, ex. ${formules[0].strip()[:30]}$"
            if formules else "")

# Les commandes LaTeX employées doivent exister dans la configuration MathJax
# livrée : une macro inconnue s'affiche en rouge dans la page de l'étudiant.
CONNUES = {
    "frac", "sqrt", "text", "lambda", "Delta", "delta", "theta", "pi", "sigma",
    "eta", "gamma", "alpha", "kappa", "phi", "mathrm", "begin", "end", "sin",
    "cos", "tan", "arcsin", "log", "exp", "sum", "int", "left", "right", "cdot",
    "times", "approx", "simeq", "le", "ge", "neq", "pm", "implies", "perp",
    "parallel", "vec", "overline", "hat", "quad", "qquad", "dfrac", "partial",
    "infty", "to", "rightarrow", "Longrightarrow", "mathcal", "mathbf", "in",
    "geq", "leq", "ldots", "cdots", "big", "Big", "bigl", "bigr", "operatorname",
    "RMSE", "max", "min", "bar", "tilde", "circ", "prime", "ll", "gg", "nm",
    "Omega", "omega", "det", "dots", "longrightarrow", "mathbb", "mu", "nu",
    "rho", "tau", "epsilon", "varepsilon", "varphi", "Re", "Im", "langle",
    "rangle", "lvert", "rvert", "colon", ";", ",", "!", " ",
    "nabla", "propto", "sim", "underbrace", "overbrace", "uparrow", "downarrow",
    "leftarrow", "Leftrightarrow", "equiv", "subset", "forall", "exists",
}
for nom, src in DOCS.items():
    corps = sans_code(src)
    inconnues = {}
    for m in segments_math(corps):
        for c in re.findall(r"\\([A-Za-z]+)", m):
            if c not in CONNUES:
                inconnues[c] = inconnues.get(c, 0) + 1
    verifie(f"« {nom} » : aucune commande LaTeX inconnue",
            not inconnues,
            ", ".join(f"\\{c}×{n}" for c, n in sorted(inconnues.items())[:6]))


groupe("6. Homologie stricte des deux énoncés")

fr, en = DOCS.get(ENONCE_FR, ""), DOCS.get(ENONCE_EN, "")

q_fr = sorted({int(x) for x in re.findall(r"\bQ(\d{1,2})\b", fr)})
q_en = sorted({int(x) for x in re.findall(r"\bQ(\d{1,2})\b", en)})
verifie("l'énoncé français couvre Q1 à Q32", q_fr == list(range(1, 33)), str(q_fr))
verifie("l'énoncé anglais couvre les mêmes questions", q_fr == q_en,
        f"FR {len(q_fr)} / EN {len(q_en)}")

ids_fr = set(re.findall(r'\sid="([^"]+)"', fr))
ids_en = set(re.findall(r'\sid="([^"]+)"', en))
verifie("les deux énoncés exposent les mêmes identifiants de section",
        ids_fr == ids_en,
        f"seulement FR : {sorted(ids_fr - ids_en)[:4]} ; seulement EN : {sorted(ids_en - ids_fr)[:4]}")

# Les deux énoncés doivent se citer mutuellement pour la bascule de langue.
verifie("l'énoncé français renvoie vers l'anglais", ENONCE_EN in fr)
verifie("l'énoncé anglais renvoie vers le français", ENONCE_FR in en)

# Même nombre d'encarts récurrents dans les deux langues. On compte la
# STRUCTURE (pictogramme, gabarit de l'encart) et non l'intitulé : les deux
# langues emploient légitimement des variantes de formulation.
for motif_fr, motif_en, libelle in (
        (r"🔍\s*<strong>", r"🔍\s*<strong>", "blocs d'auto-contrôle"),
        (r"—\s*prérequis", r"—\s*prerequisites", "encarts de prérequis"),
        (r"🧠\s*<strong>", r"🧠\s*<strong>", "pièges signalés"),
        (r"⏱", r"⏱", "durées indicatives")):
    n_fr = len(re.findall(motif_fr, fr))
    n_en = len(re.findall(motif_en, en))
    verifie(f"même nombre de {libelle} dans les deux langues ({n_fr})",
            n_fr == n_en and n_fr > 0, f"FR {n_fr} / EN {n_en}")

# La structure ne suffit pas : une valeur donnée dans une seule langue (un
# résultat glissé dans l'énoncé français, un seuil oublié dans l'anglais) passe
# tous les contrôles ci-dessus. On compare donc, question par question, le
# multiensemble des nombres affichés, virgule décimale française normalisée.
def nombres_par_question(html):
    t = texte_visible(html).replace("{,}", ".")
    t = re.sub(r"(\d),(\d)", r"\1.\2", t)
    morceaux = re.split(r"\bQ(\d{1,2})\s*[★☆]{3}", t)
    out = {}
    for i in range(1, len(morceaux) - 1, 2):
        out[int(morceaux[i])] = Counter(re.findall(r"\d+(?:\.\d+)?", morceaux[i + 1]))
    return out


nq_fr, nq_en = nombres_par_question(fr), nombres_par_question(en)
ecarts = []
for q in sorted(set(nq_fr) | set(nq_en)):
    a, b = nq_fr.get(q, Counter()), nq_en.get(q, Counter())
    if a != b:
        ecarts.append(f"Q{q} : FR seul {dict(a - b)} / EN seul {dict(b - a)}")
verifie("chaque question donne les mêmes valeurs numériques en FR et en EN",
        len(nq_fr) == 32 and not ecarts,
        f"{len(nq_fr)} questions repérées ; " + " ; ".join(ecarts[:3]))


# ---------------------------------------------------------------------------
groupe("7. Français résiduel dans la version anglaise")

# On ne regarde que la prose visible : les noms de fichiers et les identifiants
# HTML peuvent légitimement rester en français.
prose_en = texte_visible(en)
MOTS_FR = [
    "couche", "couches", "épaisseur", "épaisseurs", "mérite", "moyenne",
    "figée", "figées", "optimiser", "aiguille", "rendement", "qualifié",
    "réalisation", "réalisations", "cavité", "séance", "empilement",
    "réjection", "verrouillage", "substrat", "indice", "longueur",
]
trouves = {}
for mot in MOTS_FR:
    motif = re.compile(r"(?<![\w\u00C0-\u017F])" + re.escape(mot) + r"(?![\w\u00C0-\u017F])",
                       re.IGNORECASE)
    n = len(motif.findall(prose_en))
    if n:
        trouves[mot] = n
verifie("aucun mot français ne subsiste dans le texte anglais visible",
        not trouves, ", ".join(f"{m}×{n}" for m, n in trouves.items()))

# Et symétriquement : pas d'anglais oublié dans le texte français. On tolère
# une glose entre parenthèses — « méthode de l'aiguille (Needle Method) » aide
# l'étudiant à retrouver le terme consacré dans la littérature.
prose_fr = re.sub(r"\([^)]{0,40}\)", " ", texte_visible(fr))
MOTS_EN = ["layer", "layers", "thickness", "merit", "yield", "needle", "seed",
           "stack", "coating", "target", "mesh"]
trouves_en = {}
for mot in MOTS_EN:
    motif = re.compile(r"(?<![\w\u00C0-\u017F])" + re.escape(mot) + r"(?![\w\u00C0-\u017F])",
                       re.IGNORECASE)
    n = len(motif.findall(prose_fr))
    if n:
        trouves_en[mot] = n
verifie("aucun mot anglais ne subsiste dans le texte français visible",
        not trouves_en, ", ".join(f"{m}×{n}" for m, n in trouves_en.items()))


# ---------------------------------------------------------------------------
groupe("8. Aucun résultat pré-mâché dans les énoncés")

# L'énoncé ne doit livrer ni rendement, ni verdict de qualification, ni valeur
# de Qr : ce sont précisément les réponses attendues de l'étudiant.
INTERDITS = [
    (r"Qr\s*(?:=|vaut|est de)\s*\d", "une valeur de Qr est donnée"),
    (r"rendement\s*(?:=|de|vaut)\s*\d{2,3}\s*%", "un rendement chiffré est donné"),
    (r"\b(?:design|filtre)\s+(?:est\s+)?QUALIFIÉ\b", "un verdict de qualification est donné"),
]
for motif, libelle in INTERDITS:
    n = len(re.findall(motif, prose_fr, re.IGNORECASE))
    verifie(f"énoncé FR : {libelle} — absent", n == 0, f"{n} occurrence(s)")


# ---------------------------------------------------------------------------
groupe("9. Paquet hors ligne")

dossier = os.path.join(RACINE, HORS_LIGNE)
if not os.path.isdir(dossier):
    verifie("le dossier hors ligne existe", False, dossier)
else:
    verifie("le dossier hors ligne existe", True)

    # Aucune dépendance d'exécution distante : ni script ni feuille de style CDN.
    for nom in (SIMULATEUR, ENONCE_FR, ENONCE_EN, COURS):
        chemin = os.path.join(dossier, nom)
        if not os.path.isfile(chemin):
            verifie(f"hors ligne : « {nom} » présent", False)
            continue
        with io.open(chemin, encoding="utf-8") as fh:
            src = fh.read()
        distants = re.findall(r'<(?:script|link)[^>]*(?:src|href)="(https?://[^"]+)"', src)
        verifie(f"hors ligne : « {nom} » ne charge aucune ressource distante",
                not distants, ", ".join(sorted(set(distants))[:3]))

    # Bibliothèques locales attendues.
    for relatif in ("vendor/js/chart.umd.js", "vendor/js/lucide.min.js",
                    "vendor/css/tailwind.min.css", "vendor/mathjax/tex-mml-chtml.js"):
        verifie(f"hors ligne : {relatif} est embarqué",
                os.path.isfile(os.path.join(dossier, relatif)))

    # Le paquet doit refléter les sources : sans ce contrôle, un manifeste
    # parfaitement cohérent peut certifier une version périmée.
    PHRASES_HORS_LIGNE = [
        "Une connexion réseau est requise pour charger les bibliothèques graphiques "
        "(une distribution hors ligne existe : voir votre enseignant).",
        "Toutes les bibliothèques (graphiques, icônes, polices, équations) sont incluses "
        "dans ce dossier : aucune connexion réseau n'est nécessaire.",
        "Network access is required to load the graphical libraries "
        "(an offline distribution exists: ask your instructor).",
        "All libraries (charts, icons, fonts, equations) are bundled in this folder: "
        "no network connection is required.",
    ]

    def prose_comparable(html):
        t = texte_visible(html)
        for phrase in PHRASES_HORS_LIGNE:
            t = t.replace(phrase, " ")
        return re.sub(r"\s+", " ", t).strip()

    for nom in (SIMULATEUR, ENONCE_FR, ENONCE_EN, COURS):
        chemin = os.path.join(dossier, nom)
        if not os.path.isfile(chemin) or nom not in DOCS:
            continue
        with io.open(chemin, encoding="utf-8") as fh:
            copie = fh.read()
        a, b = prose_comparable(DOCS[nom]), prose_comparable(copie)
        if a == b:
            verifie(f"hors ligne : « {nom} » est à jour vis-à-vis de la source", True)
        else:
            i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]),
                     min(len(a), len(b)))
            verifie(f"hors ligne : « {nom} » est à jour vis-à-vis de la source", False,
                    f"divergence au caractère {i} — relancer .sync_offline.py ; "
                    f"source : « …{a[max(0, i - 40):i + 60]}… »")

    # Manifeste SHA-256 : format POSIX, complet et exact.
    manifeste = os.path.join(dossier, "SHA256SUMS.txt")
    if not os.path.isfile(manifeste):
        verifie("hors ligne : le manifeste SHA-256 existe", False)
    else:
        verifie("hors ligne : le manifeste SHA-256 existe", True)
        with io.open(manifeste, "rb") as fh:
            brut = fh.read()
        verifie("le manifeste utilise des fins de ligne LF (lisible par sha256sum)",
                b"\r\n" not in brut)

        lignes = brut.decode("utf-8").strip().split("\n")
        attendues = {}
        for ligne in lignes:
            empreinte, _, chemin = ligne.partition("  ")
            attendues[chemin] = empreinte
        verifie("les empreintes du manifeste sont en minuscules",
                all(re.fullmatch(r"[0-9a-f]{64}", e) for e in attendues.values()))
        verifie("les chemins du manifeste utilisent « / »",
                all("\\" not in c for c in attendues))

        # Recalcul intégral.
        reels = {}
        for base, dirs, fichiers in os.walk(dossier):
            dirs.sort()
            for f in sorted(fichiers):
                if f == "SHA256SUMS.txt":
                    continue
                plein = os.path.join(base, f)
                rel = os.path.relpath(plein, dossier).replace(os.sep, "/")
                with io.open(plein, "rb") as fh:
                    reels[rel] = hashlib.sha256(fh.read()).hexdigest()

        manquants = sorted(set(reels) - set(attendues))
        fantomes = sorted(set(attendues) - set(reels))
        differents = sorted(c for c in set(reels) & set(attendues)
                            if reels[c] != attendues[c])
        verifie(f"le manifeste couvre les {len(reels)} fichiers du paquet",
                not manquants, f"{len(manquants)} absent(s) : {manquants[:3]}")
        verifie("le manifeste ne référence aucun fichier disparu",
                not fantomes, f"{len(fantomes)} : {fantomes[:3]}")
        verifie("toutes les empreintes correspondent au contenu réel",
                not differents, f"{len(differents)} : {differents[:3]}")

        # Le manifeste doit rester juste APRÈS passage par git. Deux conditions :
        # des fichiers texte en LF, et des octets que git ne convertit pas.
        # Sans elles, le manifeste publié ne correspondait pas aux fichiers
        # publiés : 4 échecs sur 42 pour quiconque téléchargeait le paquet.
        crlf = []
        for rel in reels:
            if rel.endswith((".html", ".css", ".js", ".md", ".txt", ".svg")):
                with io.open(os.path.join(dossier, rel), "rb") as fh:
                    if b"\r\n" in fh.read():
                        crlf.append(rel)
        verifie("les fichiers texte du paquet hors ligne sont en fins de ligne LF",
                not crlf, f"{len(crlf)} en CRLF : {crlf[:3]} — relancer .sync_offline.py")
        chemin_ga = os.path.join(RACINE, ".gitattributes")
        attributs = io.open(chemin_ga, encoding="utf-8").read() if os.path.isfile(chemin_ga) else ""
        verifie("git ne convertit pas les octets du paquet hors ligne (.gitattributes -text)",
                re.search(r"^outputs/tp_couches_minces_hors_ligne/\*\*\s+-text\s*$", attributs, re.M)
                is not None, "sans cela, core.autocrlf rend le manifeste publié faux")


# ---------------------------------------------------------------------------
groupe("10. Publication : rien de ce qui contient des réponses n'est diffusé")

# Le dépôt GitHub est public : tout fichier suivi est lisible par tous, et
# l'historique le conserve. Aucun document de réponses ne doit être suivi.
MOTIFS_ENSEIGNANT = [r"(^|/)CORRIGE[^/]*\.md$", r"(^|/)REPONSES[^/]*\.md$", r"_results\.md$",
                     r"(^|/)COMPARAISON[^/]*\.md$", r"(^|/)A_LIRE[^/]*\.md$"]
try:
    suivis = subprocess.run(["git", "ls-files"], cwd=RACINE, capture_output=True,
                            text=True, encoding="utf-8", check=True).stdout.split("\n")
    suivis = [f for f in suivis if f]
except (OSError, subprocess.CalledProcessError):
    suivis = None

if suivis is None:
    print("    (git indisponible : contrôles de suivi ignorés)")
else:
    fautifs = [f for f in suivis if any(re.search(m, f) for m in MOTIFS_ENSEIGNANT)]
    verifie("aucun document de réponses n'est suivi par git (dépôt public)",
            not fautifs, ", ".join(fautifs))

    # Filet de sécurité par le contenu : des valeurs que seul un corrigé contient.
    SIGNATURES = [r"211[,.]89", r"0[,.]00056", r"823/1000", r"826/1000", r"\+1[,.]59\s?%"]
    porteurs = []
    for f in suivis:
        if "/vendor/" in f or not f.endswith((".md", ".html", ".txt", ".py", ".js")):
            continue
        if f.startswith("tests/"):
            continue                      # la recette calcule, elle ne publie pas
        try:
            with io.open(os.path.join(RACINE, f), encoding="utf-8") as fh:
                contenu = fh.read()
        except (OSError, UnicodeDecodeError):
            continue
        if any(re.search(sig, contenu) for sig in SIGNATURES):
            porteurs.append(f)
    verifie("aucun fichier suivi ne contient de valeur propre au corrigé",
            not porteurs, ", ".join(porteurs))

    # Caractères de contrôle : signature d'un fichier passé par un échappement
    # mal maîtrisé (« \t » devenu tabulation, « \a » devenu BEL). Le README
    # public avait ainsi perdu la première lettre de ses noms de fichiers.
    corrompus = []
    for f in suivis:
        if "/vendor/" in f or not f.endswith((".md", ".html", ".py", ".js", ".json", ".txt")):
            continue
        try:
            with io.open(os.path.join(RACINE, f), encoding="utf-8") as fh:
                contenu = fh.read()
        except (OSError, UnicodeDecodeError):
            continue
        n_ctl = sum(contenu.count(c) for c in "\x07\x08\x0b\x0c")
        n_tab = contenu.count("\t") if f.endswith(".md") else 0
        if n_ctl or n_tab:
            corrompus.append(f"{f} (contrôle {n_ctl}, tabulations {n_tab})")
    verifie("aucun fichier texte suivi ne contient de caractère de contrôle parasite",
            not corrompus, ", ".join(corrompus))

# Liste blanche de publication : on rejoue la règle de .vercelignore sur des
# chemins réels. Seuls des motifs de premier niveau sont admis, pour que ce
# contrôle reste exact.
chemin_vi = os.path.join(RACINE, ".vercelignore")
if not os.path.isfile(chemin_vi):
    verifie(".vercelignore existe", False)
else:
    regles = []
    for ligne in io.open(chemin_vi, encoding="utf-8").read().splitlines():
        ligne = ligne.strip()
        if not ligne or ligne.startswith("#"):
            continue
        neg = ligne.startswith("!")
        motif = ligne[1:] if neg else ligne
        regles.append((neg, motif))
    supportees = all(m.startswith("/") and "/" not in m[1:] for _, m in regles)
    verifie(".vercelignore n'utilise que des motifs de premier niveau", supportees,
            "motif imbriqué : ce contrôle ne saurait plus le vérifier")

    import fnmatch

    def publie(chemin):
        tete = chemin.split("/")[0]
        garde = True
        for neg, motif in regles:
            if fnmatch.fnmatchcase(tete, motif[1:]):
                garde = neg
        return garde

    doivent_partir = [SIMULATEUR, ENONCE_FR, ENONCE_EN, COURS, "index.html",
                      "outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx",
                      "outputs/tp_couches_minces_hors_ligne/index.html"]
    ne_doivent_pas = ["CORRIGE_REPONSES.md", "COMPARAISON_IA.md", "A_LIRE_INDEX_ET_LIENS.md",
                      "gemini_flash_results.md", "GUIDE_MIGRATION_ET_ACTIONS_TP.md", "README.md",
                      "tests/lancer.py", "tests/test_physique.js", "audit_verification_numerique.py",
                      ".sync_offline.py", ".gitignore", "header_fr.txt", "un_futur_corrige.md"]
    manquants = [c for c in doivent_partir if not publie(c)]
    fuites = [c for c in ne_doivent_pas if publie(c)]
    verifie("la liste blanche publie tout le matériel étudiant", not manquants, ", ".join(manquants))
    verifie("la liste blanche ne publie ni corrigé, ni guide, ni tests, ni scripts",
            not fuites, ", ".join(fuites))

# La redirection des .md était contournable par « %2E » : elle ne doit pas
# revenir comme protection.
try:
    import json
    cfg = json.load(io.open(os.path.join(RACINE, "vercel.json"), encoding="utf-8"))
    redir_md = [r for r in cfg.get("redirects", []) if ".md" in r.get("source", "")]
    verifie("vercel.json ne s'appuie pas sur une redirection des .md", not redir_md,
            "une redirection ne filtre qu'une écriture de l'URL ; utiliser .vercelignore")
except (OSError, ValueError) as e:
    verifie("vercel.json est lisible", False, str(e))


# ---------------------------------------------------------------------------
groupe("11. Cohérence énoncé ↔ outils étudiants")

# Le simulateur s'ouvre en mode libre, où les mérites d'exercice sont masqués.
# L'énoncé doit le dire AVANT la première question qui en a besoin (Q15).
for nom, marqueur_mode, marqueur_q15 in (
        (ENONCE_FR, "Mode Étudiant — à activer avant chaque exercice", ">Q15<"),
        (ENONCE_EN, "Student mode — switch it on before each exercise", ">Q15<")):
    src = DOCS.get(nom, "")
    i_mode, i_q15 = src.find(marqueur_mode), src.find(marqueur_q15)
    verifie(f"« {nom} » explique le passage en mode Étudiant avant Q15",
            i_mode != -1 and (i_q15 == -1 or i_mode < i_q15),
            "consigne absente" if i_mode == -1 else "consigne placée après Q15")

# Grille de Q14 : l'énoncé fixe bornes et pas ; le classeur fourni doit suivre.
import zipfile
m = re.search(r"\$d_\{ZnS\}\$ de <strong>(\d+) à (\d+) nm</strong> et \$d_\{YF3\}\$ de "
              r"<strong>(\d+) à (\d+) nm</strong>, par pas de <strong>(\d+) nm</strong>",
              DOCS.get(ENONCE_FR, ""))
xlsx = os.path.join(RACINE, "outputs", "tp_couches_minces", "squelette_excel_couches_minces.xlsx")
if not m or not os.path.isfile(xlsx):
    verifie("grille de Q14 lisible dans l'énoncé et le classeur", False,
            "énoncé" if not m else "classeur absent")
else:
    z0, z1, y0, y1, pas = map(int, m.groups())
    attendu_znS = list(range(z0, z1 + 1, pas))
    attendu_yf3 = list(range(y0, y1 + 1, pas))
    with zipfile.ZipFile(xlsx) as z:
        feuille = z.read("xl/worksheets/sheet3.xml").decode("utf-8")
    lit = lambda ref: re.search(r'<x:c r="%s"[^>]*>.*?<x:v>([^<]*)</x:v>' % ref, feuille, re.S)
    axe_yf3 = [int(float(lit(r).group(1))) if lit(r) else None for r in ("B5", "C5", "D5", "E5", "F5")]
    axe_zns = [int(float(lit(r).group(1))) if lit(r) else None for r in ("A6", "A7", "A8", "A9", "A10")]
    verifie(f"classeur Q14 : axe d_ZnS conforme à l'énoncé ({attendu_znS})",
            axe_zns == attendu_znS, f"classeur : {axe_zns}")
    verifie(f"classeur Q14 : axe d_YF3 conforme à l'énoncé ({attendu_yf3})",
            axe_yf3 == attendu_yf3, f"classeur : {axe_yf3}")

# Portail et README : n'annoncer que ce que le simulateur contient.
for nom in ("index.html", "README.md"):
    chemin = os.path.join(RACINE, nom)
    if not os.path.isfile(chemin):
        continue
    with io.open(chemin, encoding="utf-8") as fh:
        texte = fh.read()
    absents = re.findall(r"(?i)\b(recuit|annealing|random search|descente locale|\d+ algorithmes)\b", texte)
    verifie(f"« {nom} » n'annonce aucun algorithme absent du simulateur",
            not absents, ", ".join(sorted(set(absents))))
    verifie(f"« {nom} » ne renvoie pas les étudiants vers le dépôt source",
            nom != "index.html" or "github.com" not in texte, "lien GitHub présent")


# ---------------------------------------------------------------------------
print("\n" + "=" * 78)
if not _echecs:
    print(f"RESULTAT : {_total[0]} contrôles, 0 échec.")
else:
    print(f"RESULTAT : {_total[0]} contrôles, {len(_echecs)} ECHEC(S)")
    for libelle, detail in _echecs:
        print(f"  - {libelle}")
        if detail:
            print(f"      {detail}")
print("=" * 78)

sys.exit(0 if not _echecs else 1)
