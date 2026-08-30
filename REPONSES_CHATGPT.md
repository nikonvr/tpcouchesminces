# Réponses succinctes — TP de simulation de couches minces

Corrigé télégraphique indépendant, établi à partir de l’énoncé HTML définitif et des calculs associés.

## Q1

- Si : semi-conducteur, absorbant dans le visible.
- SiO₂ : diélectrique transparent.
- Ge : semi-conducteur à faible gap, très absorbant dans le visible.
- Al : métal, porteurs libres, forte réflexion et forte extinction.
- Au : métal noble, absorption interbande dans le bleu-vert, réflexion élevée vers le rouge/IR.
- Opacité : principalement gouvernée par $k$ ; $\alpha=4\pi k/\lambda$.

## Q2

- À 550 nm : SiO₂ = YF₃ = ZnS $(k=0)$ < Si $(0{,}040)$ < Au $(2{,}72)$ < Al $(\approx6{,}8)$.
- À 400 nm : SiO₂ = YF₃ $(0)$ < ZnS $(0{,}0066)$ < Si $(0{,}38)$ < Au $(1{,}96)$ < Al $(4{,}86)$.
- Changement de rang : ZnS, transparent à 550 nm mais absorbant à 400 nm.
- $k<5\times10^{-4}$ sur 400–750 nm : SiO₂ et YF₃ seulement.
- $k=0$ affiché : absorption négligée par le modèle, pas preuve métrologique d’une extinction exactement nulle.

## Q3

- Métaux : $k$ typiquement de l’ordre de 2 à 8 dans le visible.
- Si : $k\approx0{,}38$ à 400 nm, $0{,}040$ à 550 nm, $0{,}0063$ à 750 nm.
- Ge : $k\approx2{,}21$ à 400 nm, $\approx1{,}4$ à 550 nm, $\approx0{,}27$ à 750 nm.
- Origine : métaux — porteurs libres sans gap optique ; semi-conducteurs — absorption interbande seulement pour $h\nu\gtrsim E_g$, décroissante vers les grandes longueurs d’onde.

## Q4

- $n_H(550)=2{,}372$ ; $n_L(550)=1{,}469$.
- Contraste : $(n_H-n_L)/(n_H+n_L)=0{,}2351$.
- Largeur limite prédite à 550 nm : $\Delta\lambda\approx166{,}2$ nm.

## Q5

- $r=(1-1{,}5187)/(1+1{,}5187)=-0{,}20594$.
- $R=|r|^2=0{,}04241=4{,}241\,\%$.
- $T=1-R=95{,}759\,\%$.

## Q6

- Face avant seule : $R=4{,}24\,\%$.
- Lame nue, deux faces incohérentes : $R_{tot}=8{,}14\,\%$.
- Écart à $2R$ : transmissions aller-retour $(1-R)^2$ et réflexions internes géométriques ; pas une addition brute de deux intensités identiques.
- Avec couche : option face arrière volontairement inactive.

## Q7

| $\theta$ | $R_S$ (%) | $R_P$ (%) | $R_{moy}$ (%) |
|---:|---:|---:|---:|
| 0° | 4,24 | 4,24 | 4,24 |
| 10° | 4,41 | 4,07 | 4,24 |
| 20° | 4,98 | 3,56 | 4,27 |
| 30° | 6,10 | 2,70 | 4,40 |
| 40° | 8,11 | 1,55 | 4,83 |
| 50° | 11,70 | 0,38 | 6,04 |
| 60° | 18,30 | 0,15 | 9,23 |
| 70° | 30,74 | 4,16 | 17,45 |
| 80° | 54,59 | 23,56 | 39,07 |

## Q8

- $\theta_B=\arctan(1{,}5187)=56{,}64^\circ$.
- À $\theta_B$ : $R_P\simeq0$.
- Application : suppression des reflets par filtre polarisant — photographie, lunettes, télédétection.

## Q9

- $\theta_{lim}=\arcsin(1/1{,}5187)=41{,}18^\circ$.
- Au-delà : angle transmis non réel, onde évanescente, $R=100\,\%$.
- Fibres : guidage par réflexion totale au cœur/gaine ; ouverture numérique fixée par les indices.

## Q10

- Matériau fourni : $n_c=1{,}22474$ ; $d_{QW}=550/(4n_c)=112{,}27$ nm — conforme à 112,3 nm.
- Avec BK7 dispersif : $R<0{,}5\,\%$ sur $\approx452{,}8$–$705{,}8$ nm.
- Indice idéal réel : $\sqrt{1{,}51852}=1{,}23228$.
- Épaisseur idéale associée : $111{,}58$ nm.
- Matériau fourni à 550 nm : $R\approx0{,}00377\,\%$ — très faible, non nul.
- « AR parfait » seulement si couche et substrat sans pertes, $n_c=\sqrt{n_0n_s}$ et $n_cd=\lambda_0/4$.

## Q11

- BK7 : $n(400)=1{,}53085$ ; $n(550)=1{,}51852$ ; $n(750)=1{,}51184$.
- BK7 dispersif : minimum vers 550,4 nm ; $R<0{,}5\,\%$ vers 452,8–705,8 nm.
- Substrat constant $n=1{,}5185$ : minimum vers 550,2 nm ; bande vers 451,7–703,5 nm.
- Déplacement du minimum : $\approx0{,}3$ nm — négligeable ; effet principal sur profondeur et bornes de bande.
- Cause : phase quart d’onde fixée par $n_cd$ ; dispersion de $n_s$ agit surtout sur l’accord d’amplitude.
- Dispersion visible : absorption bleue du ZnS — exercice I ; position/largeur de bande des miroirs de Bragg — exercice VI.

## Q12

- $\phi_1=2\pi n_1d_1/\lambda=1{,}57123$ rad $\approx\pi/2$.
- $M_1\approx\begin{pmatrix}-4{,}38\times10^{-4}&0{,}81650i\\1{,}22474i&-4{,}38\times10^{-4}\end{pmatrix}$.
- $Y\approx0{,}987795+1{,}873\times10^{-4}i$.
- $R=3{,}771\times10^{-5}=0{,}003771\,\%$.
- Écart simulateur/Excel attendu : inférieur à 0,001 point.

## Q13

- Exemple conforme : ZnS 131 nm / YF3 125 nm.
- $R(550)=0{,}00105\,\%$ ; critère $R<0{,}5\,\%$ largement satisfait.
- Nombre de modifications : dépend du chemin d’ajustement manuel ; non intrinsèque au design final.

## Q14

- $R(550)$ en %, lignes $d_{ZnS}=60,80,100,120,140$ nm ; colonnes $d_{YF3}=80,100,120,140,160$ nm :

| $d_{ZnS}\backslash d_{YF3}$ (nm) | 80 | 100 | 120 | 140 | 160 |
|---:|---:|---:|---:|---:|---:|
| 60 | 8,400 | 7,548 | 13,734 | 22,524 | 29,535 |
| 80 | 3,726 | 7,612 | 15,246 | 22,413 | 26,582 |
| 100 | 1,255 | 5,171 | 9,731 | 12,998 | 13,889 |
| 120 | 3,975 | 2,695 | 1,927 | 2,032 | 2,960 |
| 140 | 8,611 | 2,956 | **0,918** | 3,830 | 9,819 |

- Minimum de la grille : 140/120 nm ; $R=0{,}918\,\%$.
- Vallée étroite et oblique ; minimum continu voisin : 131/125 nm.
- Plusieurs vallées possibles par périodicité de phase ; optimisation non convexe.

## Q15

- Design testé : ZnS 131 nm / YF3 125 nm.
- Fenêtre 400–750 nm : $\overline R=9{,}490\,\%$ — échec du seuil 0,8 %.
- Fenêtre 520–580 nm : $\overline R=0{,}5879\,\%$ ; marge = 0,2121 point.
- Monte-Carlo, $N=500$, $\Delta d=3$ nm : rendement 95,2 % ; IC95 Wilson [92,96 ; 96,75] % ; $P_{95}(\overline R)=0{,}7956\,\%$.
- Monte-Carlo, $N=500$, $\Delta d=5$ nm : rendement 80,6 % ; IC95 Wilson [76,91 ; 83,83] % ; $P_{95}(\overline R)=1{,}0490\,\%$.
- IC non recouvrants : dégradation significative à 5 nm ; moyenne acceptable mais queue hors spécification.
- Sensibilité isolée : ZnS plus critique — à 5 nm, rendement ≈87 % contre ≈95 % pour YF3.
- Limite logicielle constatée : les verrous n’isolent pas une couche dans le Monte-Carlo ; isolation obtenue par calcul séparé.
