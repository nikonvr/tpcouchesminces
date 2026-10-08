/* =============================================================================
   EXTRACTION DU CODE RÉEL DEPUIS LE FICHIER HTML DU SIMULATEUR
   -----------------------------------------------------------------------------
   Les tests ne doivent jamais porter sur une copie du code : une copie dérive.
   Ce module lit `simulateur_couches_minces.html` à chaque exécution et en
   extrait les fonctions à tester, repérées PAR LEUR NOM et délimitées par
   équilibrage des accolades — donc insensibles aux numéros de ligne.

   Le DOM est remplacé par des bouchons minimaux : les fonctions extraites sont
   purement numériques, mais certaines lisent un champ de saisie pour un seuil.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RACINE = path.resolve(__dirname, '..', '..');
/* La variable d'environnement TP_SIMULATEUR permet de viser un autre fichier —
   la copie hors ligne, ou une version corrigée que l'on veut valider avant de
   la retenir. Sans elle, on teste le simulateur de référence. */
const SIMULATEUR = process.env.TP_SIMULATEUR
    ? path.resolve(process.env.TP_SIMULATEUR)
    : path.join(RACINE, 'simulateur_couches_minces.html');

/* Blocs à extraire, dans l'ordre où ils doivent être évalués. Chaque entrée est
   [type, nom] ; le type sert uniquement à construire le motif de début. */
const BLOCS = [
    ['const', 'Complex'],
    ['const', 'Garde'],
    ['const', 'MATERIALS_DB'],
    ['function', 'interpolateTable'],
    ['function', 'pchip'],
    ['function', 'getMediumIndex'],
    ['function', 'getPhysicalThicknessNm'],
    ['function', 'computeTMMPoint'],
    ['function', 'multiply2x2'],
    ['function', 'computeRTFromMatrix'],
    ['function', 'createSeededRandom'],
    ['function', 'standardNormalFrom'],
    ['function', 'quantile'],
    ['function', 'wilsonInterval'],
    ['function', 'qualificationVerdict'],
    ['function', 'reviewAssumptionSignature'],
    ['function', 'pairedYieldDifference'],
    ['function', 'unpairedYieldDifference'],
    ['function', 'reviewPairingStatus'],
    ['function', 'cleanThresholdNm'],
    ['function', 'bfgsBoundsNm'],
    ['function', 'compactLayerList'],
    ['function', 'bfgsDescent'],
    ['function', 'parseLayerSelection'],
];

function litSimulateur() {
    if (!fs.existsSync(SIMULATEUR)) {
        throw new Error(`Fichier introuvable : ${SIMULATEUR}`);
    }
    return fs.readFileSync(SIMULATEUR, 'utf8');
}

/* Concatène le contenu de toutes les balises <script> sans attribut src. */
function scriptsDe(html) {
    const morceaux = [];
    const re = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) morceaux.push(m[1]);
    if (!morceaux.length) throw new Error('Aucun <script> interne trouvé.');
    return morceaux.join('\n');
}

/* Renvoie l'indice du caractère suivant le bloc ouvert à `depart`, en
   équilibrant { } tout en ignorant chaînes, gabarits, regex et commentaires. */
function finDeBloc(src, depart) {
    let i = depart;
    let profondeur = 0;
    let vu = false;
    while (i < src.length) {
        const c = src[i];
        const suivant = src[i + 1];

        if (c === '/' && suivant === '/') {                 // commentaire ligne
            i = src.indexOf('\n', i);
            if (i === -1) break;
            continue;
        }
        if (c === '/' && suivant === '*') {                 // commentaire bloc
            i = src.indexOf('*/', i + 2);
            if (i === -1) break;
            i += 2;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') {          // chaîne
            const guillemet = c;
            i++;
            while (i < src.length) {
                if (src[i] === '\\') { i += 2; continue; }
                if (src[i] === guillemet) break;
                i++;
            }
            i++;
            continue;
        }
        if (c === '{') { profondeur++; vu = true; i++; continue; }
        if (c === '}') {
            profondeur--;
            i++;
            if (vu && profondeur === 0) {
                // Consomme un éventuel « ; » de fin de déclaration.
                while (i < src.length && /[\s;]/.test(src[i])) {
                    if (src[i] === ';') { i++; break; }
                    i++;
                }
                return i;
            }
            continue;
        }
        i++;
    }
    throw new Error('Accolades non équilibrées lors de l’extraction.');
}

function extraitBloc(src, type, nom) {
    const motif = type === 'function'
        ? new RegExp(`(^|\\n)\\s*function\\s+${nom}\\s*\\(`)
        : new RegExp(`(^|\\n)\\s*const\\s+${nom}\\s*=`);
    const m = motif.exec(src);
    if (!m) throw new Error(`Bloc introuvable dans le simulateur : ${type} ${nom}`);
    const debut = m.index + m[1].length;
    const fin = finDeBloc(src, debut);
    return src.slice(debut, fin);
}

/* Bouchons : juste assez de DOM pour que les seuils lus dans l'interface
   retombent sur leur valeur par défaut documentée. Les champs sont exposés
   (`__champs`) : un test peut y écrire, par exemple, un seuil de nettoyage
   (`M.__champs.inpCleanThreshold = '0.2'`) pour éprouver une autre valeur. */
const BOUCHONS = `
    const __champs = {};
    const document = {
        getElementById: (id) => (id in __champs ? { value: __champs[id] } : null),
    };
    let currentLang = 'fr';
    const appState = { layers: [] };
    const performance = { now: () => 0 };
`;

/**
 * Charge le moteur réel du simulateur dans un contexte isolé.
 * @returns {object} les fonctions extraites, plus `__source` (texte brut).
 */
function chargeMoteur() {
    const html = litSimulateur();
    const src = scriptsDe(html);

    const blocs = BLOCS.map(([type, nom]) => extraitBloc(src, type, nom));
    const noms = BLOCS.map(([, nom]) => nom);

    const code = `${BOUCHONS}\n${blocs.join('\n\n')}\n;({ ${noms.join(', ')}, __champs });`;

    const contexte = vm.createContext({ Math, Number, Array, JSON, String, Object, isNaN, parseFloat, parseInt });
    let api;
    try {
        api = vm.runInContext(code, contexte, { filename: 'simulateur-extrait.js' });
    } catch (e) {
        throw new Error(`Le code extrait ne s’évalue pas : ${e.message}`);
    }
    api.__source = src;
    api.__html = html;
    return api;
}

module.exports = { chargeMoteur, litSimulateur, scriptsDe, RACINE, SIMULATEUR };
