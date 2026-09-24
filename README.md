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

Le simulateur s'ouvre en **mode libre**. Pour les exercices, cliquer sur
**🎓 Étudiant** puis choisir l'exercice : c'est ce qui rend disponibles les
mérites « R moyen » et « Maximiser Qr ».

## Maintenance

```bash
python tests/lancer.py           # recette complète, code de retour 0/1
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
