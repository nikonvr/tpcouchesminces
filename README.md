# TP Couches Minces Optiques (12h Simulation + Salle Blanche)

Dispositif complet de Travaux Pratiques de Simulation de Couches Minces Optiques adossé au dépôt sous vide à l'Institut Fresnel (Formation BUT 3 Parcours MCPC / Master Photonique).

## 🚀 Contenu du Dépôt

1. **Simulateur Web Interactif** :
   - simulateur_couches_minces.html : Banc de mesure virtuel autonome fondé sur la méthode matricielle d'Abelès (TMM). Intègre 5 algorithmes d'optimisation (Descente Locale, Monte-Carlo, Recuit Simulé, Méthode de l'Aiguille / Needle interactive, Quasi-Newton BFGS), analyse de polarisation S/P, tolérancement de fabrication et mesure $.

2. **Énoncés Bilingues (12h en 4 séances de 3h — 32 questions)** :
   - 	p_couches_minces_fr.html : Version française intégrale avec guidage pas-à-pas, analyses d'admittance et rétro-ingénierie salle blanche.
   - 	p_couches_minces_en.html : Version anglaise complète rigoureusement alignée en miroir 1-to-1.
   - 	heorie en francais.html : Document de cours et rappels théoriques exhaustifs sur les interférences en couches minces.

3. **Manuels & Références Pédagogiques** :
   - GUIDE_MIGRATION_ET_ACTIONS_TP.md : Manuel de référence pédagogique, architecture modulaire et guide enseignant.
   - gemini_flash_results.md : Corrigé chiffré exact obtenu par exécution directe du moteur de simulation.
   - CORRIGE_REPONSES.md : Guide de correction détaillé.
   - COMPARAISON_IA.md : Analyse croisée de validation et métrologie.

4. **Kits & Outils Hors-Ligne** :
   - outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx : Squelette Excel pour la programmation matricielle $, la cartographie 2D et la fonction de mérite RMSE.
   - outputs/tp_couches_minces_hors_ligne/ : Version 100% autonome sans connexion internet (fonts, Tailwind, MathJax, Chart.js et Lucide embarqués localement).
   - 	ests/ : Suite de tests automatisés (physique, algorithmes, garde-fous).

## 💻 Utilisation

Ouvrez simplement simulateur_couches_minces.html ou 	p_couches_minces_fr.html dans n'importe quel navigateur moderne (Edge, Chrome, Firefox, Safari). Aucune installation ni serveur requis.
