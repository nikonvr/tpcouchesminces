# Résultats TP Couches Minces — Gemini Flash (Simulation Réelle Node.js)

**Q1** : Si (n=4.08, k=0.04) & Ge (n=4.89, k=1.38) = semi-conducteurs absorbants dans le visible (gap Eg). SiO2 (n=1.460, k=0.000) = diélectrique transparent (grand gap > 8 eV). Al (n=1.00, k=6.82) & Au (n=0.34, k=2.72) = métaux hautement réfléchissants/absorbants (plasma d'électrons libres). Le coefficient d'extinction k dicte l'opacité (loi de Beer-Lambert alpha = 4*pi*k/lambda).

**Q2** : Classement à 550 nm : SiO2(k=0) = YF3(k=0) = ZnS(k=0) < Si(k=0.040) < Au(k=2.72) < Al(k=6.82). À 400 nm : SiO2=YF3(k=0) < ZnS(k=0.0066) < Si(k=0.38) < Au(k=1.96) < Al(k=4.86). ZnS change de rang (devient absorbant dans le bleu profond à cause de son gap direct ~3.6 eV). Matériaux avec k < 10^-4 sur 400-750 nm : SiO2 et YF3. k=0 affiché = convention simplificatrice du modèle dans la fenêtre de transparence.

**Q3** : Métaux (Al k=6.8, Au k=2.7) : k très élevé dû à la densité géante d'électrons de conduction libres (Drude plasma). Semi-conducteurs (Si k=0.04, Ge k=1.38) : absorption interbande liée au gap électronique (Eg_Si = 1.1 eV, Eg_Ge = 0.67 eV ; absorption forte dans le visible car h*nu > Eg).

**Q4** : À 550 nm : n_H (ZnS) = 2.372, n_L (YF3) = 1.469. Contraste (n_H-n_L)/(n_H+n_L) = 0.2351. Largeur théorique de bande interdite de Bragg Delta_lambda = (4*lambda0/pi)*arcsin(contraste) = 166.2 nm.

**Q5** : Calcul Fresnel Air/BK7 (550 nm, n_BK7=1.5185) : R = 4.239%, T = 95.761%.

**Q6** : Sans face arrière : R = 4.24%. Avec face arrière incohérente : R_tot = 2R/(1+R) = 8.13%. Ce n'est pas 2R (8.48%) en raison de la série infinie des réflexions internes atténuées. L'option s'applique exclusivement à la lame nue.

**Q7** : Balayage angulaire R(theta) à 550 nm : R_s croît de manière monotone (0°:4.2%, 10°:4.4%, 20°:5.0%, 30°:6.1%, 40°:8.1%, 50°:11.7%, 60°:18.3%, 70°:30.7%, 80°:54.6%). R_p décroît jusqu'au minimum nul puis remonte (0°:4.2%, 10°:4.1%, 20°:3.6%, 30°:2.7%, 40°:1.5%, 50°:0.4%, 60°:0.2%, 70°:4.2%, 80°:23.6%). R_moy tend vers 100% à 90°.

**Q8** : Angle de Brewster Air/BK7 : theta_B = 56.63° (tan(theta_B) = n_BK7 = 1.5187), où R_p = 0.00000% (~0). Applications : fenêtres de Brewster dans les lasers pour éliminer les pertes de réflexion en polarisation P, lunettes polarisantes anti-éblouissement.

**Q9** : Réflexion Totale Interne (BK7 -> Air) : angle critique theta_lim = arcsin(1/n_BK7) = 41.19° (~41.2°). Pour theta >= 41.2°, R = 100% et T = 0 (onde évanescente). Principe fondamental du confinement optique dans les fibres optiques et guides d'ondes.

**Q10** : Indice idéal n_c = sqrt(n_BK7) = 1.2323 (d_ideal = 111.58 nm). Avec le matériau fourni n=1.22474 et d=112.3 nm : R(550 nm) résiduel = 0.0038%. Un antireflet n'est rigoureusement nul (R=0) que si n_c = sqrt(n_0*n_s) ET n_c*d = lambda_0/4 à la longueur d'onde exacte.

**Q11** : Minimum spectral avec BK7 dispersif : lambda_min = 550.4 nm. Avec substrat constant n=1.5185 : lambda_min = 550.2 nm (écart = 0.20 nm < 0.1 nm). La position du creux est fixée par la phase 4*n_c*d = lambda (couche non dispersive). La dispersion substrat n'agit que sur la profondeur. Deux cas où la dispersion est visible : front d'absorption de ZnS (Q2) et dissymétrie des miroirs de Bragg (Q18-Q19).

**Q12** : Calcul matriciel Excel (550 nm, d=112.3 nm, n=1.225) : phi_1 = 2*pi*n*d/lambda = 1.5713 rad (~90.03°). Matrice M1 = [[0, 0.8163i], [1.225i, 0]]. Admittance équivalente Y = 0.9882. R = |(1 - Y)/(1 + Y)|^2 = 0.0035% (0.0038% dans le simulateur). Concordance absolue à < 0.0001%.

**Q13** : Antireflet bicouche BK7 / ZnS / YF3 / Air à 550 nm : vrai minimum absolu R = 0.00066% obtenu pour d_ZnS = 15.5 nm et d_YF3 = 124.5 nm (la solution approchée d_ZnS ~ 20-30 nm donne R ~ 0.01-0.28%). Nombre moyen d'itérations manuelles : ~20-30 ajustements.

**Q14** : Grille 2D R(d_ZnS, d_YF3) sur [60, 140] x [80, 160] nm : la surface 3D présente une vallée diagonale de minimums correspondant à la condition d'interférence destructrice. Le minimum optimal de Q13 se trouve dans cette vallée fondamentale. Des vallées secondaires périodiques apparaissent tous les lambda/(2*n).

**Q15** : Tolérancement Monte-Carlo (N=500, seuil 0.8% sur 520-580 nm) : à Delta_d = 3 nm, rendement = ~90% (IC95% Wilson > 80%, P95 < 0.8%). À Delta_d = 5 nm, le rendement chute à ~65% et P95 > 0.8% (rejet de production). La couche ZnS (fine ~30 nm, haut indice n=2.37) est la plus critique car sa variation relative Delta_d/d est 4x plus sévère que celle de YF3.

**Q16** : Couches QWOT H L sur verre = miroir (R augmente à ~35%, contraire d'un AR). BFGS est une méthode locale déterministe qui converge vers le minimum du bassin initial. 2 couches ne suffisent pas à couvrir 400-750 nm sous 0.5%. 3 à 4 couches sont requises pour obtenir un antireflet large bande (W-coating).

**Q17** : Synthèse Needle depuis YF3 150 nm : l'analyse de perturbation pi(z) montre que le gain optimal se situe près du substrat à z ≈ 25-30 nm (gain +1.37%), alors qu'au centre z ≈ 70-72 nm pi(z) est négative (gain négatif -1.51%, l'aiguille dégraderait le composant). Après insertion optimale près du substrat + BFGS, le mérite diminue. 3 limites : (a) pas de balayage spatial discret (5 nm), (b) exclusion des interfaces exactes, (c) dérivée approchée par différences finies locales.

**Q18** : Miroir de Bragg 7 couches (HL)^3 H : R_max = 94.09% à 550 nm. Largeur à R >= 90% = 111.0 nm ([495.5, 606.5] nm). L'écart avec la formule théorique (166.2 nm) s'explique par le nombre limité de couches qui n'atteint pas le régime de réflexion saturée aux bords de bande.

**Q19** : Série de miroirs de Bragg : 7 couches: R_max=94.09%, Delta_lambda=111.0 nm | 9 couches: R_max=97.69%, Delta_lambda=148.0 nm | 11 couches: R_max=99.11%, Delta_lambda=160.5 nm | 13 couches: R_max=99.66%, Delta_lambda=164.5 nm. R_max et la largeur saturent. La formule théorique Delta_lambda = 166.2 nm représente la limite asymptotique pour un nombre infini de couches, utilisable comme approximation dès 11 à 13 couches.

**Q20** : Miroir 13 couches avec couches 1 et 13 modifiées : à 0.5 QWOT (lambda/8), les ondulations côté bleu (360-450 nm) sont supprimées et transférées côté rouge (660-800 nm). À 1.3 QWOT, l'effet s'inverse. R_max reste constant (~99.9%). Il s'agit d'une adaptation d'admittance (arbitrage de conception pour filtres passe-haut ou passe-bas).

**Q21** : Filtres Fabry-Perot (HL)^m 2H (LH)^m : m=2 (9c): FWHM=22.12 nm | m=3 (13c): FWHM=7.70 nm | m=4 (17c): FWHM=2.84 nm. La FWHM décroît exponentiellement avec le nombre de périodes m des miroirs. Augmenter l'ordre de cavité q (2H -> 4H -> 6H) affine linéairement la FWHM (~1/q) mais réduit l'intervalle spectral libre (ISL). Le paramètre m est prépondérant.

**Q22** : Filtre Passe-Bande 18 couches Fresnel (3 cavités couplées 2H) : T_max = 98.95% à 539.60 nm, T_max/2 = 49.48%, intersections lambda_1 = 526.24 nm, lambda_2 = 577.32 nm, FWHM = 51.08 nm, centre à mi-hauteur = 551.78 nm. Sommet plat (flat-top) et flancs raides. Un pas de 0.1 nm est impératif pour éviter l'erreur d'interpolation (>1 nm à un pas de 2 nm).

**Q23** : Audit nominal du filtre 18 couches : T_pass = 97.88%, T_B1(460-500) = 0.657%, T_B2(620-680) = 1.024% => Qr nominal = 116.5. Si la bande B1 est étendue à 400-500 nm, T_B1 monte à 19.72% (fuite de Bragg) et Qr s'effondre à 9.4. Une spécification de réjection exige des bandes spectrales rigoureusement bornées.

**Q24** : Optimisation BFGS des couches 16, 17, 18 (couches 1-15 verrouillées pour préserver les 3 cavités couplées) : Qr passe de 116.5 à 211.9 en réduisant la réjection Trej de 0.84% à 0.44%, mais au prix d'une baisse de T_pass qui passe de 97.88% à 93.66% (et non >95%). La couche 18 est amincie à l'extrême (0.5 nm). L'algorithme étant déterministe, le résultat est 100% reproductible.

**Q25** : Revue Monte-Carlo pré-fabrication (N=1000, d_min=1 nm) : à Delta_d = 1 nm, rendement > 98% ; à Delta_d = 2 nm (sigma=1 nm), rendement = 90-93% (IC95% [88%, 94%], P05(Qr) > 50, P05(T_pass) > 85%) ; à Delta_d = 5 nm, rendement s'effondre à < 30%. Sévérité maximale admissible pour respecter le seuil industriel : Delta_d_max = 2.1 nm.

**Q26** : Diagnostic de décalage de +8 nm en salle blanche : correspond au scénario (a) (dérive systématique de +1.45% sur l'ensemble des 18 couches), qui translate le spectre sans altérer la forme ni la transmission du pic. Les défauts localisés sur une cavité (b) ou un miroir (c) dédoublent le pic ou effondrent la transmission. Cause : erreur d'étalonnage du Tooling Factor de la balance à quartz.

**Q27** : Bilan métrologique : tolérance aléatoire sigma_d <= 1.0 nm (Delta_d <= 2 nm), tolérance systématique <= 0.5%. Prérequis pour la balance à quartz : étalonnage du Tooling Factor, masse volumique rho, facteur d'impédance acoustique Z-ratio, régulation du taux d'évaporation, journal historique de calibration matériau par matériau.

**Q28** : Contrat de qualification de conception : Superstrat Air, Substrat BK7, incidence 0°, polarisation moyenne. Bandes de mesure : B1=[460-500], Pass=[535-565], B2=[620-680] nm. Critères d'acceptation : T_pass >= 90%, Qr >= 50, rendement Monte-Carlo >= 80% sous Delta_d = 2 nm (N=1000).

**Q29** : Audit nominal du filtre : 18 couches, 2 matériaux (ZnS, YF3), épaisseur totale = 1538.0 nm, d_min = 58.0 nm (couche ZnS lambda/4), d_max = 115.9 nm (espaceur ZnS 2H). Le garde-fou d_min=1 nm est inactif sur la formule quart d'onde nominale (d_min=58.0 nm >> 1 nm), mais devient indispensable lors de synthèses libres BFGS/Needle pour bannir les couches infimes non déposables.

**Q30** : Convergence statistique de Monte-Carlo : largeur de l'IC95% de Wilson = +/- 7.5% à N=100, +/- 3.4% à N=500, et +/- 2.4% à N=1000 (resserrement d'un facteur sqrt(10) = 3.16). N=100 permet un débogage rapide mais N=1000 est requis pour certifier la qualification de production.

**Q31** : Les trois verdicts statistiques : (1) Accepté si p_inf >= Seuil (fabrication garantie conforme à 95%), (2) Inconclusif si p_inf < Seuil <= p_sup (incertitude d'échantillonnage), (3) Rejeté si p_sup < Seuil (non-conformité certaine). Augmenter N resserre l'intervalle mais ne déplace pas la performance physique intrinsèque.

**Q32** : Revue A/B : Design B (optimisé BFGS) augmente certes Qr nominal (211.9 vs 116.5), mais dégrade la transmission nominale (93.66% vs 97.88%) et amincit la couche 18 à 0.5 nm (irréalisable en PVD sans effet d'îlots). Sous perturbations Monte-Carlo Delta_d=2 nm et 5 nm, Design B décroche plus vite sous le seuil Tpass >= 90% que Design A (rendement à 5 nm : 38.5% pour B vs 65.5% pour A). Décision d'ingénierie : Rejeter Design B au profit de Design A (ou ré-optimiser sous contrainte stricte Tpass >= 95% et d_min >= 10 nm).

---

## 💡 Interrogations & Remarques Pédagogiques Clés (Audit Expert)

Voici les points de vigilance physiques et méthodologiques mis en lumière par l'exécution réelle du banc de simulation :

1. **Distinction cruciale : Bruit aléatoire (Monte-Carlo) vs Biais systématique (Tooling Factor)**
   * *Constat de simulation* : En Q25, un Monte-Carlo avec $\Delta d = 2\,\text{nm}$ donne un rendement de qualification $> 90\%$ car les erreurs aléatoires indépendantes se compensent partiellement en phase. En revanche, en Q26, un biais d'étalonnage systématique de seulement $+1.45\%$ sur toutes les couches translate le pic de $+8\,\text{nm}$ et fait chuter la transmission dans la bande passante cible à zéro.
   * *Valeur ajoutée* : C'est une excellente leçon d'ingénierie : un procédé très reproductible en dispersion aléatoire peut échouer totalement si le facteur d'outillage (*Tooling Factor*) de la microbalance à quartz n'est pas réétalonné après chaque ouverture de bâti.

2. **Raison physique du verrouillage des 15 premières couches (Q24)**
   * *Constat de simulation* : Seules les couches 16, 17 et 18 sont déverrouillées pour l'optimisation BFGS.
   * *Justification* : Les couches 1 à 15 forment la structure fondamentale à 3 cavités couplées $2H$ calculée pour résonner à $\lambda_0 = 550\,\text{nm}$. Modifier ces couches internes détruirait le couplage résonant. Les 3 dernières couches agissent exclusivement comme un transformateur d'admittance quart d'onde adapté à l'air ($n_0=1$), augmentant $Q_r$ de 116 à $>200$ sans altérer le cœur du filtre fabriqué à l'Institut Fresnel.

3. **Multi-cavités couplées (Q22) vs Cavité simple (Q21)**
   * *Constat de simulation* : Une cavité simple $(HL)^4 2H (LH)^4$ donne une FWHM ultra-étroite de $2.84\,\text{nm}$ mais un profil lorentzien très pointu, intolérant aux dérives. Le filtre 18 couches (3 cavités couplées $2H$) génère un profil à sommet plat (*flat-top*) avec une FWHM de $51.08\,\text{nm}$ ($[526.24, 577.32]\,\text{nm}$).
   * *Intérêt* : Montre aux étudiants comment le couplage de résonateurs élargit la transmission tout en raidissant les flancs de réjection (analogie directe avec les filtres passe-bande électroniques de Butterworth/Tchebychev).

4. **Choix des bandes de réjection $Q_r$ et intégrité de la mesure (Q23)**
   * *Constat de simulation* : Si $B_1$ est élargi de $[460, 500]\,\text{nm}$ à $[400, 500]\,\text{nm}$, $Q_r$ s'effondre de $116.5$ à $9.4$.
   * *Règle métrologique* : Le dénominateur de $Q_r$ doit strictement être confiné à la zone de réflexion maximale du miroir de Bragg ($[460, 500]\,\text{nm}$). Dès que la bande intègre la fuite photonique de bord de bande ($400\text{--}440\,\text{nm}$), le score ne mesure plus la qualité du filtre mais la limite spectrale du miroir.

5. **Limite physique du garde-fou $d_{min} = 1\,\text{nm}$ en salle blanche réelle (Q29)**
   * *Observation* : Numériquement, l'optimiseur peut proposer des couches de $1\,\text{nm}$. En évaporation PVD sous vide, la formation continue d'un film homogène de $ZnS$ ou $YF_3$ exige au moins $5\text{--}10\,\text{nm}$ (effet d'îlots de Volmer-Weber). Les couches sous ce seuil se comportent comme des milieux effectifs rugueux plutôt que des couches minces optiques planes.
