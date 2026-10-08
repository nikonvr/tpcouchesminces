/* =============================================================================
   TESTS DES GARDE-FOUS
   -----------------------------------------------------------------------------
   Un garde-fou qui ne se déclenche jamais ne protège de rien. Ce module vérifie
   les deux moitiés de la propriété :

     A. SILENCE — en usage normal, aucun garde-fou ne se plaint. Sans quoi
        l'avertissement deviendrait du bruit et serait ignoré.
     B. DÉCLENCHEMENT — sur un défaut délibérément réintroduit dans une COPIE du
        simulateur, le garde-fou parle. C'est la seule preuve qu'il surveille
        vraiment le chemin critique et non une branche morte.

   Le défaut réinjecté en B est celui qui a réellement échappé au contrôle
   historique : conjuguer gamma sans conjuguer N², ce qui rompt l'égalité S/P à
   incidence normale et fabrique de l'énergie dans les couches absorbantes.

   Lancement :  node tests/test_gardefous.js
   ========================================================================== */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { chargeMoteur, litSimulateur, SIMULATEUR } = require('./lib/extraction.js');
const V = require('./lib/verif.js');

const etat = (o) => Object.assign({
    superstrat: 'Air', substrat: 'BK7',
    customSuperN: 1, customSubN: 1.5, customSubK: 0,
    designL0: 550, designIncDeg: 0,
    layers: [], considerBackside: false,
}, o);

const empilement = (formule) => formule.trim().split(/\s+/).map(j => ({
    matId: j.endsWith('H') ? 'ZnS_fresnel' : 'YF3_fresnel',
    val: parseFloat(j.slice(0, -1) || '1'), unit: 'QWOT', locked: false,
}));

const FRESNEL = 'H L 2H L H L H L 2H L H L H L 2H L H L';

V.suite('TESTS DES GARDE-FOUS');

/* ========================================================================== */
V.groupe('A. Silence en usage normal');

const M = chargeMoteur();
V.verifie('le module de garde est bien présent dans le simulateur',
    M.Garde && typeof M.Garde.faute === 'function');
V.verifie('les garde-fous sont actifs par défaut', M.Garde.actif === true);

{
    // Un usage représentatif : balayages spectraux et angulaires sur les
    // empilements du TP, y compris les matériaux absorbants.
    const configs = [
        ['dioptre nu', []],
        ['filtre Fresnel', empilement(FRESNEL)],
        ['miroir 13 couches', empilement('H L H L H L H L H L H L H')],
        ['monocouche AR', [{ matId: 'AR_Theorique', val: 1, unit: 'QWOT', locked: false }]],
        ['ZnS 300 nm', [{ matId: 'ZnS_fresnel', val: 300, unit: 'nm', locked: false }]],
        ['or 20 nm', [{ matId: 'Au', val: 20, unit: 'nm', locked: false }]],
        ['aluminium 100 nm', [{ matId: 'Al', val: 100, unit: 'nm', locked: false }]],
        ['germanium 50 nm', [{ matId: 'Ge', val: 50, unit: 'nm', locked: false }]],
    ];
    let points = 0;
    for (const [, layers] of configs) {
        for (let l = 350; l <= 800; l += 2) {
            for (const th of [0, 15, 30, 45, 60]) {
                M.computeTMMPoint(l, th, etat({ layers }));
                points++;
            }
        }
    }
    // Réflexion totale et face arrière : les deux branches particulières.
    for (const th of [0, 30, 41.2, 45, 70]) {
        M.computeTMMPoint(550, th, etat({ superstrat: 'BK7', substrat: 'Air' }));
    }
    M.computeTMMPoint(550, 0, etat({ considerBackside: true }));
    // Substrat personnalisé absorbant.
    for (const k of [0, 0.1, 1.0, 5.0]) {
        M.computeTMMPoint(550, 30, etat({ substrat: 'Custom', customSubN: 1.5, customSubK: k }));
    }

    V.verifie(`aucun garde-fou ne se déclenche sur ${points} points spectraux réguliers`,
        M.Garde.intact,
        M.Garde.violations.map(v => `${v.code} (${v.nb}×) ${v.detail}`).join(' | '));
}

{
    // L'optimiseur, sur les mêmes cas que le module « algorithmes ».
    M.Garde.reinitialiser();
    const cible = [30, 60, 90, 45];
    const cout = (d) => cible.reduce((s, c, i) => s + (d[i] - c) ** 2, 0);
    M.bfgsDescent([10, 10, 10, 10], [0, 1, 2, 3], cout);
    M.bfgsDescent([200, 200, 200, 200], [0, 2], cout);
    M.bfgsDescent([10, 10, 10, 10], [], cout);
    M.bfgsDescent([100, 100], [0, 1], (d) => d[0] + d[1]);          // pousse vers la borne basse
    M.bfgsDescent([100, 100], [0, 1], (d) => -(d[0] + d[1]));       // pousse vers la borne haute
    V.verifie('aucun garde-fou ne se déclenche sur une optimisation normale',
        M.Garde.intact,
        M.Garde.violations.map(v => `${v.code} ${M.Garde.texteDetail(v.detail, 'fr')}`).join(' | '));
}

{
    /* Aiguille fraîchement insérée (0,1 nm, sous la borne basse). Avant
       correction, si aucun pas n'était accepté, BFGS rendait ce point de départ
       hors bornes et « bfgs_borne_violee » se déclenchait sur un défaut qui
       n'était pas celui de l'optimiseur. Le départ est désormais projeté. */
    M.Garde.reinitialiser();
    M.bfgsDescent([0.1, 80], [0, 1], (d) => d[0]);                  // l'aiguille ne gagne rien à grossir
    M.bfgsDescent([0.1, 0.3, 80], [0, 1, 2], (d) => d[0] + d[1]);   // aiguille et fragment sous la borne
    M.bfgsDescent([50, 1500], [0, 1], (d) => (d[0] - 40) ** 2);     // couche au-delà de 1200 nm
    V.verifie('un départ hors bornes (aiguille de 0,1 nm) ne déclenche aucun garde-fou',
        M.Garde.intact,
        M.Garde.violations.map(v => `${v.code} ${M.Garde.texteDetail(v.detail, 'fr')}`).join(' | '));
}

{
    M.Garde.reinitialiser();
    for (const n of [10, 100, 1000]) {
        for (let x = 0; x <= n; x += Math.max(1, Math.floor(n / 25))) M.wilsonInterval(x, n);
    }
    M.wilsonInterval(0, 0);
    V.verifie('aucun garde-fou ne se déclenche sur les intervalles de Wilson',
        M.Garde.intact,
        M.Garde.violations.map(v => `${v.code} ${v.detail}`).join(' | '));
}

/* ========================================================================== */
V.groupe('B. Déclenchement sur défaut réinjecté');

/** Écrit une copie du simulateur avec une substitution, et charge son moteur. */
function moteurAltere(nom, avant, apres) {
    const src = litSimulateur();
    if (src.indexOf(avant) === -1) {
        throw new Error(`motif introuvable pour « ${nom} » : ${avant.slice(0, 60)}…`);
    }
    const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-garde-'));
    const cible = path.join(dossier, 'simulateur_altere.html');
    fs.writeFileSync(cible, src.replace(avant, apres), 'utf8');
    const memoire = process.env.TP_SIMULATEUR;
    process.env.TP_SIMULATEUR = cible;
    delete require.cache[require.resolve('./lib/extraction.js')];
    const mod = require('./lib/extraction.js');
    let moteur;
    try {
        moteur = mod.chargeMoteur();
    } finally {
        if (memoire === undefined) delete process.env.TP_SIMULATEUR;
        else process.env.TP_SIMULATEUR = memoire;
        delete require.cache[require.resolve('./lib/extraction.js')];
        fs.rmSync(dossier, { recursive: true, force: true });
    }
    return moteur;
}

{
    /* Le défaut historique : gamma conjugué, N² laissé sur l'autre branche.
       eta_p cesse d'être une admittance et l'égalité S/P tombe. */
    const A = moteurAltere('convention d’indice',
        'const eta_p = Complex.div(eps_use, gamma);',
        'const eta_p = Complex.div(eps_c, gamma);');

    for (let l = 350; l <= 500; l += 5) {
        A.computeTMMPoint(l, 0, etat({ layers: empilement(FRESNEL) }));
        A.computeTMMPoint(l, 0, etat({ layers: [{ matId: 'Au', val: 20, unit: 'nm', locked: false }] }));
    }
    const codes = A.Garde.violations.map(v => v.code);
    V.verifie('le défaut de convention est détecté', !A.Garde.intact,
        'aucun garde-fou ne s’est déclenché');
    V.verifie('il est reconnu comme une rupture de l’égalité S/P',
        codes.includes('SP_incidence_normale'), `codes vus : ${codes.join(', ')}`);
    V.verifie('il est aussi reconnu comme une création d’énergie',
        codes.includes('energie_creee') || codes.includes('R_hors_bornes'),
        `codes vus : ${codes.join(', ')}`);
    const sp = A.Garde.violations.find(v => v.code === 'SP_incidence_normale');
    V.verifie('les occurrences sont comptées, pas répétées une par une',
        sp && sp.nb > 1 && A.Garde.journal.size < 10,
        sp ? `${sp.nb} occurrences pour ${A.Garde.journal.size} entrée(s)` : '');
}

{
    /* Un optimiseur qui écrirait dans une couche verrouillée. */
    const B = moteurAltere('écriture hors périmètre',
        '        /* Garde-fous de sortie.',
        '        bestThick[0] = bestThick[0] + 7;\n        /* Garde-fous de sortie.');
    const cible = [30, 60, 90];
    const cout = (d) => cible.reduce((s, c, i) => s + (d[i] - c) ** 2, 0);
    B.bfgsDescent([10, 10, 10], [1, 2], cout);
    const codes = B.Garde.violations.map(v => v.code);
    V.verifie('un déplacement de couche verrouillée est détecté',
        codes.includes('bfgs_couche_verrouillee'), `codes vus : ${codes.join(', ')}`);
}

{
    const cout = (d) => (d[0] - 30) ** 2 + (d[1] - 60) ** 2 + 1;

    /* Un optimiseur qui rendrait un empilement pire que son point de départ. */
    const C = moteurAltere('remontée du coût',
        '        /* Garde-fous de sortie.',
        '        bestCost = coutDepart * 2 + 1;\n        /* Garde-fous de sortie.');
    C.bfgsDescent([200, 200], [0, 1], cout);
    const codesC = C.Garde.violations.map(v => v.code);
    V.verifie('une remontée du coût est détectée',
        codesC.includes('bfgs_cout_remonte'), `codes vus : ${codesC.join(', ') || 'aucun'}`);

    /* Un optimiseur qui annoncerait un mérite meilleur que celui de
       l'empilement qu'il rend — le chiffre finirait dans un compte rendu. */
    const C2 = moteurAltere('mérite annoncé faux',
        '        /* Garde-fous de sortie.',
        '        bestCost = bestCost * 0.5 - 1;\n        /* Garde-fous de sortie.');
    C2.bfgsDescent([200, 200], [0, 1], cout);
    const codesC2 = C2.Garde.violations.map(v => v.code);
    V.verifie('un mérite annoncé incohérent avec l’empilement rendu est détecté',
        codesC2.includes('bfgs_cout_incoherent'), `codes vus : ${codesC2.join(', ') || 'aucun'}`);
}

{
    /* Un intervalle de Wilson qui n'encadrerait pas la proportion observée. */
    const D = moteurAltere('intervalle incohérent',
        'const bas = Math.max(0, center - halfWidth);',
        'const bas = Math.max(0, center - halfWidth * 0.05);');
    for (let x = 0; x <= 100; x += 5) D.wilsonInterval(x, 100);
    const codes = D.Garde.violations.map(v => v.code);
    V.verifie('un intervalle de confiance incohérent est détecté',
        codes.includes('wilson_incoherent'), `codes vus : ${codes.join(', ') || 'aucun'}`);
}

/* ========================================================================== */
V.groupe('C. Comportement du journal');
{
    M.Garde.reinitialiser();
    V.verifie('la remise à zéro vide le journal', M.Garde.intact && M.Garde.journal.size === 0);

    M.Garde.faute('essai', 'premier');
    M.Garde.faute('essai', 'second');
    M.Garde.faute('autre', 'x');
    V.verifie('deux codes distincts donnent deux entrées', M.Garde.journal.size === 2);
    V.verifie('les répétitions d’un même code sont comptées',
        M.Garde.journal.get('essai').nb === 2);
    V.verifie('le premier détail est conservé, pas écrasé',
        M.Garde.journal.get('essai').detail === 'premier');

    // Détail bilingue : affiché à l'utilisateur dans la langue de l'interface.
    M.Garde.faute('bilingue', { fr: 'couche 3 hors bornes', en: 'layer 3 out of bounds' });
    const det = M.Garde.journal.get('bilingue').detail;
    V.verifie('un détail bilingue est rendu dans la langue demandée',
        M.Garde.texteDetail(det, 'fr') === 'couche 3 hors bornes'
        && M.Garde.texteDetail(det, 'en') === 'layer 3 out of bounds');
    V.verifie('un détail neutre (chaîne) est rendu tel quel dans les deux langues',
        M.Garde.texteDetail('R = 1.2', 'en') === 'R = 1.2' && M.Garde.texteDetail('R = 1.2', 'fr') === 'R = 1.2');

    M.Garde.actif = false;
    M.Garde.reinitialiser();
    M.Garde.faute('ignore', 'ne doit pas être journalisé');
    V.verifie('désactiver les garde-fous les rend muets', M.Garde.intact);
    M.Garde.actif = true;
    M.Garde.reinitialiser();
}

/* ========================================================================== */
V.groupe('D. Coût des garde-fous');
{
    /* Micro-mesure : le bruit d'ordonnancement ne peut qu'AJOUTER du temps.
       Le minimum sur plusieurs passes est donc l'estimateur robuste ; une
       moyenne rendrait ce test instable et donc inutile. */
    const couches = empilement(FRESNEL);
    const passe = (actif) => {
        M.Garde.actif = actif;
        const t0 = process.hrtime.bigint();
        for (let i = 0; i < 4000; i++) {
            M.computeTMMPoint(430 + (i % 271), 0, etat({ layers: couches }));
        }
        return Number(process.hrtime.bigint() - t0) / 1e6;
    };
    for (let i = 0; i < 3; i++) { passe(true); passe(false); }      // chauffe
    let avec = Infinity, sans = Infinity;
    for (let i = 0; i < 7; i++) {
        avec = Math.min(avec, passe(true));
        sans = Math.min(sans, passe(false));
    }
    M.Garde.actif = true;
    const surcout = 100 * (avec - sans) / sans;
    console.log(`      4000 points, meilleur de 7 : ${avec.toFixed(1)} ms avec, ` +
                `${sans.toFixed(1)} ms sans (${surcout >= 0 ? '+' : ''}${surcout.toFixed(1)} %)`);
    V.verifie('le surcoût des garde-fous reste sous 15 % sur le chemin critique',
        surcout < 15, `${surcout.toFixed(1)} %`);
}

process.exit(V.bilan() === 0 ? 0 : 1);
