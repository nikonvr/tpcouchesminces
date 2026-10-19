# TP Couches Minces Optiques — simulation et salle blanche

Dispositif de travaux pratiques de simulation de couches minces optiques,
adossé au dépôt sous vide à l'Institut Fresnel.
Public : BUT 3 FI Parcours MCPC — étudiants L2 · L3 · M1 · M2.

Portail en ligne : <https://tpcouchesminces.vercel.app>

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Portail étudiant |
| `simulateur_couches_minces.html` | Simulateur autonome : méthode matricielle d'Abelès (TMM), polarisations S/P, optimisation quasi-Newton BFGS, méthode de l'aiguille, analyseur de bandes, qualification Monte-Carlo |
| `tp_couches_minces_fr.html` | Énoncé français — 10 exercices, 32 questions, durées indicatives |
| `tp_couches_minces_en.html` | Énoncé anglais, homologue strict du français |
| `theorie en francais.html` | Cours et rappels théoriques |
| `outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx` | Classeur étudiant pour Q12 (matrice d'une couche) et Q14 (cartographie 2D) |
| `outputs/tp_couches_minces_hors_ligne/` | Paquet autonome pour les salles sans réseau, avec manifeste SHA-256 |
| `GUIDE_MIGRATION_ET_ACTIONS_TP.md` | Référentiel enseignant : invariants, conventions, recette |
| `tests/` | Recette automatisée (voir `tests/README.md`) |

Le simulateur ne contient qu'**un seul** algorithme d'optimisation, BFGS.
La méthode de l'aiguille n'optimise pas : elle crée une couche, que BFGS
raffine ensuite.

## Utilisation

Ouvrir `simulateur_couches_minces.html` ou `tp_couches_minces_fr.html` dans un
navigateur récent. Aucune installation. Hors ligne : ouvrir
`outputs/tp_couches_minces_hors_ligne/index.html`.

Le simulateur s'ouvre sur un **accueil étudiant** : choisir son exercice
affiche les outils utiles et une consigne visible. Les mérites « R moyen »
et « Maximiser Qr » deviennent disponibles dans les exercices concernés.
Le bouton **🎛 Libre** ouvre la conception d'un composant personnel.

Les matériaux personnels se définissent dans **+ Matériau** par une table
`λ, n, k`, saisie ou importée (CSV/TXT/TSV, deux colonnes si k = 0).
Dans l'éditeur, **Mes matériaux** liste M1, M2, M3… Le bouton
**+ Nouveau matériau**, à côté de cette liste, crée une table indépendante.
Cliquer sur le nom d'un matériau permet de retrouver sa table sans modifier
les autres matériaux.
Les décimales françaises sont acceptées avec tabulations, espaces ou
points-virgules. Choisir explicitement nm ou µm en cas de doute ; le mode Auto
utilise l'en-tête `lambda_nm`/`lambda_um`, sinon une plage entièrement ≤ 25
est interprétée en µm. Une importation invalide conserve la table précédente.
Les limites acceptées sont 100–5000 nm, 0,01 ≤ n ≤ 20 et 0 ≤ k ≤ 30.
Les points gardent leur précision, sont interpolés par PCHIP, et les valeurs
de bord sont maintenues hors de la table. Une ligne définit un indice constant.

Les tables sont sauvegardées dans le navigateur courant : exporter en CSV
pour les transférer ou les conserver indépendamment de ce navigateur.
Le superstrat doit être transparent. Les matériaux peuvent servir aux couches
des deux faces, au substrat et au milieu de sortie.

**Face arrière connue :** cocher **Inclure la face arrière**, puis choisir une
face nue, une couche de silice quart d'onde, copier la face avant ou saisir
les couches en nm. Sur chaque face, la couche 1 touche le substrat. Les
réglages avancés permettent de définir le milieu de sortie et une formule.
Le traitement arrière reste fixe pendant l'optimisation et le Monte-Carlo
de la face avant ; changer la référence QWOT avant ne change pas ses nm.

Le modèle demande un **substrat épais transparent (k = 0)** : les interférences
dans chaque coating sont cohérentes, les réflexions multiples entre les
deux faces sont additionnées en intensité. Les couches peuvent absorber.
Les franges d'une lame mince cohérente et l'absorption dans l'épaisseur du
substrat ne sont pas modélisées.

## Maintenance

```bash
python tests/lancer.py           # recette complète, code de retour 0/1
python tests/lancer.py materiaux # contrôles ciblés sur les matériaux personnels
python tests/lancer.py arriere   # deux faces, référence indépendante et commandes
python .sync_offline.py          # régénère le paquet hors ligne et son manifeste
```

Après toute modification d'un énoncé, du cours ou du simulateur : relancer
`.sync_offline.py`, puis la recette.

## Publication

Le dépôt est **public**. Les documents enseignants qui contiennent des réponses
(corrigé, comparaisons, copies d'IA) sont exclus par `.gitignore` et restent
sur le poste de l'enseignant.

Le site Vercel ne reçoit que la liste blanche de `.vercelignore` : portail,
simulateur, énoncés, cours et dossier `outputs/`. Tout autre fichier du dépôt
n'est jamais publié, quelle que soit l'URL demandée.
