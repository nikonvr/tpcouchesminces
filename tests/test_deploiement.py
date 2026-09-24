# -*- coding: utf-8 -*-
"""Vérification EN LIGNE : ce que le site et le dépôt public exposent réellement.

Ce module interroge le site déployé et GitHub, sans authentification — donc
exactement comme le ferait un étudiant. Il ne modifie rien.

    python tests/test_deploiement.py
    python tests/lancer.py --en-ligne

Trois vérités à établir :
  1. le site sert le matériel étudiant, identique au commit HEAD ;
  2. aucune écriture d'URL ne donne accès à un fichier non publié — la règle de
     redirection d'origine cédait à « %2E » à la place du point ;
  3. le dépôt public n'expose aucun corrigé, ni dans HEAD, ni dans l'historique.

Adresse du site modifiable par la variable TP_URL.
"""

import hashlib
import io
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.environ.get("TP_URL", "https://tpcouchesminces.vercel.app").rstrip("/")
DELAI = 25

_echecs, _total = [], [0]


def groupe(nom):
    print("\n  " + nom)


def verifie(libelle, condition, detail=""):
    _total[0] += 1
    print(f"    {'OK   ' if condition else 'ECHEC'} {libelle}" + ("" if condition or not detail else f"  — {detail}"))
    if not condition:
        _echecs.append((libelle, detail))
    return bool(condition)


class _SansRedirection(urllib.request.HTTPRedirectHandler):
    """Une redirection est un résultat à constater, pas à suivre."""
    def redirect_request(self, *args, **kwargs):
        return None


_OUVREUR = urllib.request.build_opener(_SansRedirection)


def lire(url):
    """Renvoie (code HTTP, corps, en-têtes) ; code None si le réseau fait défaut."""
    req = urllib.request.Request(url, headers={"User-Agent": "recette-tp-couches-minces"})
    try:
        with _OUVREUR.open(req, timeout=DELAI) as rep:
            return rep.status, rep.read(), dict(rep.headers)
    except urllib.error.HTTPError as e:
        return e.code, b"", dict(e.headers or {})
    except (urllib.error.URLError, OSError) as e:
        return None, str(e).encode(), {}


def git(*args):
    return subprocess.run(["git", *args], cwd=RACINE, capture_output=True, check=True).stdout


print("=" * 78)
print(f"VÉRIFICATION EN LIGNE — {SITE}")
print("=" * 78)

code, _, _ = lire(SITE + "/")
if code is None:
    print("\n  Réseau indisponible : vérification en ligne impossible.")
    sys.exit(1)

# ---------------------------------------------------------------------------
groupe("1. Le site sert le matériel étudiant, identique au commit HEAD")

PAGES = [
    ("index.html", "/"),
    ("simulateur_couches_minces.html", "/simulateur_couches_minces"),
    ("tp_couches_minces_fr.html", "/tp_couches_minces_fr"),
    ("tp_couches_minces_en.html", "/tp_couches_minces_en"),
    ("theorie en francais.html", "/theorie%20en%20francais"),
    ("outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx",
     "/outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx"),
    ("outputs/tp_couches_minces_hors_ligne/index.html", "/outputs/tp_couches_minces_hors_ligne"),
]
en_retard = []
for fichier, chemin in PAGES:
    code, corps, entetes = lire(SITE + chemin)
    if not verifie(f"{chemin} est servi", code == 200, f"HTTP {code}"):
        continue
    try:
        attendu = git("show", f"HEAD:{fichier}")
    except subprocess.CalledProcessError:
        verifie(f"{fichier} est suivi par git", False)
        continue
    if hashlib.sha256(corps).digest() != hashlib.sha256(attendu).digest():
        en_retard.append(fichier)
verifie("chaque fichier servi est identique à sa version du commit HEAD", not en_retard,
        f"différents : {', '.join(en_retard)} — déploiement en cours ou en retard sur HEAD")

_, _, entetes = lire(SITE + "/")
verifie("l'en-tête X-Content-Type-Options: nosniff est envoyé",
        any(k.lower() == "x-content-type-options" and v.lower() == "nosniff" for k, v in entetes.items()))

# ---------------------------------------------------------------------------
groupe("2. Aucune écriture d'URL n'atteint un fichier non publié")

PRIVES = ["CORRIGE_REPONSES.md", "COMPARAISON_IA.md", "A_LIRE_INDEX_ET_LIENS.md",
          "REPONSES_CHATGPT.md", "gemini_flash_results.md", "gemini_pro_results.md",
          "GUIDE_MIGRATION_ET_ACTIONS_TP.md", "README.md"]
SCRIPTS = ["tests/lancer.py", "tests/test_physique.js", "tests/README.md",
           "audit_verification_numerique.py", ".sync_offline.py", ".gitignore",
           ".vercelignore", ".git/config"]


def variantes(nom):
    base, _, ext = nom.rpartition(".")
    yield "/" + nom
    if base:
        yield f"/{base}%2E{ext}"          # le contournement constaté le 23/09/2026
        yield f"/{base}%2e{ext}"
        yield f"/{base}.{ext.upper()}"
        yield f"/{base}.{ext}?v=1"
        yield f"/{base}%2E{ext}%3F"
    yield "/" + nom.replace("_", "%5F")


exposes = []
for nom in PRIVES + SCRIPTS:
    for chemin in variantes(nom):
        code, corps, _ = lire(SITE + chemin)
        if code == 200:
            exposes.append(f"{chemin} ({len(corps)} octets)")
verifie(f"{len(PRIVES) + len(SCRIPTS)} fichiers non publiés, "
        f"essayés sous {sum(1 for n in PRIVES + SCRIPTS for _ in variantes(n))} écritures : "
        f"aucun n'est servi", not exposes, "; ".join(exposes[:5]))

# ---------------------------------------------------------------------------
groupe("3. Le dépôt public n'expose aucun corrigé")

try:
    origine = git("remote", "get-url", "origin").decode().strip()
    m = re.search(r"github\.com[/:]([^/]+)/([^/.]+)", origine)
except subprocess.CalledProcessError:
    m = None
if not m:
    print("    (dépôt GitHub non identifié : groupe ignoré)")
else:
    proprio, depot = m.groups()
    brut = f"https://raw.githubusercontent.com/{proprio}/{depot}"
    code_depot, _, _ = lire(f"https://github.com/{proprio}/{depot}")
    public = code_depot == 200
    print(f"    (dépôt {proprio}/{depot} : {'PUBLIC' if public else 'non public'}, HTTP {code_depot})")

    branche = git("rev-parse", "--abbrev-ref", "HEAD").decode().strip()
    dans_head = [n for n in PRIVES[:6] if lire(f"{brut}/{branche}/{n}")[0] == 200]
    verifie("aucun document de réponses dans la version courante du dépôt",
            not dans_head, ", ".join(dans_head))

    # L'historique : un commit qui a contenu le corrigé le sert toujours tant que
    # le dépôt est public. Retirer le fichier ne l'efface pas du passé.
    historique = []
    for sha in git("rev-list", "--all").decode().split():
        for n in PRIVES[:6]:
            if subprocess.run(["git", "cat-file", "-e", f"{sha}:{n}"], cwd=RACINE,
                              capture_output=True).returncode == 0:
                historique.append((sha, n))
    commits = sorted({s for s, _ in historique})
    lisibles = []
    for sha in commits:
        n = next(f for s, f in historique if s == sha)
        if lire(f"{brut}/{sha}/{n}")[0] == 200:
            lisibles.append(f"{sha[:7]}:{n}")
    verifie("l'historique public ne sert aucun document de réponses",
            not lisibles,
            f"{len(lisibles)} commit(s) le servent encore, ex. {', '.join(lisibles[:2])} — "
            "retirer un fichier n'efface pas l'historique : rendre le dépôt privé "
            "(GitHub → Settings → Danger Zone → Change visibility)")

# ---------------------------------------------------------------------------
groupe("4. Le paquet hors ligne téléchargé est intègre")

# Ce que vérifie un utilisateur avec « sha256sum -c » : le manifeste SERVI
# contre les fichiers SERVIS. Ce contrôle a révélé que git convertissait les
# fins de ligne après le calcul des empreintes.
BASE_KIT = "/outputs/tp_couches_minces_hors_ligne"
code, corps, _ = lire(SITE + BASE_KIT + "/SHA256SUMS.txt")
if not verifie("le manifeste SHA256SUMS.txt est servi", code == 200, f"HTTP {code}"):
    pass
else:
    lignes = [l for l in corps.decode("utf-8").split("\n") if l.strip()]
    faux, absents = [], []
    for ligne in lignes:
        empreinte, _, rel = ligne.partition("  ")
        if rel.endswith("index.html"):
            chemin = BASE_KIT + ("/" + rel[: -len("index.html")]).rstrip("/")
        elif rel.endswith(".html"):
            chemin = f"{BASE_KIT}/{rel[:-5]}"          # adresses propres (cleanUrls)
        else:
            chemin = f"{BASE_KIT}/{rel}"
        c, contenu, _ = lire(SITE + urllib.request.quote(chemin))
        if c != 200:
            absents.append(f"{rel} (HTTP {c})")
        elif hashlib.sha256(contenu).hexdigest() != empreinte:
            faux.append(rel)
    verifie(f"les {len(lignes)} fichiers du manifeste sont tous servis", not absents,
            ", ".join(absents[:4]))
    verifie("chaque empreinte du manifeste servi correspond au fichier servi", not faux,
            f"{len(faux)} fausse(s) : {', '.join(faux[:4])}")

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
