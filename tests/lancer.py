# -*- coding: utf-8 -*-
"""Lance l'ensemble des tests du TP et rend un bilan unique.

    python tests/lancer.py              tous les tests
    python tests/lancer.py --court      bilan seul, sans le détail
    python tests/lancer.py physique     un seul module

Code de retour : 0 si tout passe, 1 sinon — utilisable en vérification de
routine ou en intégration continue.

Pour valider une version modifiée du simulateur sans toucher au fichier de
référence, définir TP_SIMULATEUR :

    TP_SIMULATEUR=/chemin/simulateur_modifie.html python tests/lancer.py
"""

import os
import re
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding="utf-8")

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)

MODULES = [
    ("physique",    "node",   "test_physique.js",
     "moteur TMM : dispersion, Fresnel, Abelès vs Airy, lois physiques"),
    ("algorithmes", "node",   "test_algorithmes.js",
     "BFGS, tirage à graine, loi normale, Wilson, quantiles"),
    ("gardefous",   "node",   "test_gardefous.js",
     "les garde-fous se taisent en usage normal et parlent sur défaut"),
    ("documents",   "python", "test_documents.py",
     "énoncés FR/EN, balisage, homologie, paquet hors ligne"),
]


def interpreteur(nom):
    return sys.executable if nom == "python" else "node"


def lance(module):
    cle, moteur, fichier, description = module
    debut = time.time()
    proc = subprocess.run(
        [interpreteur(moteur), os.path.join(ICI, fichier)],
        cwd=RACINE, capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    duree = time.time() - debut
    sortie = (proc.stdout or "") + (proc.stderr or "")
    m = re.search(r"RESULTAT\s*:\s*(\d+)\s+contrôles?,\s*(?:(\d+)\s+ECHEC|0\s+échec)", sortie)
    total = int(m.group(1)) if m else 0
    echecs = int(m.group(2)) if (m and m.group(2)) else 0
    if proc.returncode != 0 and not m:
        echecs = max(echecs, 1)          # plantage franc du module
    return {
        "cle": cle, "description": description, "sortie": sortie,
        "total": total, "echecs": echecs, "duree": duree,
        "code": proc.returncode,
    }


def principal():
    args = [a for a in sys.argv[1:]]
    court = "--court" in args
    voulus = [a for a in args if not a.startswith("-")]
    modules = [m for m in MODULES if not voulus or m[0] in voulus]
    if not modules:
        print(f"Module inconnu. Choix : {', '.join(m[0] for m in MODULES)}")
        return 2

    cible = os.environ.get("TP_SIMULATEUR")
    print("=" * 78)
    print("RECETTE DU TP COUCHES MINCES")
    print("=" * 78)
    print(f"  Racine     : {RACINE}")
    print(f"  Simulateur : {cible or 'simulateur_couches_minces.html (référence)'}")
    print(f"  Modules    : {', '.join(m[0] for m in modules)}")

    resultats = [lance(m) for m in modules]

    if not court:
        for r in resultats:
            print(r["sortie"].rstrip())

    total = sum(r["total"] for r in resultats)
    echecs = sum(r["echecs"] for r in resultats)
    duree = sum(r["duree"] for r in resultats)

    print("\n" + "=" * 78)
    print("BILAN")
    print("=" * 78)
    largeur = max(len(r["cle"]) for r in resultats)
    for r in resultats:
        etat = "OK   " if r["echecs"] == 0 else f"{r['echecs']} ECHEC(S)"
        print(f"  {r['cle'].ljust(largeur)}  {str(r['total']).rjust(3)} contrôles  "
              f"{etat.ljust(11)} {r['duree']:5.1f} s   {r['description']}")
    print("-" * 78)
    print(f"  {'TOTAL'.ljust(largeur)}  {str(total).rjust(3)} contrôles  "
          f"{('OK' if echecs == 0 else str(echecs) + ' ECHEC(S)').ljust(11)} {duree:5.1f} s")
    print("=" * 78)

    if echecs:
        print("\nDétail des échecs :")
        for r in resultats:
            if not r["echecs"]:
                continue
            garder = False
            for ligne in r["sortie"].split("\n"):
                if ligne.startswith("RESULTAT"):
                    garder = True
                    continue
                if garder and ligne.strip().startswith(("-", " ")):
                    print(f"  [{r['cle']}] {ligne.strip()}")
        print()
    return 0 if echecs == 0 else 1


if __name__ == "__main__":
    sys.exit(principal())
