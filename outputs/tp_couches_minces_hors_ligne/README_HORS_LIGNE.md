# TP Couches Minces Optiques — distribution hors ligne

**Révision du corpus :** 30 août 2026  
**État :** distribution consolidée et recette validée

## Démarrage

1. conserver le dossier complet sans déplacer séparément les sous-dossiers `vendor` ou `outputs` ;
2. ouvrir `index.html` dans un navigateur récent ;
3. choisir le simulateur, l’énoncé français ou anglais, le cours ou le classeur Excel.

Aucune connexion n’est nécessaire pour l’interface, les graphes, les icônes, les polices ou les équations. Les liens vers les références scientifiques externes nécessitent naturellement Internet lorsqu’on choisit de les ouvrir.

## Contenu

- `simulateur_couches_minces.html` : simulateur TMM bilingue ;
- `tp_couches_minces_fr.html` : énoncé français Q1–Q32, avec qualification de fabricabilité et de robustesse ;
- `tp_couches_minces_en.html` : énoncé anglais parallèle ;
- `theorie en francais.html` : cours théorique ;
- `outputs/tp_couches_minces/squelette_excel_couches_minces.xlsx` : classeur Q12/Q14 ;
- `vendor` : bibliothèques, polices et licences tierces locales ;
- `SHA256SUMS.txt` : empreintes de contrôle de tous les fichiers de contenu distribués.

## Versions figées

| Composant | Version |
|---|---:|
| Tailwind CSS | 3.4.19 |
| Chart.js | 4.4.1 |
| Lucide | 1.35.0 |
| MathJax | 3.2.2 |
| Polices @fontsource | 5.3.0 |

Les licences correspondantes sont conservées dans `vendor/licenses`.

## Recette exécutée le 30 août 2026

- chargement local des quatre pages sans bibliothèque externe et sans erreur de console ;
- rendu MathJax vérifié sur le simulateur, les deux énoncés et le cours théorique ;
- chargement des polices locales vérifié sur les quatre pages ;
- Chart.js et Lucide opérationnels ;
- prescription Fresnel : 18 couches, seules les couches 16 à 18 sont optimisées par BFGS ;
- optimisation BFGS Fresnel : les couches 1 à 15 restent strictement inchangées et seules les couches 16 à 18 évoluent ;
- borne basse BFGS alignée sur le seuil de nettoyage, fixé à 2 nm pour la prescription Fresnel ;
- classeur Q12/Q14 présent et accessible depuis les énoncés ;
- analyseur de bandes limité aux mesures de R, T ou A ; aucun réglage de mérite dans cette fenêtre ;
- indépendance vérifiée entre les bandes de mesure et le mérite $Q_r$ de l'optimiseur ;
- fonction d'aiguille $\pi(z)$ tracée numériquement au pas de 5 nm avec une perturbation de 0,1 nm, puis insertion et étape BFGS enchaînées automatiquement ;
- zoom spectral validé à la molette et par sélection rectangulaire, avec restauration de la vue initiale ;
- sélecteur BFGS validé en modes « toutes les couches » et « couches spécifiques » ;
- mérites non pertinents masqués selon l'exercice ; en mode libre, seule la cible construite par l'utilisateur est disponible ;
- Comparateur A/B de revue de conception vérifié : instantanés côte à côte, contrôle d'appariement par les hypothèses et la graine, refus explicite des comparaisons non homogènes ;
- qualification statistique validée à $N=100$ pour le contrôle rapide et $N=1000$ pour la décision finale, sans valeur de réponse fournie à l'étudiant ;
- structure validée : Q1–Q32 dans chaque langue, sans identifiant HTML dupliqué ni renvoi vers un exercice inexistant ;
- distribution minimale validée : 42 fichiers de contenu couverts par le manifeste, sans bibliothèque historique ni ressource chargée inutilement.

## Contrôle d’intégrité

Sous PowerShell, depuis ce dossier :

```powershell
Get-Content .\SHA256SUMS.txt | ForEach-Object {
    $hash, $file = $_ -split '  ', 2
    [pscustomobject]@{
        Fichier = $file
        Conforme = (Get-FileHash -Algorithm SHA256 -LiteralPath $file).Hash -eq $hash
    }
}
```

Tous les résultats doivent afficher `True`.

## Point restant avant une campagne Fresnel

Ajouter au dossier de campagne les données propres au dépôt réel : prescription validée, spectre nominal, spectre mesuré, matériaux effectivement utilisés, paramètres du contrôleur quartz et consignes de sécurité. Ces éléments instrumentaux ne peuvent pas être figés génériquement dans cette distribution pédagogique.
