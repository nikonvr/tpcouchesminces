# Corrigé — réponses succinctes

**Usage enseignant.** Style télégraphique, résultats seuls, sans rédaction.
Toutes les valeurs numériques ont été recalculées avec le moteur du simulateur
(`tests/lib/extraction.js`), pas recopiées.

**Conditions communes** — substrat BK7, superstrat air, incidence normale,
λ₀ = 550 nm, sauf mention contraire. H = ZnS, L = YF₃.

**Repères** : n_H(550) = 2,3720 · n_L(550) = 1,4690 · n_BK7(550) = 1,51852.

> Les questions ★★★ appellent un raisonnement : la ligne « attendu » donne le
> point d'arrivée, pas la démonstration.

---

## Exercice I — Les matériaux couches minces

### Q1 ★☆☆ — Nature physique des matériaux, paramètre de l'opacité
- **Si, Ge** : semi-conducteurs — absorption qui s'effondre au-delà du gap.
- **SiO₂** : diélectrique transparent, k = 0 sur tout le visible.
- **Al, Au** : métaux — k élevé partout, dû aux porteurs libres.
- **Opacité dictée par k** (partie imaginaire). n ne gouverne que la réfraction
  et la réflexion, jamais l'atténuation.

### Q2 ★★☆ — Classement par k croissant
Valeurs relevées (simulateur) :

| Matériau | k(400 nm) | k(550 nm) | k(750 nm) |
|---|---:|---:|---:|
| SiO₂ | 0 | 0 | 0 |
| YF₃ | 0 | 0 | 0 |
| ZnS | 0,0066 | 0 | 0 |
| Si | 0,380 | 0,040 | 0,0063 |
| Au | 1,96 | 2,72 | 4,63 |
| Al | 4,86 | 6,82 | 8,39 |

- **À 550 nm** : SiO₂ = YF₃ = ZnS (0) < Si (0,04) < Au (2,72) < Al (6,82).
- **À 400 nm** : SiO₂ = YF₃ (0) < ZnS (0,0066) < Si (0,38) < Au (1,96) < Al (4,86).
- **Changement de rang** : ZnS quitte le groupe des transparents ; Au et Al
  s'inversent selon λ (Au monte avec λ, Al aussi, mais Al reste au-dessus).
- **k < 5·10⁻⁴ sur toute la bande** : SiO₂ et YF₃ **seulement**. ZnS échoue
  sous ~470 nm (k = 0,0066 à 400 nm).
- **Piège** : mesurer à une seule λ classe ZnS parmi les transparents — faux.
- **k = 0 affiché** : convention du modèle (table tronquée), pas une mesure.
  Aucun matériau réel n'a k rigoureusement nul.

### Q3 ★★☆ — Métaux contre semi-conducteurs
- **Métaux** (Al, Au) : k ~ 2 à 8, **croissant avec λ**. Porteurs libres,
  pas de gap → absorption à toute énergie, modèle de Drude.
- **Semi-conducteurs** (Si, Ge) : k chute quand λ croît (Si : 0,38 → 0,0063 de
  400 à 750 nm). Absorption seulement au-dessus du gap E_g ; en dessous, le
  matériau devient transparent.
- **Ordre de grandeur** : 2 à 3 décades d'écart dans le rouge.

### Q4 ★☆☆ — Contraste d'indice ZnS/YF₃
- n_H = **2,3720**, n_L = **1,4690** (550 nm).
- Contraste (n_H − n_L)/(n_H + n_L) = **0,23510**.
- Largeur de bande d'arrêt prédite Δλ = (4λ₀/π)·arcsin(0,2351) = **166,2 nm**.
- À conserver : borne l'exercice VI et le placement des bandes en VIII.

---

## Exercice II — Une interface simple : BK7 // Air

### Q5 ★☆☆ — Fresnel à incidence normale
- r = (1 − 1,51852)/(1 + 1,51852) = −0,20588
- **R = |r|² = 4,2388 %** · **T = 95,7612 %**
- Contrôle : R + T = 1 (aucune absorption).

### Q6 ★★☆ — Face arrière
- Une face : **4,2388 %**. Deux faces : **8,1329 %**.
- Formule incohérente R_tot = R + (1−R)²R/(1−R²) → 8,1329 % ✔ (accord exact).
- **Pas 2R = 8,478 %** : la seconde interface ne reçoit que (1−R) du flux, et
  les réflexions multiples se somment en intensité, pas en amplitude.
- *Rappel* : l'option n'agit que sur la lame nue ; dès qu'une couche existe,
  les deux dioptres ne sont plus identiques et le modèle ne s'applique plus.

### Q7 ★☆☆ — R(θ) à 550 nm

| θ (°) | R_s (%) | R_p (%) | R non polarisé (%) |
|---:|---:|---:|---:|
| 0 | 4,239 | 4,239 | 4,239 |
| 10 | 4,412 | 4,068 | 4,240 |
| 20 | 4,979 | 3,553 | 4,266 |
| 30 | 6,096 | 2,694 | 4,395 |
| 40 | 8,104 | 1,546 | 4,825 |
| 50 | 11,700 | 0,375 | 6,038 |
| 56,6 | 15,580 | **0,000** | 7,790 |
| 60 | 18,293 | 0,155 | 9,224 |
| 70 | 30,729 | 4,161 | 17,445 |
| 80 | 54,580 | 23,564 | 39,072 |

- R_s croît de façon monotone ; R_p s'annule puis remonte ; le non polarisé ne
  descend jamais à zéro (moitié de R_s au minimum).

### Q8 ★☆☆ — Angle de Brewster
- θ_B = arctan(1,51852) = **56,634°** ; R_p(θ_B) = 0 ; R_s(θ_B) = 15,58 %.
- **Application** : lunettes / filtres polarisants — suppriment le reflet d'une
  vitre ou de l'eau, qui est polarisé s au voisinage de θ_B. Fenêtres de Brewster
  des lasers.

### Q9 ★☆☆ — Réflexion totale interne
- Superstrat BK7, substrat air : θ_lim = arcsin(1/1,51852) = **41,188°**.
- Au-delà : R_s = R_p = 1 exactement, T = 0.
- Snell : n₁ sin θ₁ = n₂ sin θ₂ n'a plus de solution réelle pour sin θ₁ > n₂/n₁.
- **Fibres optiques** : guidage par réflexion totale cœur/gaine.

---

## Exercice III — Monocouche antireflet

### Q10 ★★☆ — Antireflet quart d'onde et piège de l'indice
- Épaisseur fournie **112,27 nm** = λ₀/(4·1,22474) ✔ (énoncé : 112,3 nm).
- Indice fourni 1,22474 = √1,50 — mais n_BK7(550) = **1,51852**.
- **Indice idéal** = √1,51852 = **1,23228** → d idéal = **111,58 nm**.
- **R résiduel à 550 nm = 0,00377 %** — faible, mais **non nul**.
- Plage R < 0,5 % : **452,7 – 705,5 nm** (largeur 252,8 nm).
- **Conclusion** : « antireflet parfait » n'est licite qu'à une seule λ et pour
  n = √(n₀·n_s) exactement. Ici les deux conditions sont approchées.

### Q11 ★★☆ — La dispersion du substrat compte-t-elle ?
- n_BK7 : 1,5302 (400 nm) · 1,51852 (550) · 1,51050 (750) → variation 1,3 %.
- Minimum de R : **550,30 nm** (BK7 dispersif) contre **550,00 nm** (n constant)
  → écart **0,30 nm**, effectivement négligeable.
- Plage R < 0,5 % : 452,7–705,5 nm contre 451,6–703,3 nm → ~1 à 2 nm d'écart.
- Profondeur du minimum : 0,00377 % contre 0,00376 % — quasi identique ici car
  n_c = 1,22474 ≈ √n_s dans les deux cas.
- **Explication** : la position du minimum dépend de la condition de **phase**
  n_c·d = λ/4, qui ne fait intervenir que la couche (non dispersive). Le
  substrat n'intervient que dans la condition d'**amplitude** n_c = √n_s, donc
  sur la profondeur, pas sur la longueur d'onde.
- **Deux cas où la dispersion devient visible** : (i) exercice I — k(λ) de ZnS
  dans le bleu ; (ii) exercice VI — les bornes de la bande d'arrêt du miroir.

### Q12 ★★★ — Matrice de la couche sous Excel
- φ₁ = 2π·112,27·1,22474/550 = **1,5708 rad = π/2** (quart d'onde exact).
- M₁ = [[cos φ, i sin φ/η₁], [i η₁ sin φ, cos φ]] avec η₁ = 1,22474
  → **[[0, 0,81650 i], [1,22474 i, 0]]**.
- B = m₀₀ + η_s m₀₁ = i·η_s/η₁ ; C = m₁₀ + η_s m₁₁ = i·η₁ (η_s = 1,51852).
- **Y = C/B = η₁²/η_s = 1,50000/1,51852 = 0,98780**.
- R = |(η₀ − Y)/(η₀ + Y)|² = (0,012197/1,987804)² = **3,765·10⁻⁵ = 0,00377 %**
  — identique au simulateur (écart < 0,001 point).
- *La quadrature φ = π/2 annule la diagonale : c'est ce qui rend le calcul
  faisable à la main et rend visible la condition d'amplitude η₁² = η₀·η_s.*
- **Contrôles d'erreur** : R < 0 ou R > 1 → module au carré ; écart ~1 % → signe
  du i dans les termes non diagonaux.

---

## Exercice IV — Antireflet bicouche BK7 / H / L / Air

### Q13 ★☆☆ — Minimisation manuelle de R à 550 nm
- **Optimum : d_ZnS ≈ 100,5 nm, d_YF₃ ≈ 63 nm → R = 0,0006 %** (quasi nul).
- Autre vallée équivalente vers d_ZnS ≈ 140, d_YF₃ ≈ 120 nm (R ≈ 0,9 %).
- Nombre d'essais : propre à l'étudiant ; sert de point de comparaison en Q16.

### Q14 ★★☆ — Cartographie R(d₁, d₂) à 550 nm
Carte au pas de 20 nm, R en % :

| d_ZnS \ d_YF₃ | 80 | 100 | 120 | 140 | 160 |
|---:|---:|---:|---:|---:|---:|
| **60** | 8,40 | 7,55 | 13,73 | 22,52 | 29,53 |
| **80** | 3,73 | 7,61 | 15,25 | 22,41 | 26,58 |
| **100** | 1,26 | 5,17 | 9,73 | 13,00 | 13,89 |
| **120** | 3,97 | 2,70 | 1,93 | 2,03 | 2,96 |
| **140** | 8,61 | 2,96 | **0,92** | 3,83 | 9,82 |

- **Deux vallées** distinctes : l'une vers (100, 80), l'autre vers (140, 120).
- La grille à 20 nm **ne voit pas** le vrai minimum (100,5 ; 63) : il tombe hors
  de la fenêtre en d_YF₃ et entre deux nœuds. C'est le point de la question —
  un pas trop large masque le paysage.

### Q15 ★★★ — Première qualification robuste
- **Piège de spécification** : sur 400–750 nm, R moyen du bicouche ≈ 11 % —
  bien pire que le verre nu (4,24 %). Le design n'est pas mauvais, la
  **fenêtre est hors sujet** : un antireflet à 550 nm doit se juger à 550 nm.
- Après recentrage sur 520–580 nm : R moyen nominal = **0,2626 %** (design Q13),
  marge confortable sous le seuil de 0,8 %.
- Qualification (graine 42, N = 500, d_min = 1 nm, seuil 0,8 %) :

| Δd | rendement | IC95 % Wilson | P95(R moyen) |
|---:|---:|---|---:|
| 3 nm | 100,0 % | [99,2 ; 100,0] | 0,395 % |
| 5 nm | 98,8 % | [97,4 ; 99,4] | 0,630 % |

- **Les deux intervalles se recouvrent** → on ne peut pas affirmer que ±5 nm est
  significativement pire. C'est du bruit d'échantillonnage, pas une différence.
- **Couche critique** : ZnS seul perturbé → 99,2 % ; YF₃ seul → 100,0 %. **ZnS
  domine** : indice plus élevé, donc plus grande variation d'épaisseur optique
  n·d pour la même erreur physique.
- ⚠ **Avec un design bien optimisé, le seuil de 0,8 % ne discrimine pas** :
  resserrer à 0,3 % donne 62,4 % (Δd = 3) contre 28,6 % (Δd = 5), et l'épreuve
  redevient parlante.

---

## Exercice V — Synthèse multicouche & méthode de l'aiguille

### Q16 ★★☆ — Convergence locale de BFGS (mérite R moyen 400–750 nm)
- **Verre nu : R moyen = 4,2406 %** — la référence.
- **H L en quarts d'onde bruts : 11,22 %** — deux à trois fois PIRE que le verre
  nu. Une couche quart d'onde de haut indice sur du verre est un **réflecteur**,
  pas un antireflet : elle ajoute une interférence constructive.
- H L H L en quarts d'onde bruts : **38,61 %** (c'est un miroir de Bragg naissant).
- **Un antireflet n'est donc pas un empilement quart d'onde.**
- Après optimisation depuis des couches fines et dissymétriques :

| couches | R moyen optimisé | épaisseurs |
|---:|---:|---|
| 2 | 2,044 % | H 8,7 / L 118,0 nm |
| 3 | 2,176 % | H 8,7 / L 109,4 / H 2,0 nm |
| 4 | **0,862 %** | H 16,2 / L 45,2 / H 22,8 / L 108,8 nm |

- **Seuil de 0,5 % non franchi** même à 4 couches avec ce seul couple ZnS/YF₃ :
  n_L = 1,469 est trop élevé pour un antireflet large bande sur BK7 (il faudrait
  n ≈ 1,23, cf. Q10). C'est une limite de matériaux, pas d'algorithme.
- Le cas à 3 couches est **pire** que celui à 2 : la 3ᵉ couche tombe à 2,0 nm,
  signe que la structure est mal posée. Illustration directe du caractère local.

### Q17 ★★★ — Méthode de l'aiguille
- Départ : YF₃ 150 nm sur BK7 → **mérite initial R moyen = 3,7217 %**.
- Balayage π(z) tous les 5 nm, aiguille δ = 0,1 nm :
  **maximum à z = 25 nm depuis le substrat, matériau ZnS, π ≈ 0,341 %/nm**.
- Découpage annoncé : **24,95 / 0,10 / 124,95 nm**.
- Après insertion + BFGS automatique, le mérite descend nettement (≈ 2 %).
- **Démarche en deux temps** : π(z) est un diagnostic de *nucléation* — il dit
  où une couche nouvelle ferait baisser le coût, ce que BFGS ne peut pas
  trouver seul puisqu'il travaille à structure constante. Le raffinement local
  qui suit exploite la dimension nouvellement créée.
- **Trois limites** : (a) pas de 5 nm — un optimum à 2,5 nm d'un point testé est
  manqué ; (b) les interfaces ne sont jamais évaluées, alors que l'optimum réel
  s'y trouve souvent (π y est singulier) ; (c) δ = 0,1 nm fini — π est une
  différence finie, pas une dérivée.

---

## Exercice VI — Miroir de Bragg

### Q18 ★★☆ — (HL)³H : bande d'arrêt mesurée contre formule
- **R_max = 94,123 %** · bande R ≥ 90 % : **495,5 – 606,7 nm** · largeur
  **111,3 nm**.
- Formule de Q4 : 166,2 nm → **écart −33,0 %**, soit bien « de l'ordre du tiers ».
- **Ce n'est pas une erreur de mesure** : R_max = 94,1 % frôle le seuil de 90 %.
  La courbe ne dépasse 90 % que sur une portion étroite de la bande réelle. La
  largeur *mesurée à 90 %* n'est pas la largeur de la bande d'arrêt.
- **Hypothèse à formuler** : plus R_max s'élève au-dessus du seuil, plus la
  largeur mesurée doit se rapprocher de la valeur théorique. Testé en Q19.

### Q19 ★★☆ — Saturation avec le nombre de périodes

| miroir | couches | R_max | bande R ≥ 90 % | largeur | écart / formule (166,2 nm) |
|---|---:|---:|---|---:|---:|
| (HL)³H | 7 | 94,123 % | 495,5 – 606,7 nm | 111,3 nm | −33,0 % |
| (HL)⁴H | 9 | 97,705 % | 482,6 – 631,4 nm | 148,8 nm | −10,4 % |
| (HL)⁵H | 11 | 99,114 % | 478,9 – 639,7 nm | 160,8 nm | −3,2 % |
| (HL)⁶H | 13 | 99,659 % | 477,7 – 642,9 nm | 165,2 nm | −0,6 % |

- **Les deux grandeurs saturent, mais pas de la même façon** : R_max tend vers
  100 % par valeurs très rapprochées (94,1 → 99,7 %), la largeur tend vers
  **166,2 nm** — exactement la formule de Q4.
- **Hypothèse de Q18 confirmée.**
- **La formule ne décrit aucun miroir réel : elle décrit leur limite**, celle
  d'un empilement infini. Un miroir fini est toujours plus étroit à seuil fixé.
- **Approximation acceptable dès 5 périodes** (11 couches, écart 3 %) ;
  excellente à 6 (0,6 %).
- Bornes à retenir pour l'exercice VIII : ≈ **478 – 643 nm**. Les trois bandes du
  cahier des charges (460–500, 535–565, 620–680) y sont bien situées.

### Q20 ★★☆ — Couches extrêmes : un arbitrage, pas un gain

| couches 1 et 13 | R_max dans la bande | lobe bleu (360–450) | lobe rouge (660–800) |
|---|---:|---:|---:|
| 1,0 QWOT (référence) | 99,659 % | 47,79 % | 59,15 % |
| 0,5 QWOT | 99,335 % | **76,74 %** | **23,24 %** |
| 1,3 QWOT | 99,551 % | **20,67 %** | **80,97 %** |

- Les ondulations ne sont pas supprimées : elles sont **transférées** d'un côté
  de la bande à l'autre. Amincir nettoie le rouge et dégrade le bleu ;
  épaissir fait l'inverse.
- **R_max varie à peine** (99,3 à 99,7 %) : ce n'est pas un gain de performance.
- **Adaptation d'admittance** : la couche extrême ajuste l'admittance vue depuis
  l'air. Elle ne peut l'adapter que d'un côté du spectre à la fois.
- **Exemple** : miroir de cavité laser — on nettoie le côté où se trouve la
  longueur d'onde de pompe ou d'émission parasite à rejeter.

---

## Exercice VII — Filtre passe-bande interférentiel

### Q21 ★★☆ — Cavités : nombre de périodes contre ordre

| formule | couches | T_max | FWHM | λ/Δλ |
|---|---:|---:|---:|---:|
| (HL)² 2H (LH)² | 9 | 95,76 % | 22,12 nm | 25 |
| (HL)³ 2H (LH)³ | 13 | 95,76 % | 7,71 nm | 71 |
| (HL)⁴ 2H (LH)⁴ | 17 | 95,76 % | 2,85 nm | 193 |
| (HL)³ 4H (LH)³ (q = 2) | 13 | 95,76 % | 5,42 nm | 101 |
| (HL)³ 6H (LH)³ (q = 3) | 13 | 95,76 % | 4,18 nm | 131 |

- **n agit beaucoup plus fort que q.** Passer de n = 2 à n = 4 divise la FWHM
  par 7,8 (22,1 → 2,85 nm) ; passer de q = 1 à q = 3 ne la divise que par 1,8
  (7,71 → 4,18 nm) à n = 3 constant.
- Loi approchée : FWHM ∝ (n_L/n_H)^{2n} / q. Le nombre de périodes intervient de
  façon **exponentielle**, l'ordre de cavité seulement de façon **inverse**.
- T_max est identique (95,76 %) partout : il ne dépend que de l'adaptation aux
  milieux extérieurs, pas de la finesse.
- **Contrepartie de q** : des ordres parasites apparaissent dans la bande d'arrêt.

### Q22 ★★☆ — Mesure manuelle de la prescription Fresnel
- Chargement : BK7 / H L 2H L H L H L 2H L H L H L 2H L H L / Air → **18 couches**.
- **T_max = 98,95 % à 539,62 nm** · mi-hauteur **49,48 %**
- **λ₁ = 526,24 nm · λ₂ = 577,32 nm · FWHM = 51,08 nm**
- **Centre à mi-hauteur = 551,78 nm** ← c'est le repère à conserver.
- Sommet **plat et ondulé** (trois cavités) : 98,94 % à 540 · 96,97 % à 550 ·
  98,88 % à 560. Le maximum global n'est pas au centre, et il peut basculer d'une
  ondulation à l'autre : **ne pas s'en servir pour repérer la bande**.
- **Incertitude de lecture selon le pas** :

| pas | λ₁ | λ₂ | FWHM |
|---:|---:|---:|---:|
| 0,1 nm | 526,24 | 577,32 | 51,08 nm |
| 0,5 nm | 526,5 | 577,0 | 50,5 nm |
| 2 nm | 528,0 | 576,0 | 48,0 nm |

→ un pas de 2 nm sous-estime la largeur de **3 nm (6 %)**.

---

## Exercice VIII — Projet pré-fabrication salle blanche

### Q23 ★★★ — Audit nominal et calcul manuel de Q_r
- **T̄(460–500) = 0,6569 %** (81 points) · **T̄(535–565) = 97,8807 %** (61 points)
  · **T̄(620–680) = 1,0235 %** (121 points)
- **Q_r = 2 × 97,8807 / (0,6569 + 1,0235) = 116,50**
- Effet du pas :

| pas | T̄(460–500) | T̄(535–565) | T̄(620–680) |
|---:|---:|---:|---:|
| 0,1 nm | 0,6523 % | 97,9078 % | 1,0210 % |
| 0,5 nm | 0,6569 % | 97,8807 % | 1,0235 % |
| 2 nm | 0,6745 % | 97,7612 % | 1,0330 % |

→ **la bande la plus sensible est 460–500 nm** (+2,7 % de 0,1 à 2 nm) : c'est là
que le spectre varie le plus vite (flanc de la bande d'arrêt), donc là qu'un pas
grossier fausse le plus la moyenne.
- **Audit nominal** : 18 couches · **2 matériaux** · d_min = **57,97 nm** ·
  d_max = **115,94 nm** · épaisseur totale = **1538,0 nm**.
- **Expérience décisive** — seule la bande de rejet bas change :

| bande de rejet bas | T̄ | Q_r |
|---|---:|---:|
| 400–500 nm | 19,72 % | **9,44** |
| 430–500 nm | 10,92 % | **16,39** |
| 460–500 nm (prescrite) | 0,66 % | **116,50** |

→ **facteur 12 entre la première et la dernière.** Une spécification de
réjection qui ne dit pas ses bandes ne vaut rien : on peut lui faire dire
n'importe quoi. 400–500 déborde en plus de la plage calculée (430–700 nm).

### Q24 ★★★ — Optimisation des couches 16, 17 et 18
- Avant : **Q_r = 116,50 · T̄_pass = 97,88 %** — les deux exigences (30 et 85 %)
  sont **déjà largement satisfaites**. C'est un résultat, pas un échec.
- Épaisseurs 16/17/18 avant : **93,60 / 57,97 / 93,60 nm**.
- Après BFGS (borne basse 2 nm) : **Q_r = 211,89 (+81,9 %) · T̄_pass = 93,67 %**.
- Épaisseurs 16/17/18 après : **93,60 / 57,76 / 2,00 nm**.
- **Seules 16, 17 et 18 bougent** ; les quinze premières sont strictement
  inchangées, l'ordre et le nombre de couches aussi.
- ⚠ **La couche 18 s'écrase sur la borne : 2,00 nm exactement.** L'optimiseur
  a supprimé la dernière couche en pratique. Il gagne 82 % de Q_r en sacrifiant
  4,2 points de T̄_pass et en amenant d_min de 57,97 à **2,00 nm**.
- **Reproductibilité** : deux lancements identiques donnent exactement les mêmes
  épaisseurs — BFGS est déterministe (gradient par différences finies, recherche
  linéaire par bissection, aucun tirage aléatoire).
- **À refuser en l'état** : un score Q_r isolé n'est pas un dossier. Voir Q32.

### Q25 ★★★ — Qualification robuste (design optimisé, N = 1000, d_min = 1 nm)

| Δd | rendement | IC95 % Wilson | P05(Q_r) | P05(T̄_pass) | fabricabilité |
|---:|---:|---|---:|---:|---:|
| 1 nm | 96,9 % | [95,6 ; 97,8] | 208,5 | 92,64 % | 96,9 % |
| 2 nm | 82,3 % | [79,8 ; 84,5] | 199,1 | 89,68 % | 82,6 % |
| 5 nm | 43,3 % | [40,3 ; 46,4] | 145,7 | 72,70 % | 62,1 % |

- **La fabricabilité s'effondre en même temps que le rendement** : c'est la
  couche à 2,00 nm qui passe sous d_min = 1 nm dès que Δd grandit. À Δd = 5 nm,
  38 % des tirages ne sont **même pas déposables**.
- Le facteur limitant est **T̄_pass**, pas Q_r : P05(Q_r) reste à 146 pour un
  seuil de 30, alors que P05(T̄_pass) tombe à 72,7 % pour un seuil de 85 %.
- **Δd maximal admissible** : pour un rendement exigé de 90 %, l'interpolation
  entre 1 nm (96,9 %) et 2 nm (82,3 %) donne **Δd ≈ 1,4 nm**. Borne basse d'IC à
  prendre en compte → exiger **Δd ≤ 1,2 nm** pour être défendable.
- σ = Δd/2 : **Δd n'est pas une borne dure**, 5 % des erreurs la dépassent.

---

## Exercice IX — Rétro-ingénierie & diagnostic

### Q26 ★★★ — Diagnostic de la fenêtre décalée
- Référence : centre à mi-hauteur nominal **551,78 nm** (Q22).
- **(a) Erreur uniforme** — toutes les épaisseurs × (1 + b) :

| b | centre | décalage | T_max | T̄(535–565) | FWHM |
|---:|---:|---:|---:|---:|---:|
| +0,5 % | 554,30 | +2,52 nm | 98,95 % | 97,34 % | 51,44 nm |
| +1,0 % | 556,82 | +5,04 nm | 98,95 % | 95,91 % | 51,80 nm |
| **+1,59 %** | **559,78** | **+8,00 nm** | **98,95 %** | **92,86 %** | 52,24 nm |
| +2,0 % | 561,85 | +10,07 nm | 98,95 % | 89,82 % | 52,54 nm |

- **Réponse : b = +1,59 % reproduit exactement les 8 nm observés.**
  Sur la couche la plus épaisse (115,94 nm) : **+1,84 nm**.
- **Point clé, à faire trouver** : le sommet **T_max reste rigoureusement à
  98,95 %** pour b de 0 à 5 %. Une erreur uniforme est une **homothétie** : elle
  translate le spectre sans le déformer. La « perte de transmission » mesurée
  vient de ce que la **bande de mesure 535–565 nm est fixe** et ne suit pas la
  fenêtre : −5,0 points sans qu'aucune couche n'absorbe davantage.
- **(b) Espaceur seul (couche 9)** : +5 % → décalage +6,95 nm mais
  T̄_pass s'effondre à **81,8 %** (−16 pt) et la fenêtre se déforme. Décalage et
  dégradation vont ensemble → **ce n'est pas la signature observée**.
- **(c) Couche de miroir seule (couche 5)** : +20 % → décalage de **3,60 nm
  seulement**, T̄_pass 95,3 %. Une couche de miroir déplace très peu la fenêtre.
- **Verdict : c'est (a)**, l'erreur uniforme, qui produit un décalage global avec
  la plus faible déformation.
- **Comparaison à Q25** : +1,84 nm sur la couche la plus épaisse est du même
  ordre que Δd = 2 nm. Mais le modèle de Q25 est **centré** (moyenne nulle) et
  **indépendant couche à couche** : il ne contient aucun biais commun. Sur 60
  tirages à Δd = 2 nm, le décalage médian du centre est de **−0,05 nm** et le
  maximum de 2,65 nm — **jamais 8 nm**. Le modèle gaussien indépendant ne peut
  donc pas couvrir ce défaut : il faudrait un terme de biais systématique
  (erreur de calibration du moniteur quartz, facteur d'outillage).
- **Pourquoi la perte de transmission ne désigne pas une couche** : toutes les
  couches contribuent au même dénominateur ; une baisse de T peut venir d'un
  désaccord de cavité, d'une erreur d'indice, de rugosité ou d'absorption. Le
  spectre complet (position **et** forme) est nécessaire, pas un seul nombre.

### Q27 ★★★ — Bilan métrologique et traçabilité
- Relier Δd à la dispersion observée : σ = Δd/2 par couche → dispersion du
  centre ≈ ±2,3 nm à Δd = 2 nm (P95), et perte de T̄_pass jusqu'à 7 points.
- **Tolérance à formuler depuis les centiles**, pas depuis le nominal :
  exiger P05(T̄_pass) ≥ 85 % impose Δd ≤ ≈ 1,5 nm.
- **Données procédé manquantes, à exiger avant tout réglage chiffré** :
  facteur d'outillage · densité du matériau · Z-ratio · stabilité du taux de
  dépôt · historique de calibration · validation matériau par matériau.
- **Conclusion obligatoire** : aucune consigne instrumentale ne peut être émise
  sans ces six données. Le simulateur ne modélise ni la géométrie de la chambre,
  ni la dérive du quartz.

---

## Exercice X — Revue de conception

### Q28 ★★☆ — Contrat de qualification
- À écrire **avant tout calcul** : fenêtre · incidence · polarisation · métrique
  · bandes exactes · grille · tolérances d'acceptation · d_min · Δd · rendement
  exigé.
- Distinguer **exigences** (contractuelles, qui décident du verdict) et
  **objectifs** (souhaitables, sans effet sur la qualification).

### Q29 ★★☆ — Audit de fabricabilité nominale
- Prescription nominale : 18 couches · 2 matériaux · d_min **57,97 nm** ·
  d_max **115,94 nm** · total **1538,0 nm**.
- **Le garde-fou d_min = 1 nm est inactif au nominal** : la couche la plus fine
  est 58 fois plus épaisse.
- **Il redevient contraignant dès que l'optimiseur travaille** : en Q24, BFGS
  amène la couche 18 à 2,00 nm, et le Monte-Carlo de Q25 la fait passer sous
  1 nm dans 37 % des tirages à Δd = 5 nm. Un garde-fou ne sert pas au nominal :
  il sert après optimisation et sous perturbation.

### Q30 ★★☆ — Convergence statistique (Δd = 2 nm, graine figée)

| N | rendement | IC95 % | largeur |
|---:|---:|---|---:|
| 100 | 82,0 % | [73,3 ; 88,3] | 14,97 pt |
| 500 | 82,0 % | [78,4 ; 85,1] | 6,73 pt |
| 1000 | 82,3 % | [79,8 ; 84,5] | 4,73 pt |

- **Rapport 100 → 1000 : 14,97/4,73 = 3,16 = √10** ✔ loi en 1/√N confirmée.
- 100 tirages donnent le bon rendement mais un intervalle de **15 points** :
  suffisant pour explorer, incapable de trancher contre une exigence à 80 %.

### Q31 ★★★ — Pourquoi trois verdicts
- À N = 1000, Δd = 2 nm : **p̂ = 82,3 %**, IC95 = **[79,8 ; 84,5] %**.
- Exigence à **75 %** (< p_inf) → **QUALIFIÉ** : même le pire cas plausible passe.
- Exigence à **81 %** (entre p_inf et p̂) → **INCONCLUSIF** : l'estimation passe,
  mais l'incertitude d'échantillonnage ne permet pas de l'affirmer.
- Exigence à **90 %** (> p_sup) → **NON QUALIFIÉ**.
- **Un design dont l'estimation ponctuelle dépasse l'exigence peut rester
  inconclusif** parce qu'un rendement est une estimation, pas une mesure :
  l'intervalle matérialise ce qui reste inconnu.
- **Lever le verdict** : augmenter N resserre l'intervalle en 1/√N — mais si le
  vrai rendement est proche de l'exigence, aucun N fini ne garantit de trancher.
  La vraie sortie est d'**améliorer la marge** (design ou procédé), pas
  d'accumuler des tirages.

### Q32 ★★★ — Revue A/B de la prescription fabriquée
Mêmes bandes, seuils, d_min = 1 nm, Δd = 2 nm, N = 1000, graine 42.

| | A — non optimisée | B — BFGS sur 16–18 |
|---|---:|---:|
| Q_r nominal | 116,50 | **211,89** (+81,9 %) |
| T̄_pass nominal | **97,88 %** | 93,67 % (−4,2 pt) |
| Rendement | **99,9 %** | 82,3 % |
| IC95 % | [99,4 ; 100,0] | [79,8 ; 84,5] |
| P05(Q_r) | 109,3 | **199,1** |
| P05(T̄_pass) | **93,71 %** | 89,68 % |
| d_min | **57,97 nm** | 2,00 nm |
| Épaisseur totale | 1538,0 nm | 1446,2 nm |
| Architecture 18 couches | conservée | conservée |

- **Différence appariée de rendement B − A = −17,6 points**, intervalles
  disjoints → la dégradation est **statistiquement significative**.
- **Indicateurs qui vont dans le même sens** : Q_r nominal et P05(Q_r) montent
  tous deux — B est réellement meilleur sur le critère de réjection.
- **Indicateurs qui révèlent le compromis** : T̄_pass, rendement, P05(T̄_pass) et
  surtout **d_min** se dégradent. B doit son gain à l'effacement de la couche 18
  (93,60 → 2,00 nm), c'est-à-dire à un empilement de fait à 17 couches.
- **Décision : rejeter B en l'état.** Un gain nominal de 82 % payé par 17,6
  points de rendement et une couche posée sur la borne de fabricabilité n'est
  pas défendable. Deux voies : soit relever la borne basse de BFGS bien au-delà
  de 2 nm pour interdire cette solution, soit accepter A, qui satisfait déjà
  largement le cahier des charges avec un rendement de 99,9 %.
- **Deux limites du modèle à citer** : (i) erreurs supposées indépendantes et
  centrées — aucun biais commun, alors que Q26 en met un en évidence ;
  (ii) indices supposés exacts et invariants — ni erreur d'indice, ni rugosité,
  ni inhomogénéité latérale, ni vieillissement.

---

## Atelier libre — niveaux atteignables

Mesures faites avec le simulateur, couple ZnS/YF₃ sur BK7.

### Miroir froid — réfléchir 700–850 nm, transmettre le visible
Empilement (HL)ⁿH à λ₀ = 775 nm :

| n | couches | R min sur 700–850 | T̄ sur 420–650 |
|---:|---:|---:|---:|
| 4 | 9 | 93,18 % | 86,09 % |
| **5** | **11** | **96,20 %** | **86,07 %** |
| 6 | 13 | 97,88 % | 85,25 % |

→ **11 couches** suffisent pour R ≥ 95 % partout sur 700–850 et T̄ ≥ 85 % sur
420–650. Au-delà, R gagne peu et T se dégrade (lobes secondaires).

### Antireflet monochromatique — R < 0,2 % sur 530–570 nm
- 1 couche L en quart d'onde : R = 3,03 % — insuffisant.
- 2 couches optimisées : R moyen **1,42 %**, max 2,81 %.
- 4 couches optimisées : R moyen **0,98 %**.
- → **Le seuil de 0,2 % n'est pas atteignable avec ZnS/YF₃ sur BK7.** n_L = 1,469
  est trop élevé ; il faudrait n ≈ 1,23 (cf. Q10). Résultat à faire découvrir :
  la limite vient des **matériaux**, pas de l'optimiseur.

### Coupe-bande — bloquer 525–545 nm
Empilement (HL)ⁿH à λ₀ = 535 nm, largeur de la zone T < 10 % :

| n | couches | zone T < 10 % | largeur |
|---:|---:|---|---:|
| 4 | 9 | 469 – 614,5 nm | 146 nm |
| 6 | 13 | 464,5 – 625,5 nm | 161 nm |
| 8 | 17 | 464,5 – 626,5 nm | 162 nm |

→ **La largeur ne descend pas** : elle est bornée par le contraste d'indice
(166 nm, formule de Q4). **Un notch de 20 nm est hors de portée du couple
ZnS/YF₃.** Ajouter des couches renforce le rejet, jamais ne le resserre.
Transmission hors bande ≈ 63–69 % seulement, à cause des lobes.

### Séparateur 50/50 sur 450–650 nm
| couches | RMSE(R − 50 %) optimisée | plage de R |
|---:|---:|---|
| 1 | 20,13 pt | 24,9 – 35,8 % |
| **3** | **15,36 pt** | 11,4 – 62,3 % |
| 6 | 17,87 pt | 7,6 – 67,4 % |

→ **RMSE ≈ 15 points au mieux.** Une cible non extrême est **plus dure** qu'une
cible extrême : R = 50 % impose une valeur *précise* sur toute la bande, alors
que R = 0 ou R = 1 est un point stationnaire naturel de l'interférence. Ajouter
des couches n'aide pas ici.
