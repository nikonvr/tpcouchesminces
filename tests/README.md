# Recette automatisée du TP couches minces

Jeu de tests destiné à être **relancé en routine** avant toute diffusion.
Il ne remplace pas la relecture pédagogique ; il garantit que le calcul,
les algorithmes et les documents restent cohérents entre eux.

## Lancer

```bash
python tests/lancer.py
```

| Commande | Effet |
|---|---|
| `python tests/lancer.py` | tout, avec le détail contrôle par contrôle |
| `python tests/lancer.py --court` | bilan seul |
| `python tests/lancer.py physique` | un seul module (`physique`, `algorithmes`, `gardefous`, `documents`) |
| `python tests/lancer.py --en-ligne` | ajoute `deploiement` : interroge le site et GitHub (réseau requis) |
| `node tests/test_physique.js` | module physique isolé |
| `python tests/test_documents.py` | module documents isolé |

Code de retour : **0** si tout passe, **1** sinon.

Pour éprouver une version modifiée du simulateur sans toucher au fichier de
référence :

```bash
TP_SIMULATEUR=/chemin/vers/simulateur_modifie.html python tests/lancer.py
```

Prérequis : Node.js et Python 3, sans aucune bibliothèque externe.

## Principe

Les tests ne portent **jamais sur une copie** du code : `tests/lib/extraction.js`
relit `simulateur_couches_minces.html` à chaque exécution et en extrait les
fonctions par leur nom, en équilibrant les accolades. Déplacer du code dans le
fichier ne casse donc pas la recette ; le modifier, si.

Trois niveaux de référence, indépendants du code testé :

1. **Formules fermées** — Fresnel, lame quart d'onde, miroir quart d'onde,
   métal semi-infini. Vérités de manuel : en cas d'écart, c'est le simulateur
   qui a tort.
2. **Algorithme différent** — récursion d'Airy/Rouard sur les amplitudes, là
   où le simulateur multiplie des matrices d'Abelès. Deux chemins de calcul
   distincts doivent donner le même nombre.
3. **Lois physiques** — conservation de l'énergie, égalité S/P à incidence
   normale, limite d'une couche épaisse. Elles ne dépendent d'aucune
   implémentation, donc aucune erreur commune ne peut les satisfaire toutes.

La référence adopte **volontairement la convention d'indice opposée** à celle
du simulateur ($N = n + ik$ contre $N = n - ik$). Les deux sont équivalentes
pour $R$ et $T$ ; les faire diverger fait apparaître tout mélange de
conventions à l'intérieur du code testé.

## Contenu

### `test_physique.js` — 59 contrôles

| Section | Ce qui est vérifié |
|---|---|
| A. Dispersion | Sellmeier BK7 et interpolation PCHIP des tables ZnS/YF3, réécrites ici ; monotonie ($k \ge 0$, pas d'oscillation de Runge) ; épaisseurs QWOT |
| B. Formules fermées | dioptre air/BK7 en S et P de 0 à 80°, angle de Brewster, lame quart d'onde, miroirs $(HL)^pH$ pour $p = 3..6$, dioptre air/métal |
| C. Algorithme croisé | Abelès contre Airy sur 5 empilements × 14 longueurs d'onde × 4 incidences |
| D. Lois physiques | égalité S/P à incidence normale, $R+T \le 1$, $R+T=1$ en domaine transparent, couche métallique épaisse, réflexion totale, décroissance monotone, effet de l'ordre de dépôt, neutralité d'une couche nulle |
| E. Prescription Fresnel | 18 couches, alternance et couches doubles, spectre borné, moyennes de bande et $Q_r$, échantillonnage des trois bandes |

### `test_algorithmes.js` — 66 contrôles

Intervalle de Wilson (conformité et propriétés, dont « 1000/1000 ne prouve pas
100 % »), quantiles, générateur à graine (reproductibilité, uniformité par
$\chi^2$), tirage gaussien (moments, asymétrie, aplatissement, règle des
$\pm1/2/3\sigma$, et vérification que $\sigma = \Delta d/2$ place bien 95 % des
erreurs dans $\pm\Delta d$), BFGS (quadratique, vallée étroite, Rosenbrock,
déterminisme, décroissance stricte du coût, respect des couches figées, bornes
basse et haute, convergence **locale** démontrée par deux départs différents),
analyse d'une liste de couches.

### `test_gardefous.js` — 19 contrôles

Le simulateur embarque des **garde-fous d'exécution** (objet `Garde`) qui
vérifient, en cours de calcul et *avant tout rabotage*, les propriétés dont on
est certain : R + T ≤ 1, égalité S/P à incidence normale, absorption positive,
couches verrouillées immobiles, coût BFGS non croissant et cohérent avec
l'empilement rendu, intervalle de Wilson contenant la proportion observée. Une
violation est journalisée et signalée par un badge dans l'interface.

Ce module teste les deux moitiés de la propriété : **silence** en usage normal
(9 000 points spectraux, optimisations, intervalles) et **déclenchement** sur
des défauts délibérément réinjectés dans des copies du simulateur — mélange de
conventions d'indice, écriture hors périmètre, remontée du coût, mérite annoncé
faux, intervalle incohérent. Il mesure aussi leur surcoût, qui doit rester
sous 15 % sur le chemin critique.

### `test_documents.py` — contrôles hors ligne

Présence et encodage des quatre documents, prescription à 18 couches identique
partout, bandes spectrales, hypothèses du modèle ($\sigma$, graine, couches
perturbées), balisage (identifiants uniques, liens et ancres valides, aucun
`<` pris pour une balise), **typographie mathématique** (tout indice ou exposant
de plus d'un caractère accolé — `$T_{pass}$` et non `$T_pass$` —, délimiteurs
`$` appariés, aucune commande LaTeX hors de la configuration MathJax livrée),
homologie stricte FR/EN (mêmes questions, mêmes identifiants, mêmes encarts),
absence de français dans l'anglais et réciproquement, absence de résultat
pré-mâché, intégrité du paquet hors ligne (aucune ressource distante,
bibliothèques embarquées, **copies à jour vis-à-vis des sources**, manifeste
SHA-256 recalculé fichier par fichier).

**Publication** : aucun document de réponses suivi par git (le dépôt est
public), aucune valeur propre au corrigé dans un fichier suivi, aucun caractère
de contrôle parasite, liste blanche `.vercelignore` rejouée sur des chemins
réels, pas de redirection des `.md` servant de protection.

**Cohérence énoncé ↔ outils** : consigne « mode Étudiant » placée avant Q15,
axes du classeur Q14 identiques à l'énoncé, portail et README sans algorithme
inexistant ni lien vers le dépôt source.

### `test_deploiement.py` — en ligne, hors routine

Interroge le site déployé et GitHub **sans authentification**, comme le ferait
un étudiant. Vérifie que le site sert le matériel étudiant identique au commit
`HEAD` ; qu'aucun fichier non publié n'est atteint sous une centaine
d'écritures d'URL (dont `%2E` à la place du point, qui contournait l'ancienne
redirection) ; et que le dépôt public n'expose aucun corrigé, **historique
compris**. À lancer après chaque déploiement.

## Ajouter un test

Les trois fichiers utilisent le même harnais minimal :

```js
V.verifie('libellé lisible', condition, 'détail affiché en cas d’échec');
V.proche('libellé', obtenu, attendu, tolerance);
V.serieProche('libellé', [[ecart, 'contexte'], ...], tolerance);
```

Un libellé se lit comme une phrase vraie quand le test passe. Préférer une
vérité extérieure (formule fermée, loi physique) à une valeur relevée dans le
simulateur : un test qui recopie la sortie du code testé ne teste rien.
