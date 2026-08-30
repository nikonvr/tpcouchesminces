# Résultats TP Couches Minces (Style Télégraphique)

**Q1** : Si et Ge sont des semi-conducteurs absorbants dans le visible (k > 0). SiO2, YF3, ZnS sont des diélectriques (k=0 dans le visible). Al et Au sont des métaux très absorbants et très réflecteurs. Le paramètre k (coefficient d'extinction) dicte l'opacité.

**Q2** : À 550 nm : SiO2 = YF3 = ZnS (k=0) < Si < Au < Al. À 400 nm : SiO2 = YF3 (k=0) < ZnS (k>0, ~0.006) < Si < Au < Al. ZnS devient absorbant dans le bleu. Si k=0, c'est souvent une convention du modèle pour simplifier hors des bandes d'absorption.

**Q3** : Métaux (Al, Au) : k élevé (~3 à 6) dû au gaz d'électrons libres (plasma). Semi-conducteurs (Si, Ge) : k modéré dépendant du gap électronique Eg (absorption interbande forte si photon > Eg).

**Q4** : n_ZnS ≈ 2.37, n_YF3 ≈ 1.47. Contraste = (2.37 - 1.47)/(2.37 + 1.47) = 0.90 / 3.84 ≈ 0.234. Détermine la largeur de bande interdite de Bragg.

**Q5** : n0 = 1, n_BK7 = 1.5187. R = ((1 - 1.5187)/(1 + 1.5187))^2 = 4.24%. T = 1 - R = 95.76%.

**Q6** : Sans face arrière: R = 4.24%. Avec face arrière (somme incohérente de 2 dioptres): R_tot = 2R/(1+R) ≈ 8.14%. La formule n'est plus 2R à cause des réflexions multiples (série géométrique). Dès qu'une couche est ajoutée, l'incohérence arrière pure disparaît de cette formule simple.

**Q7** : À incidence rasante (80°), R tend vers 100%. R_s augmente continûment. R_p diminue jusqu'à l'angle de Brewster puis remonte.

**Q8** : Brewster Air/BK7: R_p = 0 à θ_B = arctan(1.5187) ≈ 56.6°. Application : Lunettes polarisantes, lasers à fenêtres de Brewster.

**Q9** : Réflexion Totale Interne (BK7 vers Air): θ_lim = arcsin(1/1.5187) ≈ 41.2°. Les fibres optiques l'utilisent pour confiner la lumière dans le cœur.

**Q10** : Indice idéal n_c = √(n_s * n_0) = √(1.5185 * 1) = 1.232. Le matériau fourni a n=1.22474 (conçu pour verre n=1.50). Résultat : R_min est > 0 (≈ 0.004%). L'AR parfait exige strictement n_c = √n_s.

**Q11** : n_BK7 varie (dispersion). Minimum fixé en longueur d'onde par n_c * d = λ/4 (couche AR théorique non dispersive). Profondeur du minimum fixée par n_c = √n_s(λ). La dispersion substrat modifie l'amplitude, pas la position. Exceptions : Bragg, où l'indice fixe la bande interdite.

**Q12** : d = 112.3 nm, n=1.225. Matrice M1 avec composantes complexes. Y équivalent. R ≈ 0.00377%. Correspond strictement au simulateur.

**Q13** : Optimisation manuelle ZnS/YF3. R_min atteint autour de d_ZnS ≈ 30 nm et d_YF3 ≈ 120 nm. Évaluations manuelles: env. 20-30 essais.

**Q14** : La surface 3D montre une vallée diagonale. Oui, le minimum manuel est dans cette vallée. Plusieurs minima locaux périodiques existent (λ/2).

**Q15** : Mérite 400-750 nm inadapté pour un AR à 550 nm, car R remonte vite en V. Sur 520-580 nm, R_moy < 0.8% passe. À ±5 nm, P95 dépasse 0.8%, le rendement s'effondre (rejets > 5%). YF3 plus épaisse est proportionnellement plus tolérante que la très fine couche de ZnS (qui domine l'erreur d'interférence).

**Q16** : Couches λ/4 H L sur verre = miroir, pas antireflet (R augmente car H a un haut indice). BFGS est une descente locale de gradient. Convergence vers minima locaux (2, 3, ou 4 couches). Marge de seuil franchie selon point de départ (W-shape ou V-shape).

**Q17** : Aiguille (Needle) : Calcule perturbation optimale (z ≈ 72 nm, ZnS 6 nm au milieu de YF3). Insertion + BFGS. Avantage : trouve la structure optimale sans intuition du nombre de couches initial. Limites : balayage discret (5 nm), ignore souvent les interfaces exactes, calcul par dérivée finie locale.

**Q18** : Miroir Bragg 7 couches. R_max ≈ 94.1%. Bande interdite visible. La formule Δλ = (4λ_0/π) arcsin(Δn/2n) surestime la largeur car 7 couches ne suffisent pas à atteindre le régime saturé aux bords de bande (seuil 90% non atteint sur toute la largeur théorique).

**Q19** : Bragg 7, 9, 11, 13 couches. R_max tend vers 99.9%. Largeur à 90% s'élargit et tend vers l'asymptote théorique Δλ. À partir de 11/13 couches, la formule de Q4 devient très bonne.

**Q20** : Modifier les couches extrêmes (λ/8 au lieu de λ/4) transfère les ondulations (ripples) d'un côté à l'autre de la bande interdite (adaptation d'admittance). Arbitrage industriel pour nettoyer le spectre côté onde passante (ex: filtres dichroïques passe-bas/haut).

**Q21** : Filtres cavités (HL)^m 2H (LH)^m. La FWHM s'affine exponentiellement avec le nombre de périodes miroirs m (augmentation de réflectivité des réflecteurs). Augmenter l'ordre de cavité q (4H, 6H) affine aussi linéairement, mais réduit l'intervalle spectral libre (pics parasites).

**Q22** : 18 couches : 3 cavités couplées. Sommet plat, bords raides. Centre (λ1+λ2)/2 robuste. Mesure à mi-hauteur T_max/2. Pas spectral critique (0.1 nm vs 2 nm). Fichier CSV exporté pour la suite.

**Q23** : Calcul Qr = T_pass / ((T_B1 + T_B2)/2). Une moyenne sur 400-500nm au lieu de 460-500nm englobe des zones hors-bande, faussant drastiquement Qr. Spécifier les bandes exactes est impératif pour un critère industriel.

**Q24** : Marge vitale avant optimisation : un filtre nominal parfait peut s'effondrer au dépôt. BFGS sur les 3 dernières couches (16,17,18) améliore la tolérance. BFGS reproductible car déterministe. Ne jamais accepter un d_min < 2 nm irréalisable.

**Q25** : Monte-Carlo robuste. d_min=1 nm (faisabilité) vs seuil BFGS 2nm. À Δd=2 nm, rendement > 90%. À Δd=5 nm, effondrement. P05(Qr) s'effondre. IC95% indispensable pour statuer. Borne machine : Δd max acceptable par interpolation.

**Q26** : Décalage de pic (8 nm). Variante (a) : erreur systématique de dépôt. Un biais de +1.5% sur toutes les couches translate le spectre (8nm ≈ 1.5% de 550). Pire qu'une erreur aléatoire centrée car effet cumulatif direct en phase.

**Q27** : Tolérance d'épaisseur : ~ ±2 nm. Pour la balance à quartz : nécessite calibrer le Tooling Factor, la densité, Z-ratio de ZnS et YF3, avec un log historique pour éviter les biais systématiques vus en Q26.

**Q28** : Revue de conception : Polarisation Moyenne, incidence 0°, Qr max, bandes [460-500], [535-565], [620-680], d_min=10nm, Δd=2nm, Rendement exigé=80%.

**Q29** : Couches fines non fabricables (<10 nm) bloquent le design. Un miroir pur λ/4 n'est pas contraint, mais après optimisation, de fines couches peuvent apparaître pour l'adaptation d'admittance, justifiant d'activer le garde-fou d_min.

**Q30** : Convergence 1/sqrt(N). N=100 : IC de l'ordre de ±10%. N=1000 : IC resserré à ±3%. 100 tirages donnent une tendance (intervalle trop grand), 1000 tirages certifient statistiquement (précision).

**Q31** : 3 verdicts IC95% vs Seuil : 1) Succès garanti (Seuil < p_inf), 2) Zone grise inconcluante (p_inf < Seuil < p_sup), 3) Échec garanti (Seuil > p_sup). Augmenter N rétrécit l'IC mais ne déplace pas p_chapeau au-delà du seuil s'il est physiquement inférieur.

**Q32** : Comparaison appariée A/B : B (optimisé) améliore le P05(Qr) et la tolérance à l'erreur (rendement), sans toucher aux 15 premières couches. Décision : Adopter B. Biais du modèle : ignore les corrélations de dépôt et les variations d'indice n.

