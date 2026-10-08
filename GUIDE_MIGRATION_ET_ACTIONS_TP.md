# Référentiel maître — TP de simulation de couches minces optiques

**Statut :** version consolidée, seule documentation Markdown de référence  
**Niveau :** BUT 3, Master, école d’ingénieurs  
**Langues :** français et anglais  
**Dernière remise à niveau :** 8 octobre 2026  
**Recette du corpus :** automatisée — `python tests/lancer.py` (voir §13)  

---

## 1. Objet et périmètre

Ce document fixe les choix scientifiques, pédagogiques et fonctionnels du dispositif. Il sert à la préparation enseignante, à la recette du simulateur et à la maintenance des énoncés.

Le corpus actif comprend :

- `simulateur_couches_minces.html` : simulateur TMM autonome et bilingue ;
- `tp_couches_minces_fr.html` et `tp_couches_minces_en.html` : énoncés pédagogiques strictement homologues ;
- `theorie en francais.html` : cours et rappels de théorie ;
- `outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx` : classeur limité aux activités qui exigent réellement Excel ;
- `audit_verification_numerique.py` : recette numérique indépendante ;
- `.sync_offline.py` : génération reproductible du paquet autonome et de son manifeste SHA-256 ;
- `outputs/tp_couches_minces_hors_ligne/` : paquet autonome destiné aux salles sans accès réseau ;
- `index.html` : portail étudiant publié sur <https://tpcouchesminces.vercel.app> ;
- `tests/` : recette automatisée (`python tests/lancer.py`) ;
- `.vercelignore` et `vercel.json` : liste blanche de publication et en-têtes du site.

Aucune variante historique, archive de travail ou rapport intermédiaire n’est conservé dans le corpus actif. **Le dépôt GitHub est public** : le corrigé, les comparaisons et les copies d’IA restent sur le poste de l’enseignant, exclus par `.gitignore` ; les archives de travail sont rangées dans `archives_hors_corpus/`, également ignoré. Ils ne doivent jamais être ajoutés au dépôt, même temporairement : l’historique git les conserverait. En cas de contradiction, les invariants du §2 prévalent.

---

## 2. Invariants non négociables

### 2.1 Optimisation

- Le seul algorithme d’optimisation est **Quasi-Newton BFGS**.
- BFGS est présenté comme une méthode locale, déterministe et dépendante du point de départ.
- L’utilisateur choisit soit **toutes les couches**, soit des **couches spécifiques** explicitement numérotées.
- La borne basse de BFGS est le seuil de nettoyage actif, fixé à **2 nm** pour le projet Fresnel ; l’optimiseur ne peut donc pas créer une couche qu’il déclarerait lui-même non déposable.
- Le nettoyage structurel ne doit jamais altérer l’architecture Fresnel imposée.

### 2.2 Méthode de l’aiguille

- Le logiciel trace numériquement la fonction de sensibilité

$$
\pi(z)=\frac{J_0-J_{\delta}(z)}{\delta}.
$$

- Le balayage est effectué tous les **5 nm** à l’intérieur des couches, sans évaluer les interfaces.
- L’épaisseur de l’aiguille de diagnostic vaut **0,1 nm**.
- L’insertion au maximum positif crée effectivement cette aiguille, puis déclenche immédiatement une étape BFGS.
- Le matériau de l’aiguille peut être choisi explicitement ; le mode automatique propose un matériau différent du matériau local.

### 2.3 Filtre fabriqué à l’Institut Fresnel

La prescription déposée est exactement :

```text
BK7 / H L 2H L H L H L 2H L H L H L 2H L H L / Air
```

Elle comporte **18 couches**, ordonnées du substrat BK7 vers l’air. Lors de l’optimisation pré-fabrication :

- couches 1 à 15 : figées ;
- couches 16, 17 et 18 : seules variables BFGS ;
- nombre, matériaux et ordre des couches : invariants.

La mesure porte sur T dans trois bandes :

| Rôle | Bande | Pas de référence |
|---|---:|---:|
| rejet bas | 460–500 nm | 0,5 nm |
| passante | 535–565 nm | 0,5 nm |
| rejet haut | 620–680 nm | 0,5 nm |

Le facteur dérivé est construit par l’étudiant :

$$
Q_r=\frac{2\,\overline T_{535-565}}
{\overline T_{460-500}+\overline T_{620-680}}.
$$

Le protocole logiciel utilise comme seuils initiaux $Q_r\ge30$ et $\overline T_{pass}\ge85\,\%$. Ce sont des seuils de travail visibles et modifiables, pas des résultats fournis.

### 2.4 Qualification de fabrication

- Modèle pédagogique unique : erreurs gaussiennes indépendantes couche par couche, d’écart-type $\sigma=\Delta d/2$.
- Toutes les couches déposées sont perturbées, y compris celles figées pendant BFGS.
- Valeurs de sévérité exigées pour le filtre Fresnel : $\Delta d=1$, 2 et 5 nm.
- La graine est fixe pour la reproductibilité et la comparaison appariée A/B.
- $N=100$ sert à contrôler et explorer ; $N=1000$ sert à décider.
- Les résultats obligatoires sont le rendement, son IC95 % de Wilson, le taux de fabricabilité et les centiles défavorables.
- Le modèle ne couvre pas un biais commun, une erreur d’indice, la rugosité, une dérive corrélée, la quantification du quartz, l’inhomogénéité latérale ni le vieillissement.

### 2.5 Périmètre resserré

Les extensions sans lien direct avec la prescription déposée ont été retirées. Le parcours reste centré sur les couches minces diélectriques, BFGS, la méthode de l'aiguille, la robustesse et le dépôt Fresnel.

---

## 3. Intentions pédagogiques

Le TP doit faire passer l’étudiant de la lecture d’un spectre à une décision de fabrication défendable. Le fil conducteur est :

```text
modèle physique → mesure → spécification → optimisation locale
→ perturbation structurelle → audit nominal → qualification statistique
→ comparaison appariée → décision de dépôt
```

Trois principes structurent l’apprentissage :

1. **Pas de cible pré-mâchée.** L’étudiant traduit le cahier des charges en bandes, grandeurs, cibles et poids.
2. **Pas de résultat attendu dévoilé.** Les graphes de principe expliquent une méthode ; ils ne livrent ni le spectre final, ni le rendement, ni le verdict.
3. **Pas de performance sans fabricabilité.** Tout gain nominal est confronté à l’architecture, à $d_{min}$, aux incertitudes et à un intervalle de confiance.

---

## 4. Parcours pédagogique et accès direct

Les durées sont indicatives. Chaque exercice liste ses prérequis afin qu’un étudiant en autoapprentissage puisse en omettre certains sans perdre les dépendances essentielles.

| Exercice | Questions | Objet principal | Durée indicative | Prérequis indispensables |
|---|---:|---|---:|---|
| I | Q1–Q4 | matériaux, dispersion, absorption | 35 min | nombres complexes, indice optique |
| II | Q5–Q9 | dioptre, Brewster, réflexion totale, S/P | 50 min | I, lois de Fresnel |
| III | Q10–Q12 | monocouche antireflet et matrice Excel | 60 min | I, phase optique, produit matriciel |
| IV | Q13–Q15 | antireflet multicouche, carte 2D, Monte-Carlo | 70 min | III ; statistiques descriptives pour Q15 |
| V | Q16–Q17 | convergence locale BFGS et aiguille | 90 min | III, fonction de mérite, dérivée finie |
| VI | Q18–Q20 | miroirs de Bragg | 55 min | III, QWOT, interférence constructive |
| VII | Q21–Q22 | cavités et prescription Fresnel à 18 couches | 75 min | VI, FWHM, curseur spectral |
| VIII | Q23–Q25 | pré-fabrication, optimisation des trois dernières couches, robustesse | 75 min | VII, moyenne de bande, BFGS, Wilson |
| IX | Q26–Q27 | diagnostic post-dépôt et métrologie quartz | 45 min | VII–VIII, décalage versus déformation |
| X | Q28–Q32 | revue de conception et comparaison A/B | 75 min | une qualification complète, centiles, IC95 % |

L’atelier libre est hors barème. Il impose **Cible libre** et ne propose que les mérites pertinents à ce mode.

---

## 5. Conventions physiques et numériques

### 5.1 Convention d’indice et branche complexe

Le simulateur adopte :

$$
N=n-i\kappa,\qquad \alpha=N_0\sin\theta_0,
\qquad \gamma_j=\sqrt{N_j^2-\alpha^2}.
$$

La branche de la racine est choisie pour assurer la décroissance physique dans les milieux évanescents ou absorbants.

### 5.2 Admittances

$$
\eta_j^{(S)}=\gamma_j,
\qquad
\eta_j^{(P)}=\frac{N_j^2}{\gamma_j}.
$$

Pour une couche $j$ d’épaisseur $d_j$ :

$$
\phi_j=\frac{2\pi d_j}{\lambda}\gamma_j,
\qquad
M_j=
\begin{pmatrix}
\cos\phi_j & i\sin\phi_j/\eta_j\\
i\eta_j\sin\phi_j & \cos\phi_j
\end{pmatrix}.
$$

Le produit est réalisé dans l’ordre du tableau, du substrat vers le superstrat. Les tests de recette doivent vérifier $R+T+A=1$ à la précision numérique.

### 5.3 Mesure et mérite

L’**analyseur de bandes spectrales** est volontairement un instrument de mesure. Chaque ligne ne contient que : bornes, pas, grandeur R/T/A et moyenne obtenue. Il ne connaît ni « passante », ni « rejet », ni numérateur, ni dénominateur.

Le **mérite** appartient au panneau d’optimisation. Les valeurs disponibles dépendent de l’exercice sélectionné :

- antireflet : moyenne de R ;
- projet Fresnel : $Q_r$ ;
- design libre et exercices à cible construite : RMSE de la cible libre.

En mode libre, la cible est vide au démarrage. L’étudiant ajoute les segments et fixe pour chacun la fenêtre, R/T/A, l’incidence, la polarisation, la valeur cible et le poids.

---

## 6. BFGS et sélection des variables

BFGS minimise une fonction $J(\mathbf d)$ des épaisseurs autorisées. Le gradient est estimé numériquement ; une recherche arrière n’accepte qu’un pas qui diminue effectivement le coût. La matrice inverse de Hessienne approchée est mise à jour par la formule BFGS lorsque la courbure est exploitable.

L’interface présente deux portées explicites :

- **Toutes les couches** : chaque épaisseur est variable ;
- **Couches spécifiques** : l’utilisateur renseigne une liste telle que `1,3,5-7`. L’interface valide la syntaxe, affiche la liste normalisée et verrouille toutes les autres couches.

Le panneau doit annoncer le nombre et les numéros des variables avant le lancement. Un calcul sans variable est refusé avec un message bilingue.

Pour la prescription Fresnel, le préréglage force `16-18`. Une tentative de libérer une autre couche doit être rendue visible et ne doit jamais se produire silencieusement.

La recherche est bornée entre le seuil de nettoyage actif et 1200 nm. Pour le projet Fresnel, le seuil de 2 nm est saisi avant BFGS et fait partie du dossier de conception. Cette contrainte évite l’ancien optimum artificiel à 0,5 nm, nominalement performant mais incompatible avec la logique de fabricabilité du module.

Limites à enseigner :

- convergence vers un minimum local ;
- sensibilité au point de départ ;
- absence de garantie globale ;
- dépendance au conditionnement et aux échelles ;
- impossibilité de créer une nouvelle couche à structure constante.

---

## 7. Méthode de l’aiguille

Pour chaque position intérieure $z_k$ espacée de 5 nm, le logiciel insère virtuellement une couche de 0,1 nm et recalcule le coût :

$$
\pi(z_k)=\frac{J_0-J_{0,1\,\mathrm{nm}}(z_k)}{0,1\,\mathrm{nm}}.
$$

Une valeur positive signifie une diminution locale du coût. Le graphe doit montrer tous les points testés, le maximum, la couche hôte, le matériau proposé et l’unité de $\pi$.

Le flux d’usage est volontairement court :

```text
Analyser π(z) → vérifier le maximum → Insérer l’aiguille
→ BFGS automatique → contrôler structure, mérite et dmin
```

Le logiciel doit distinguer clairement le diagnostic, qui ne modifie rien, de l’insertion, qui modifie l’empilement. Une sauvegarde de l’état précédent (couches, verrous, portée BFGS) permet l’annulation par le bouton **Annuler l’aiguille / Undo needle**.

L’aiguille de 0,1 nm est plus fine que la borne basse de BFGS : avant l’étape BFGS automatique, l’empilement est explicitement projeté dans les bornes et le message de résultat l’annonce. Après toute renumérotation (insertion, nettoyage), la liste des couches spécifiques est resynchronisée et affichée ; une ancienne liste n’est jamais réappliquée en silence. Avec le préréglage Fresnel, l’insertion est refusée, car elle romprait l’invariant des 18 couches ; l’analyse $\pi(z)$ reste disponible.

Les limites pédagogiques à discuter sont le pas spatial, l’absence d’évaluation aux interfaces, la différence finie à épaisseur non nulle et le caractère local du BFGS qui suit.

---

## 8. Graphes spectraux

Le graphe principal fournit R, T et A ainsi que les courbes S/P aux angles obliques. Il doit permettre :

- un zoom libre horizontal et vertical par sélection ou molette ;
- plusieurs niveaux de zoom successifs ;
- un déplacement dans la zone agrandie ;
- un bouton **Initialiser la vue / Reset view** qui restaure exactement les bornes spectrales et l’échelle 0–100 % calculées à l’ouverture ou après modification de la fenêtre ;
- la conservation du curseur et des infobulles dans la vue zoomée.

Le zoom ne modifie jamais la grille de calcul, les moyennes de bande ni la fonction de mérite : il ne change que l’affichage.

---

## 9. Qualification Monte-Carlo

### 9.1 Modèle

Pour chaque réalisation $r$ et chaque couche déposée $j$ :

$$
d_{j,r}=d_j+\varepsilon_{j,r},
\qquad
\varepsilon_{j,r}\sim\mathcal N(0,(\Delta d/2)^2),
$$

indépendamment d’une couche à l’autre. Environ 95 % des erreurs idéalisées se situent donc dans $\pm\Delta d$, sans que $\Delta d$ soit une borne dure.

### 9.2 Statistiques obligatoires

Avec $x$ réalisations acceptées sur $N$ :

$$
\hat p=\frac{x}{N}.
$$

L’IC95 % de Wilson est :

$$
\frac{\hat p+z^2/(2N)\pm z\sqrt{\hat p(1-\hat p)/N+z^2/(4N^2)}}
{1+z^2/N},\qquad z=1,96.
$$

Le verdict est :

- **qualifié** si la borne basse dépasse le rendement exigé ;
- **non qualifié** si la borne haute reste sous l’exigence ;
- **inconclusif** dans la zone de recouvrement, égalités comprises : 1000 succès sur 1000 face à une exigence de 100 % restent inconclusifs.

Le logiciel rapporte aussi P05 pour les grandeurs à maximiser, P95 pour les grandeurs à minimiser, la moyenne, l’écart-type, le minimum, le maximum et le taux de fabricabilité.

### 9.3 Comparaison A/B

Le comparateur mémorise deux designs quelconques. Pour être valide, une comparaison doit partager : mérite, bandes, grille, incidence, polarisation, $\Delta d$, $N$, graine, $d_{min}$, seuils optiques et rendement exigé. L’appariement tirage par tirage suppose en outre le même nombre de couches ; sinon, le comparateur le signale et ne présente pas la différence comme appariée.

La graine fixe permet une comparaison appariée. Le tableau affiche notamment :

- différences nominales ;
- rendements et IC95 % de chaque design ;
- différence appariée de rendement B−A et intervalle associé ;
- centiles défavorables ;
- épaisseur totale, $d_{min}$, $d_{max}$ et nombre de couches ;
- conservation ou non de l’architecture imposée.

Pour Q32 : A est la prescription Fresnel non optimisée ; B est cette même prescription après BFGS sur 16–18 seulement. Aucun verdict attendu n’est imprimé dans l’énoncé.

---

## 10. Articulation avec la salle blanche

Le lien expérimental est solide seulement si les étudiants apportent un dossier reproductible contenant :

- la formule exacte à 18 couches et l’ordre de dépôt ;
- les 18 épaisseurs finales ;
- la preuve que seules 16–18 ont été optimisées ;
- le spectre nominal et les trois moyennes de T ;
- le calcul manuel de $Q_r$ ;
- l’audit $d_{min}$, $d_{max}$, épaisseur totale et nombre de matériaux ;
- la qualification aux trois sévérités 1, 2 et 5 nm ;
- la graine, $N$, les seuils et les intervalles de confiance ;
- une analyse explicite des limites du modèle.

Après dépôt, un décalage quasi homothétique du spectre oriente vers un biais commun d’épaisseur ; une déformation ou un écrasement oriente plutôt vers des erreurs différentielles, des indices erronés, de la rugosité ou de l’absorption. Le TP ne permet pas d’identifier une couche unique à partir de la seule perte de transmission.

Une recommandation pour le moniteur quartz doit signaler les informations procédé manquantes : facteur d’outillage, densité, Z-ratio, stabilité du taux, historique de calibration et validation matériau par matériau.

---

## 11. Rôle d’Excel

Excel est réservé à deux apprentissages qui justifient un calcul externe :

1. **Q12 — matrice d’une couche.** Construction explicite avec `COMPLEXE()` et `IMPRODUIT()` pour rompre la boîte noire TMM.
2. **Q14 — cartographie $R(d_1,d_2)$.** Grille 5 × 5, $d_{ZnS}$ et $d_{YF_3}$ de 20 à 140 nm au pas de 30 nm, identique dans les deux énoncés et dans le classeur ; lecture des vallées, plateaux et minima locaux.

La cible libre et la RMSE sont construites directement dans le simulateur. Aucun onglet Q29 ou résultat prérempli ne doit subsister dans le classeur.

---

## 12. Exigences bilingues

Tout élément visible doit changer de langue sans rechargement :

- titres de cartes, badges et sous-titres ;
- menus, options, boutons et champs ;
- infobulles, unités et espaces réservés ;
- messages d’erreur, d’avertissement et de succès ;
- libellés des graphes et du curseur ;
- textes BFGS, aiguille, Monte-Carlo et comparateur ;
- listes d’exercices et mérites contextuels ;
- contenus générés après calcul.

La recette anglaise recherche notamment les mots français résiduels fréquents : `couche`, `épaisseur`, `mérite`, `moyenne`, `réjection`, `figée`, `optimiser`, `aiguille`, `rendement`, `qualifié`, `réalisation`.

---

## 13. Recette obligatoire avant diffusion

### 13.1 Tests statiques

- aucun module applicatif hors du périmètre couches minces → dépôt Fresnel ;
- aucun algorithme autre que BFGS ;
- prescription Fresnel exacte et unique ;
- 18 couches, 15 figées, 3 variables ;
- bandes 460–500, 535–565, 620–680 dans le simulateur et les deux énoncés ;
- aucun résultat de rendement ou verdict pré-mâché ;
- mêmes valeurs numériques, question par question, dans les deux énoncés ;
- aucun identifiant HTML dupliqué ;
- aucun lien local rompu.

### 13.2 Tests numériques

- dioptre air/BK7 à 550 nm : $R\simeq4,24\,\%$ ;
- conservation de l’énergie, **sans passer par $A$** : $R+T\le 1$ partout, et $R+T=1$ à $10^{-12}$ près en domaine transparent. Le simulateur définit $A=1-R-T$ : tester $|R+T+A-1|$ serait vrai par construction et n’aurait détecté aucun défaut — c’est ainsi qu’un mélange de conventions d’indice a longtemps survécu ;
- égalité $R_s=R_p$ à incidence normale, sur couches transparentes, absorbantes et métalliques ;
- couche métallique épaisse : réflectivité égale à celle du métal semi-infini (formule de Fresnel) ;
- miroir `(HL)^6H` à 550 nm : valeur indépendante cohérente ;
- filtre Fresnel : exactement 18 couches et spectres finis sur 430–700 nm ;
- égalité du calcul $Q_r$ par mesure de bandes et par mérite interne ;
- même état initial + BFGS : mêmes épaisseurs finales ;
- BFGS Fresnel : seules 16–18 changent ;
- Monte-Carlo Fresnel : 18 couches perturbées ;
- même graine et mêmes hypothèses : réalisations appariées ;
- substrat ou superstrat absorbant : Abelès et Airy concordent, en S comme en P ;
- verdict de Wilson : les trois zones, y compris $\hat p <$ exigence $\le p_{sup}$ (inconclusif).

### 13.3 Tests GUI

- bascule FR/EN sur toutes les zones, y compris après calcul, sans effacer les résultats affichés ;
- mode libre : mérite Cible libre imposé et cible vide ;
- mérites sans pertinence masqués selon l’exercice ;
- saisie et validation d’une liste de couches spécifiques ;
- graphe $\pi(z)$ au pas de 5 nm et aiguille 0,1 nm ;
- clic d’insertion suivi automatiquement de BFGS ;
- zoom spectral multi-niveaux, déplacement et réinitialisation ;
- chargement Fresnel : 18 lignes, verrous 1–15, variables 16–18 ;
- analyseur limité aux mesures R/T/A ;
- qualification $N=1000$ sans gel de l’interface ;
- comparaison A/B valide uniquement sous hypothèses identiques ;
- largeur mobile : aucun débordement global, tables défilantes si nécessaire.

### 13.4 Paquet hors ligne

- aucune dépendance d’exécution distante dans les pages livrées ; les liens documentaires externes peuvent rester présents sans conditionner le fonctionnement ;
- bibliothèques locales présentes ;
- manifeste SHA-256 recalculé ;
- vérification de toutes les empreintes ;
- ouverture directe ou via serveur local testée.

### 13.5 Publication

- aucun fichier contenant des réponses n’est suivi par git ;
- `.vercelignore` est une liste blanche : seuls le portail, le simulateur, les énoncés, le cours et `outputs/` sont téléversés. Une redirection ne suffit pas : elle ne filtre qu’une écriture de l’URL (l’écriture `%2E` du point contournait l’ancienne règle) ;
- vérification en ligne après chaque déploiement : `python tests/lancer.py --en-ligne`.

---

## 14. Audit pédagogique consolidé

### 14.1 Pédagogie active et fin de la boîte noire — **9,3 / 10**

La matrice Excel, la cartographie 2D, la mesure manuelle de FWHM, la construction de $Q_r$ et la cible libre obligent l’étudiant à expliciter les opérations que le simulateur pourrait masquer. La séparation entre instrument de mesure et fonction de mérite est particulièrement saine. La vigilance restante porte sur la charge cognitive : les auto-contrôles doivent valider une méthode sans dévoiler la réponse.

### 14.2 Progression et gestion du temps — **8,8 / 10**

Le parcours est progressif et les prérequis permettent un usage modulaire. Les goulots sont Q12, Q17 et Q23–Q25 ; leurs durées doivent rester indicatives. Le périmètre resserré recentre utilement le module sur la chaîne couches minces → dépôt.

### 14.3 Pertinence physique et apports industriels — **9,4 / 10**

Les admittances S/P, QWOT, cavités, BFGS local, aiguille, minimum de couche, Monte-Carlo, Wilson, centiles et diagnostic de dépôt forment un ensemble cohérent. Le modèle d’erreur unique est suffisamment simple pour l’enseignement tout en étant explicitement borné.

### 14.4 Adéquation avec le TP expérimental Fresnel — **9,7 / 10**

La prescription à 18 couches est désormais un invariant commun au simulateur, aux énoncés, au cours et à la qualification. Le verrouillage des quinze premières couches et l’étude 1/2/5 nm rendent la pré-fabrication concrète. La rétro-ingénierie prolonge directement le dépôt.

### 14.5 Trois points forts

1. Une chaîne complète allant de Maxwell et Abélès à une décision statistique de fabrication.
2. Une pédagogie de preuve : bandes mesurées, indicateurs reconstruits, résultats non fournis et comparaison appariée.
3. Un fil rouge expérimental unique, exact et traçable jusque dans la salle blanche.

### 14.6 Ajustements ciblés à maintenir

1. Conserver une fiche de remise par exercice avec les hypothèses minimales à reporter ; elle réduit les comptes rendus impossibles à reproduire.
2. Réserver en séance encadrée un court point d’arrêt avant Q25 afin de valider collectivement la différence entre couche figée en optimisation et couche perturbée en fabrication.

### 14.7 Avis global

La recette du §13 est automatisée (`tests/`) ; sa partie hors ligne a été exécutée avec succès le 8 octobre 2026, et la vérification en ligne du §13.5 confirme que le site n’expose plus aucun fichier non publié. Un seul point de cette vérification dépend de la visibilité du dépôt : tant que celui-ci reste public, son historique git conserve le corrigé et le contrôle correspondant échoue ; il passe dès que le dépôt n’est plus public. Le dispositif est de niveau professionnel et adapté à un public BUT 3 avancé, Master ou école d’ingénieurs. Sa valeur tient moins au nombre de fonctionnalités qu’à la cohérence entre mesure, optimisation locale, fabricabilité, statistiques et dépôt réel.

---

## 15. Règle de maintenance

Toute modification future doit être appliquée dans cet ordre :

1. mettre à jour les invariants de ce guide ;
2. modifier le simulateur ;
3. aligner simultanément les deux énoncés ;
4. mettre à jour le cours et le classeur si leur périmètre est touché ;
5. synchroniser le paquet hors ligne (`python .sync_offline.py`) ;
6. exécuter la recette complète (`python tests/lancer.py`) ;
7. ne diffuser qu’après validation bilingue et numérique.

Une fonctionnalité qui n’est ni enseignée, ni testée, ni documentée ne doit pas rester visible dans l’interface étudiante.
