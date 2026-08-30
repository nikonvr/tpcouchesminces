# Comparaison des copies produites par trois IA

Confrontation de `REPONSES_CHATGPT.md`, `gemini_pro_results.md` et
`gemini_flash_results.md` au **moteur réel du simulateur**. Chaque valeur
contestée a été recalculée, jamais arbitrée à vue.

Référence : [CORRIGE_REPONSES.md](CORRIGE_REPONSES.md), recalculé de la même façon.

> **Gemini Flash a été rejoué** en simulation Node.js entre-temps. Cette version
> annule et remplace la précédente analyse le concernant : ses mesures sont
> désormais très largement exactes. Ce qui reste faux a changé de nature —
> ce ne sont plus des nombres inventés, mais des **conclusions non révisées**.

---

## Vue d'ensemble

| | ChatGPT | Gemini Pro | **Gemini Flash v2** |
|---|---|---|---|
| Questions traitées | 15 / 32 | 32 / 32 | **32 / 32** |
| Mesures vérifiées justes | quasi toutes | les rares données | **la grande majorité** |
| Erreurs de physique | aucune trouvée | 2 majeures | 2 majeures |
| Contradictions internes | aucune | — | **3** |
| Apports originaux | 1 défaut de l'énoncé | 1 simplification | **3 remarques de fond** |

---

## Ce que Gemini Flash v2 réussit désormais

Après réexécution, ces valeurs coïncident avec les miennes **au centième** :

| Question | Flash v2 | recalculé | |
|---|---|---|---|
| Q22 T_max / λ₁ / λ₂ / FWHM / centre | 98,95 % / 526,24 / 577,32 / 51,08 / 551,78 | idem | **exact** |
| Q23 T̄_pass / T̄_B1 / T̄_B2 / Q_r | 97,88 % / 0,657 % / 1,024 % / 116,5 | idem | **exact** |
| Q23 bande élargie 400–500 | T = 19,72 %, Q_r = 9,4 | idem | **exact** |
| Q21 FWHM m = 2/3/4 | 22,12 / 7,70 / 2,84 nm | 22,12 / 7,71 / 2,85 | **exact** |
| Q29 total / d_max | 1538,0 nm / 115,9 nm | idem | **exact** |
| Q30 demi-largeurs IC | ±7,5 / ±3,4 / ±2,4 pt | idem | **exact** |
| Q19 R_max des 4 miroirs | 94,09 / 97,69 / 99,11 / 99,66 % | 94,12 / 97,71 / 99,11 / 99,66 | **exact** |
| Q5, Q6, Q7, Q9, Q18 | — | — | **exacts** |

C'est un renversement complet par rapport à la première version, où la FWHM de
Q22 était annoncée à 15 nm au lieu de 51.

### Trois apports que je n'avais pas

**1. Pourquoi précisément les couches 16, 17 et 18 ?** *(vérifié, et je l'ajoute
au corrigé.)* Les trois espaceurs `2H` occupent les positions **3, 9 et 15**.
La couche 15 **est** le troisième espaceur ; 16-17-18 = `L H L` se trouvent donc
**entièrement en dehors du dernier résonateur**. Libérer exactement ces trois
couches, c'est régler l'adaptation d'admittance vers l'air **sans toucher à
aucune cavité**. L'énoncé posait cette contrainte sans jamais la justifier.

**2. Cavité simple contre cavités couplées.** Profil lorentzien pointu
(FWHM 2,84 nm à m = 4) contre sommet plat de 51,08 nm à trois cavités —
avec l'analogie des filtres électroniques de Butterworth/Tchebychev. Juste,
et pédagogiquement utile.

**3. Le seuil d_min = 1 nm est numériquement admissible mais physiquement
absurde.** En évaporation PVD, un film continu de ZnS ou YF₃ exige 5 à 10 nm
(croissance en îlots, Volmer-Weber) ; en dessous, on obtient un milieu effectif
rugueux, pas une couche mince optique. **Cette remarque renforce la conclusion
de Q32** : la couche de 2,00 nm que produit BFGS n'est pas une couche.

---

## Ce qui reste faux chez Gemini Flash v2

### Q17 — la seule question manifestement non rejouée

Toujours **z ≈ 72 nm, aiguille de ZnS de 6 nm**. π(z) recalculée :

```
 z (nm)   15     25     45     60     70     75
 π(z)   0,327  0,341  0,221  0,020 −0,139 −0,219
```

Maximum à **z = 25 nm**. À 72 nm, **π est négatif** : c'est l'endroit où le
diagnostic dit *de ne pas insérer*. Et l'aiguille fait **0,1 nm**, valeur
inscrite dans l'énoncé — pas 6 nm.

### Q32 — la conclusion décisive, inchangée et fausse

Annonce : « Adopter Design B, rendement > 90 % à Δd = 2 nm ».
Mesure appariée (N = 1000, graine 42, d_min = 1 nm) :

| | A non optimisé | B après BFGS 16–18 |
|---|---:|---:|
| Q_r nominal | 116,50 | **211,89** |
| T̄_pass | **97,88 %** | 93,67 % |
| Rendement Δd = 2 nm | **99,9 %** [99,4 ; 100,0] | **82,3 %** [79,8 ; 84,5] |
| Rendement Δd = 5 nm | **81,5 %** | 43,3 % |
| d_min | **57,97 nm** | **2,00 nm** |

**B − A = −17,6 points, intervalles disjoints.** B n'atteint pas 90 %, et il est
significativement *pire* que A. Le point 3 de son propre audit (d_min physique
5–10 nm) condamne d'ailleurs la couche à 2,00 nm : Flash tient l'argument mais
n'en tire pas la conclusion.

### Q13 — bon calcul, mauvais point

| | d_ZnS / d_YF₃ | R(550) recalculé |
|---|---|---:|
| Flash v2 | 20 / 121 | **0,27898 %** — annonce 0,2790 %, **exact** |
| vallée réelle voisine | 15,5 / 124,5 | **0,00066 %** |
| Claude | 100,5 / 63 | **0,00056 %** |

Le chiffre annoncé est juste **pour le point choisi**. Mais ce point n'est pas un
minimum : la vallée est 400 fois plus basse, à 4,5 nm de là en d_ZnS. Net
progrès sur la v1 (2,19 %), objectif tout de même manqué.

### Trois contradictions internes

1. **Q12** : « R = 0,0035 % (0,0038 % dans le simulateur). Concordance absolue à
   < 0,0001 % ». Deux valeurs différentes présentées comme concordantes.
   Cause : Y = 0,9882 au lieu de **0,987795**. L'erreur sur Y n'est que de
   0,041 %, mais devient **6,6 % sur R** — près d'un zéro, R dépend
   quadratiquement de l'écart. *Bon sujet de discussion pour Q12.*
2. **Q29** : « d_min = 58,0 nm » puis « (d_min = 55,4 nm ≫ 1 nm) » dans la même
   réponse. La valeur exacte est **57,97 nm**.
3. **Q15** : donne d_ZnS = 20 nm en Q13, puis parle en Q15 de « la couche ZnS
   fine ~30 nm ».

### Autres écarts mesurés

| | annoncé | recalculé |
|---|---|---|
| Q24 T̄_pass après BFGS | « > 95 % » | **93,67 %** |
| Q25 rendement Δd = 2 nm | 90–93 % | 82,3 % (B) ou 99,9 % (A) |
| Q25 rendement Δd = 5 nm | « < 30 % » | **43,3 %** |
| Q15 rendement Δd = 5 nm | « ~65 % » | **81,4 %** (avec son design) |
| Q26 « transmission à zéro » | zéro | **T̄_pass = 93,7 %, sommet 98,95 %** |

Le dernier est le plus gênant : l'audit affirme qu'un biais de +1,45 % « fait
chuter la transmission dans la bande passante cible à zéro ». Le sommet est en
réalité **rigoureusement invariant** (98,95 % pour b de 0 à 5 %) — et c'est
précisément le point de diagnostic de Q26. La bonne intuition, illustrée par
le contraire du bon chiffre.

---

## Ce que ChatGPT a trouvé et que j'avais manqué

> « Limite logicielle constatée : les verrous n'isolent pas une couche dans le
> Monte-Carlo ; isolation obtenue par calcul séparé. »

**Exact, et c'était un défaut de l'énoncé.** Q15 demandait « verrouillez ZnS
(seul YF₃ perturbé) ». Or `runMonteCarloTolerance` perturbe *toutes* les couches
sans consulter `locked` — le verrouillage est réservé à BFGS, par conception
explicite. **La question demandait une manipulation que le simulateur refuse.**

Corrigé FR + EN : sensibilité manuelle (+3 nm sur une couche à la fois), qui
donne le même verdict sur les deux designs testés :

| design | nominal | ZnS +3 nm | YF₃ +3 nm | plus critique |
|---|---:|---:|---:|---|
| 100,5 / 63 nm | 0,2626 % | 0,3975 % (+0,135) | 0,2848 % (+0,022) | **ZnS** |
| 131 / 125 nm | 0,5973 % | 0,8292 % (+0,232) | 0,7205 % (+0,123) | **ZnS** |

### Ses valeurs de Q15, vérifiées

| grandeur | annoncé | recalculé | écart |
|---|---:|---:|---|
| R(550) | 0,00105 % | 0,00105 % | **exact** |
| R̄ 400–750 | 9,490 % | 9,4905 % | **exact** |
| R̄ 520–580 | 0,5879 % | 0,5973 % | 1,6 % |
| rendement Δd = 3 | 95,2 % | 94,2 % | 1,0 pt |
| rendement Δd = 5 | 80,6 % | 78,2 % | 2,4 pt |
| ZnS / YF₃ isolés | ~87 % / ~95 % | 85,6 % / 94,0 % | 1,4 pt |

Aucune erreur de physique, aucune conclusion fausse. Seule faiblesse : la copie
s'arrête à Q15.

ChatGPT est aussi plus précis que mon propre corrigé sur **Q12** : il note que la
diagonale de M₁ n'est pas nulle (−4,38·10⁻⁴) parce que 112,3 nm est un arrondi,
donc φ = 1,57123 et non π/2 exactement.

---

## Gemini Pro

Copie complète mais presque entièrement qualitative. Son raisonnement est
souvent juste (Q11, Q20, Q31), ses rares chiffres ne le sont pas :

- **Q13** : 30 / 120 nm → R = **2,507 %**, soit 4 500 fois au-dessus de la vallée.
- **Q17** : z ≈ 72 nm, où π < 0.
- **Q32** : « adopter B », et « BFGS améliore la tolérance » — l'inverse de la
  mesure (99,9 % → 82,3 %).

À son crédit, comme Flash : **Q6 sous la forme R_tot = 2R/(1+R)**, vérifiée
**rigoureusement identique** à la somme incohérente de l'énoncé (écart nul) et
bien plus courte. Ajoutée à l'énoncé dans les deux langues.

---

## Conséquences pour l'énoncé et le corrigé

| # | Origine | Action |
|---|---|---|
| 1 | ChatGPT | **Q15** : isolation par verrouillage impossible → sensibilité manuelle *(fait, FR + EN)* |
| 2 | Gemini Pro + Flash | **Q6** : ajout de la forme $2R/(1+R)$ *(fait, FR + EN)* |
| 3 | Gemini Flash v2 | **Q24** : justifier le choix des couches 16–18 par la position des espaceurs *(fait, corrigé)* |
| 4 | Gemini Flash v2 | **Q29** : le seuil d_min physique en PVD est 5–10 nm, pas 1 nm *(fait, corrigé)* |

---

## Ce que ce test dit du TP

Les questions où les trois copies convergent sont les questions de cours
(Q1–Q9, Q31). Celles qui les séparent restent, après réexécution de Flash,
exactement les mêmes : **Q13** (chercher un minimum, pas un point), **Q17**
(lire un diagnostic avant d'agir), **Q32** (ne pas confondre gain nominal et
robustesse).

Le cas de Gemini Flash est le plus instructif : **disposer des bons chiffres n'a
pas suffi**. Il mesure correctement Q_r = 116,5 → 211,9, et conclut quand même
« adopter B », sans regarder le rendement. C'est précisément la faute que Q32 est
conçue pour provoquer — et la preuve que l'exercice ne récompense pas le calcul
seul, mais la décision argumentée.
