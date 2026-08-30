# 📚 Dispositif Pédagogique Complet : TP Couches Minces Optiques (12h)

Ce document centralise **l'ensemble des liens d'accès, des ressources logicielles, des fichiers de cours, des corrigés métrologiques et des instructions de déploiement** pour le module de Travaux Pratiques de Simulation en Couches Minces Optiques (Formation BUT 3 Parcours MCPC / Master Photonique — adossé au dépôt sous vide à l'**Institut Fresnel**).

---

## 🔗 Liens d'Accès Directs

| Composant | Lien / Fichier Local | Description |
| :--- | :--- | :--- |
| 🐙 **Dépôt GitHub** | [`github.com/nikonvr/tpcouchesminces`](https://github.com/nikonvr/tpcouchesminces) | Code source complet, historique et versions |
| 🧪 **Simulateur Web Interactif** | [`simulateur_couches_minces.html`](simulateur_couches_minces.html) | Banc virtuel TMM (5 algorithmes, polarisation S/P, Monte-Carlo, $Q_r$) |
| 📘 **Énoncé du TP (Français)** | [`tp_couches_minces_fr.html`](tp_couches_minces_fr.html) | Sujet officiel complet (4 séances de 3h, 32 questions) |
| 📕 **Lab Subject (English)** | [`tp_couches_minces_en.html`](tp_couches_minces_en.html) | Strict 1-to-1 English translation mirroring the French lab |
| 📚 **Cours & Théorie d'Abelès** | [`theorie en francais.html`](theorie%20en%20francais.html) | Document de cours complet sur les interférences en couches minces |
| 📊 **Squelette Excel Étudiant** | [`squelette_excel_couches_minces.xlsx`](outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx) | Feuille de calcul prête à l'emploi (matrice $M_1$, cartographie 2D) |
| 💾 **Kit 100% Hors-Ligne** | [`outputs/tp_couches_minces_hors_ligne/index.html`](outputs/tp_couches_minces_hors_ligne/index.html) | Version autonome embarquée pour clé USB / salle blanche |
| 🌐 **Portail Web Général** | [`index.html`](index.html) | Dashboard d'accueil avec cartes de navigation directe |

---

## 📖 Corrigés & Documents de Référence Enseignants

1. **[`gemini_flash_results.md`](gemini_flash_results.md)** :
   * Corrigé chiffré exact obtenu par exécution directe du moteur matriciel TMM sous Node.js pour chacune des 32 questions.
   * Contient la section d'analyse experte (distinction biais systématique vs dispersion aléatoire, rôle d'adaptateur d'impédance des couches 16–18, analogie Butterworth, contrainte physique de Volmer-Weber).

2. **[`GUIDE_MIGRATION_ET_ACTIONS_TP.md`](GUIDE_MIGRATION_ET_ACTIONS_TP.md)** :
   * Manuel de référence pédagogique détaillant l'architecture du TP, le découpage en 4 séances de 3h, la philosophie « zéro magie » et la grille d'évaluation.

3. **[`CORRIGE_REPONSES.md`](CORRIGE_REPONSES.md)** :
   * Guide de correction développé avec explications physiques détaillées pour chaque partie.

4. **[`COMPARAISON_IA.md`](COMPARAISON_IA.md)** :
   * Rapport de vérification croisée et de métrologie numérique.

---

## 🧭 Découpage Pédagogique du TP (12h • 4 Séances)

* **Séance 1 (3h — Q1 à Q12) : Dioptres, Matériaux Réels & Matrice $M_1$ sous Excel**
  * Exploration des matériaux ($k$ dicte l'opacité, absorption de $ZnS$ à $400\,	ext{nm}$).
  * Dioptre Air/BK7 nu ($R = 4.24\%$, face arrière $R_{tot} = 8.14\%$), Brewster ($	heta_B = 56.63^\circ$), Réflexion totale ($	heta_{lim} = 41.19^\circ$).
  * Monocouche antireflet idéale ($n_c = \sqrt{1.5185} = 1.2323$, $d = 111.58\,	ext{nm}$) et programmation de la matrice $M_1$ sous Excel.

* **Séance 2 (3h — Q13 à Q17) : Antireflet Bicouche, Monte-Carlo & Synthèse Needle**
  * Recherche du minimum bicouche ($d_{ZnS} = 15.5\,	ext{nm}, d_{YF3} = 124.5\,	ext{nm} \implies R = 0.00066\%$) et cartographie 2D sous Excel.
  * Tolérancement Monte-Carlo ($520	ext{--}580\,	ext{nm}$, seuil $0.8\%$, rôle critique de $ZnS$).
  * Synthèse guidée Needle (perturbation maximale $\pi(z)$ à $z pprox 25	ext{--}30\,	ext{nm}$ près du substrat + raffinement BFGS).

* **Séance 3 (3h — Q18 à Q22) : Miroirs de Bragg & Filtre 18 couches Fresnel**
  * Miroirs $(HL)^n H$ ($7	ext{c} 	o 13	ext{c}$), saturation vers la largeur asymptotique $\Delta\lambda = 166.2\,	ext{nm}$.
  * Adaptation d'admittance par réglage des couches extrêmes ($0.5\,	ext{QWOT}$).
  * Filtres Fabry-Perot simples vs Filtre 18 couches à 3 cavités couplées $2H$ déposé à Fresnel ($T_{max} = 98.95\%$, $	ext{FWHM} = 51.08\,	ext{nm}$, profil à sommet plat *flat-top*).

* **Séance 4 (3h — Q23 à Q32) : Réjection $Q_r$, Rétro-Ingénierie & Revue A/B**
  * Facteur de réjection $Q_r = 116.5$ (chute à $9.4$ si la bande déborde).
  * Optimisation BFGS des 3 dernières couches ($Q_r > 200$, $\overline{T}_{pass} = 93.67\%$).
  * Diagnostic salle blanche : décalage $+8\,	ext{nm} \implies$ dérive systématique $+1.45\%$ du *Tooling Factor* quartz.
  * Qualification Monte-Carlo ($N=1000$) et décision d'ingénierie : rejet de B au profit de la robustesse de A.

---

## 🚀 Déploiement Vercel

Le projet est configuré avec `vercel.json` et un `index.html` à la racine pour un déploiement instantané :

1. Rendez-vous sur le tableau de bord Vercel : [vercel.com/new](https://vercel.com/new).
2. Cliquez sur **Import** en face du dépôt GitHub **[`nikonvr/tpcouchesminces`](https://github.com/nikonvr/tpcouchesminces)**.
3. Conservez les réglages par défaut (Static Site / No Framework).
4. Cliquez sur **Deploy** : votre plateforme complète de TP est immédiatement accessible en ligne avec HTTPS, CDN mondial et mise à jour automatique à chaque `git push`.
