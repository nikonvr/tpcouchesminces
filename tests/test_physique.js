/* =============================================================================
   TESTS DU MOTEUR PHYSIQUE (TMM)
   -----------------------------------------------------------------------------
   Le moteur réellement embarqué dans simulateur_couches_minces.html est extrait
   puis confronté à :
     A. son modèle de dispersion, réécrit indépendamment ;
     B. les formules fermées de Fresnel, de la lame quart d'onde et du miroir ;
     C. une récursion d'Airy/Rouard (algorithme différent des matrices d'Abelès) ;
     D. des lois physiques qui ne dépendent d'aucune implémentation.

   Lancement :  node tests/test_physique.js
   ========================================================================== */
'use strict';

const { chargeMoteur } = require('./lib/extraction.js');
const R = require('./lib/reference.js');
const V = require('./lib/verif.js');

const M = chargeMoteur();

/* ------------------------------------------------------------- utilitaires */

const etat = (o) => Object.assign({
    superstrat: 'Air', substrat: 'BK7',
    customSuperN: 1, customSubN: 1.5, customSubK: 0,
    designL0: 550, designIncDeg: 0,
    layers: [], considerBackside: false,
}, o);

/** Empilement symbolique « H L 2H … » en couches QWOT, ordre de dépôt. */
function empilement(formule) {
    if (!formule.trim()) return [];
    return formule.trim().split(/\s+/).map(jeton => ({
        matId: jeton.endsWith('H') ? 'ZnS_fresnel' : 'YF3_fresnel',
        val: parseFloat(jeton.slice(0, -1) || '1'),
        unit: 'QWOT',
        locked: false,
    }));
}

/** Épaisseurs physiques telles que le simulateur les calcule. */
const epaisseurs = (couches, l0 = 550) =>
    couches.map(c => M.getPhysicalThicknessNm(c, l0, 0, 1.0));

/** Indices (n, k ≥ 0) tels que le simulateur les renvoie. */
function indiceSim(cle, lambda) {
    const c = M.getMediumIndex(cle, lambda, 1.5, 0);
    return { n: c.r, k: c.i };
}

/** Traduit un empilement du simulateur en couches pour la référence. */
function pourReference(couches, ds, lambda) {
    return couches.map((c, i) => {
        const idx = indiceSim(c.matId, lambda);
        return { n: idx.n, k: idx.k, d: ds[i] };
    });
}

const FORMULE_FRESNEL = 'H L 2H L H L H L 2H L H L H L 2H L H L';
const LAMBDAS = [430, 440, 450, 470, 490, 510, 532, 550, 570, 600, 633, 650, 680, 700];

/* ========================================================================== */
V.suite('TESTS DU MOTEUR PHYSIQUE — simulateur_couches_minces.html');

/* --------------------------------------------------------- A. dispersions */
V.groupe('A. Modèle de dispersion (réécrit indépendamment)');
{
    const ecartsBk7 = [], ecartsH = [], ecartsL = [];
    for (let l = 350; l <= 800; l += 0.5) {
        const a = indiceSim('BK7', l), b = R.bk7(l);
        ecartsBk7.push([Math.hypot(a.n - b.n, a.k - b.k), `λ=${l}`]);
        const h = indiceSim('ZnS_fresnel', l), hr = R.zns(l);
        ecartsH.push([Math.hypot(h.n - hr.n, h.k - hr.k), `λ=${l}`]);
        const y = indiceSim('YF3_fresnel', l), yr = R.yf3(l);
        ecartsL.push([Math.hypot(y.n - yr.n, y.k - yr.k), `λ=${l}`]);
    }
    V.serieProche('BK7 suit bien le Sellmeier de Schott', ecartsBk7, 1e-12);
    V.serieProche('ZnS suit bien une PCHIP monotone sur la table Fresnel', ecartsH, 1e-12);
    V.serieProche('YF3 suit bien une PCHIP monotone sur la table Fresnel', ecartsL, 1e-12);

    // La monotonie est la raison d'être de PCHIP : k ne doit jamais devenir négatif.
    let kNegatif = 0, depassement = 0;
    for (let l = 350; l <= 800; l += 0.25) {
        const h = indiceSim('ZnS_fresnel', l);
        if (h.k < 0) kNegatif++;
        if (h.k > 0.2379 + 1e-12) depassement++;
    }
    V.verifie('l’interpolation ne produit jamais k < 0', kNegatif === 0, `${kNegatif} points`);
    V.verifie('l’interpolation ne dépasse jamais les données (pas de Runge)',
        depassement === 0, `${depassement} points`);

    // Épaisseurs quart d'onde du préréglage Fresnel.
    const ds = epaisseurs(empilement(FORMULE_FRESNEL));
    const nH = indiceSim('ZnS_fresnel', 550).n;
    const nL = indiceSim('YF3_fresnel', 550).n;
    V.proche('QWOT de H vaut λ₀/(4·n_H)', ds[0], 550 / (4 * nH), 1e-9, ' nm');
    V.proche('QWOT de L vaut λ₀/(4·n_L)', ds[1], 550 / (4 * nL), 1e-9, ' nm');
    V.proche('2H vaut exactement le double de H', ds[2], 2 * ds[0], 1e-9, ' nm');
}

/* ------------------------------------------------------ B. formules fermées */
V.groupe('B. Formules fermées (vérités de manuel)');
{
    // Dioptre nu air/BK7, incidence normale et oblique, S et P séparément.
    const ecarts = [];
    for (const lambda of [400, 500, 550, 633, 700]) {
        const nb = indiceSim('BK7', lambda).n;
        for (const theta of [0, 10, 25, 40, 56.6, 70, 80]) {
            const p = M.computeTMMPoint(lambda, theta, etat({}));
            const f = R.fresnelDioptre(1, nb, theta);
            ecarts.push([Math.abs(p.Rs - f.Rs), `Rs λ=${lambda} θ=${theta}`]);
            ecarts.push([Math.abs(p.Rp - f.Rp), `Rp λ=${lambda} θ=${theta}`]);
        }
    }
    V.serieProche('dioptre air/BK7 conforme aux coefficients de Fresnel', ecarts, 1e-12);

    // Angle de Brewster : Rp doit s'annuler à arctan(n).
    const nb550 = indiceSim('BK7', 550).n;
    const brewster = Math.atan(nb550) * 180 / Math.PI;
    const pB = M.computeTMMPoint(550, brewster, etat({}));
    V.proche('Rp s’annule à l’angle de Brewster arctan(n)', pB.Rp, 0, 1e-14);
    V.verifie('Rs ne s’annule pas à l’angle de Brewster', pB.Rs > 0.05, `Rs=${pB.Rs}`);

    // Lame quart d'onde à sa longueur d'onde de conception.
    for (const [mat, lambda0] of [['AR_Theorique', 550], ['YF3_fresnel', 550]]) {
        const couche = [{ matId: mat, val: 1, unit: 'QWOT', locked: false }];
        const p = M.computeTMMPoint(lambda0, 0, etat({ layers: couche }));
        const attendu = R.quartOndeSimple(1, indiceSim(mat, lambda0).n, indiceSim('BK7', lambda0).n);
        V.proche(`lame quart d’onde ${mat} conforme à (n₀n_s − n₁²)²/(n₀n_s + n₁²)²`,
            p.R_avg, attendu, 1e-12);
    }

    // Miroir quart d'onde (HL)^p H pour plusieurs périodes.
    for (const periodes of [3, 4, 5, 6]) {
        const formule = ('H L '.repeat(periodes)) + 'H';
        const couches = empilement(formule);
        const p = M.computeTMMPoint(550, 0, etat({ layers: couches }));
        const attendu = R.miroirQuartOnde(1, indiceSim('ZnS_fresnel', 550).n,
            indiceSim('YF3_fresnel', 550).n, indiceSim('BK7', 550).n, periodes);
        V.proche(`miroir (HL)^${periodes}H : ${2 * periodes + 1} couches, R conforme à l’admittance équivalente`,
            p.R_avg, attendu, 1e-10);
    }

    // Métal semi-infini : le dioptre nu doit donner la formule de Fresnel exacte.
    for (const mat of ['Al', 'Au']) {
        const idx = indiceSim(mat, 550);
        const p = M.computeTMMPoint(550, 0, etat({ substrat: mat }));
        V.proche(`dioptre air/${mat} conforme à ((n−1)²+k²)/((n+1)²+k²)`,
            p.R_avg, R.metalSemiInfini(idx.n, idx.k), 1e-9);
    }
}

/* ------------------------------------------- C. algorithme indépendant */
V.groupe('C. Récursion d’Airy/Rouard (algorithme différent des matrices d’Abelès)');
{
    const cas = [
        ['dioptre nu', ''],
        ['monocouche L', 'L'],
        ['bicouche H L', 'H L'],
        ['miroir 13 couches', 'H L H L H L H L H L H L H'],
        ['filtre Fresnel 18 couches', FORMULE_FRESNEL],
    ];
    for (const [nom, formule] of cas) {
        const couches = empilement(formule);
        const ds = epaisseurs(couches);
        const ecarts = [];
        for (const lambda of LAMBDAS) {
            for (const theta of [0, 15, 30, 45]) {
                const p = M.computeTMMPoint(lambda, theta, etat({ layers: couches }));
                const ref = pourReference(couches, ds, lambda);
                const sup = { n: 1, k: 0 };
                const sub = indiceSim('BK7', lambda);
                const s = R.rouard(lambda, theta, ref, sup, sub, 's');
                const pp = R.rouard(lambda, theta, ref, sup, sub, 'p');
                const ctx = `λ=${lambda} θ=${theta}`;
                ecarts.push([Math.abs(p.Rs - s.R), `Rs ${ctx}`]);
                ecarts.push([Math.abs(p.Rp - pp.R), `Rp ${ctx}`]);
                ecarts.push([Math.abs(p.Ts - s.T), `Ts ${ctx}`]);
                ecarts.push([Math.abs(p.Tp - pp.T), `Tp ${ctx}`]);
            }
        }
        V.serieProche(`${nom} : Abelès et Airy donnent le même résultat`, ecarts, 1e-11);
    }
}

/* ------------------------------------------------------- D. lois physiques */
V.groupe('D. Lois physiques (indépendantes de toute implémentation)');
{
    /* D1. À incidence normale, S et P désignent la même onde : Rs doit être
       rigoureusement égal à Rp, quel que soit le matériau. C'est le test le
       plus discriminant du lot, car il ne suppose aucune valeur de référence. */
    const ecartsSP = [];
    const configs = [
        ['filtre Fresnel', empilement(FORMULE_FRESNEL)],
        ['ZnS 300 nm', [{ matId: 'ZnS_fresnel', val: 300, unit: 'nm', locked: false }]],
        ['Al 20 nm', [{ matId: 'Al', val: 20, unit: 'nm', locked: false }]],
        ['Au 20 nm', [{ matId: 'Au', val: 20, unit: 'nm', locked: false }]],
        ['Ge 50 nm', [{ matId: 'Ge', val: 50, unit: 'nm', locked: false }]],
        ['Si 50 nm', [{ matId: 'Si', val: 50, unit: 'nm', locked: false }]],
    ];
    for (const [nom, couches] of configs) {
        for (let lambda = 350; lambda <= 800; lambda += 10) {
            const p = M.computeTMMPoint(lambda, 0, etat({ layers: couches }));
            ecartsSP.push([Math.abs(p.Rs - p.Rp), `${nom} R λ=${lambda}`]);
            ecartsSP.push([Math.abs(p.Ts - p.Tp), `${nom} T λ=${lambda}`]);
        }
    }
    V.serieProche('à incidence normale, S et P sont indiscernables', ecartsSP, 1e-12);

    /* D2. Milieu passif : R + T ne peut pas dépasser 1. On recalcule la somme
       à partir de R et T, sans utiliser A — que le simulateur définit comme
       le reste 1 − R − T, ce qui rendrait le test tautologique. */
    const violations = [];
    for (const [nom, couches] of configs) {
        for (let lambda = 350; lambda <= 800; lambda += 5) {
            for (const theta of [0, 30, 60]) {
                const p = M.computeTMMPoint(lambda, theta, etat({ layers: couches }));
                const somme = p.R_avg + p.T_avg;
                if (somme > 1 + 1e-9) violations.push(`${nom} λ=${lambda} θ=${theta} : R+T=${(100 * somme).toFixed(3)} %`);
            }
        }
    }
    V.verifie('aucun empilement ne renvoie plus d’énergie qu’il n’en reçoit (R + T ≤ 1)',
        violations.length === 0,
        violations.length ? `${violations.length} violation(s), ex. ${violations[0]}` : '');

    /* D3. Milieu transparent : R + T doit valoir exactement 1. */
    const ecartsConservation = [];
    const fresnel = empilement(FORMULE_FRESNEL);
    for (let lambda = 500; lambda <= 800; lambda += 1) {
        for (const theta of [0, 20, 45]) {
            const p = M.computeTMMPoint(lambda, theta, etat({ layers: fresnel }));
            ecartsConservation.push([Math.abs(p.R_avg + p.T_avg - 1), `λ=${lambda} θ=${theta}`]);
        }
    }
    V.serieProche('en domaine transparent, R + T = 1 à la précision machine',
        ecartsConservation, 1e-12);

    /* D4. Couche métallique très épaisse : le composant devient un miroir
       semi-infini, sa réflectivité doit rejoindre la formule de Fresnel. */
    for (const mat of ['Al', 'Au']) {
        const idx = indiceSim(mat, 550);
        const p = M.computeTMMPoint(550, 0, etat({
            layers: [{ matId: mat, val: 500, unit: 'nm', locked: false }],
        }));
        V.proche(`couche épaisse de ${mat} (500 nm) rejoint le métal semi-infini`,
            p.R_avg, R.metalSemiInfini(idx.n, idx.k), 1e-6);
        V.proche(`couche épaisse de ${mat} ne transmet plus rien`, p.T_avg, 0, 1e-9);
    }

    /* D5. Réflexion totale interne BK7 → air. */
    const nBk7 = indiceSim('BK7', 550).n;
    const critique = Math.asin(1 / nBk7) * 180 / Math.PI;
    V.proche('angle critique BK7/air conforme à arcsin(1/n)', critique, 41.188, 5e-3, '°');
    for (const theta of [critique + 0.5, 45, 60, 80]) {
        const p = M.computeTMMPoint(550, theta, etat({ superstrat: 'BK7', substrat: 'Air' }));
        V.proche(`réflexion totale à ${theta.toFixed(1)}° : Rs = 1`, p.Rs, 1, 1e-12);
        V.proche(`réflexion totale à ${theta.toFixed(1)}° : Rp = 1`, p.Rp, 1, 1e-12);
        V.proche(`réflexion totale à ${theta.toFixed(1)}° : T ≈ 0`, p.T_avg, 0, 1e-9);
    }
    const pAvant = M.computeTMMPoint(550, critique - 1, etat({ superstrat: 'BK7', substrat: 'Air' }));
    V.verifie('sous l’angle critique, la transmission n’est pas nulle',
        pAvant.T_avg > 0.01, `T=${pAvant.T_avg}`);

    /* D6. Monotonie de l'atténuation : une couche absorbante plus épaisse ne
       peut pas transmettre davantage. */
    let croissances = 0, precedent = Infinity;
    for (let d = 10; d <= 400; d += 10) {
        const p = M.computeTMMPoint(550, 0, etat({
            layers: [{ matId: 'Au', val: d, unit: 'nm', locked: false }],
        }));
        if (p.T_avg > precedent + 1e-12) croissances++;
        precedent = p.T_avg;
    }
    V.verifie('la transmission d’une couche d’or décroît avec l’épaisseur',
        croissances === 0, `${croissances} remontée(s)`);

    /* D7. Ordre de dépôt : inverser un empilement non symétrique doit changer
       le résultat — sinon l'ordre serait ignoré. */
    const asym = empilement('H L L L');
    const inv = asym.slice().reverse();
    const pa = M.computeTMMPoint(550, 0, etat({ layers: asym }));
    const pb = M.computeTMMPoint(550, 0, etat({ layers: inv }));
    V.verifie('l’ordre de dépôt influe bien sur le spectre',
        Math.abs(pa.R_avg - pb.R_avg) > 1e-6,
        `écart ${Math.abs(pa.R_avg - pb.R_avg).toExponential(2)}`);

    /* D8. Une couche d'épaisseur nulle ne change rien. */
    const avec = empilement(FORMULE_FRESNEL).concat(
        [{ matId: 'ZnS_fresnel', val: 0, unit: 'nm', locked: false }]);
    const sans = empilement(FORMULE_FRESNEL);
    const p1 = M.computeTMMPoint(550, 0, etat({ layers: sans }));
    const p2 = M.computeTMMPoint(550, 0, etat({ layers: avec }));
    V.proche('une couche d’épaisseur nulle est neutre', p2.R_avg, p1.R_avg, 1e-14);
}

/* ----------------------------------------------- E. prescription Fresnel */
V.groupe('E. Prescription de fabrication Institut Fresnel');
{
    const couches = empilement(FORMULE_FRESNEL);
    V.verifie('la prescription comporte exactement 18 couches', couches.length === 18,
        `${couches.length} couches`);
    const motif = couches.map(c => (c.val === 2 ? '2' : '') +
        (c.matId === 'ZnS_fresnel' ? 'H' : 'L')).join(' ');
    V.verifie('l’alternance H/L et les trois couches doubles sont conformes',
        motif === FORMULE_FRESNEL && couches.filter(c => c.val === 2).length === 3,
        `motif lu : ${motif}`);
    V.verifie('aucune couche n’utilise un matériau hors ZnS/YF3',
        couches.every(c => c.matId === 'ZnS_fresnel' || c.matId === 'YF3_fresnel'));
    V.verifie('les trois couches doubles sont en positions 3, 9 et 15',
        [2, 8, 14].every(i => couches[i].val === 2),
        `positions doubles : ${couches.map((c, i) => c.val === 2 ? i + 1 : null).filter(Boolean).join(',')}`);

    // Le spectre doit être fini et borné sur tout le domaine de travail.
    const ds = epaisseurs(couches);
    let anomalies = 0;
    for (let lambda = 430; lambda <= 700; lambda += 0.5) {
        const p = M.computeTMMPoint(lambda, 0, etat({ layers: couches }));
        if (!Number.isFinite(p.R_avg) || !Number.isFinite(p.T_avg)) anomalies++;
        if (p.R_avg < -1e-12 || p.R_avg > 1 + 1e-12) anomalies++;
        if (p.T_avg < -1e-12 || p.T_avg > 1 + 1e-12) anomalies++;
    }
    V.verifie('le spectre est fini et borné sur 430–700 nm', anomalies === 0,
        `${anomalies} anomalie(s)`);

    // Moyennes de bande et Qr, recalculées ici sur la grille publiée (0,5 nm).
    const moyenne = (lo, hi) => {
        let s = 0, n = 0;
        for (let l = lo; l <= hi + 1e-9; l += 0.5) {
            s += M.computeTMMPoint(l, 0, etat({ layers: couches })).T_avg * 100;
            n++;
        }
        return s / n;
    };
    const tBas = moyenne(460, 500), tPasse = moyenne(535, 565), tHaut = moyenne(620, 680);
    const qr = 2 * tPasse / (tBas + tHaut);
    console.log(`      T̄(460–500) = ${tBas.toFixed(4)} %   T̄(535–565) = ${tPasse.toFixed(4)} %   ` +
                `T̄(620–680) = ${tHaut.toFixed(4)} %   Qr = ${qr.toFixed(3)}`);
    V.verifie('la bande passante transmet largement', tPasse > 90, `${tPasse.toFixed(2)} %`);
    V.verifie('les deux bandes de réjection bloquent', tBas < 5 && tHaut < 5,
        `${tBas.toFixed(2)} % / ${tHaut.toFixed(2)} %`);
    V.verifie('Qr est fini et positif', Number.isFinite(qr) && qr > 0, String(qr));

    // Le nombre de points de chaque bande doit correspondre au pas publié.
    const points = (lo, hi, pas) => Math.floor((hi - lo) / pas + 1e-9) + 1;
    V.verifie('bande 460–500 nm échantillonnée à 0,5 nm → 81 points', points(460, 500, 0.5) === 81);
    V.verifie('bande 535–565 nm échantillonnée à 0,5 nm → 61 points', points(535, 565, 0.5) === 61);
    V.verifie('bande 620–680 nm échantillonnée à 0,5 nm → 121 points', points(620, 680, 0.5) === 121);
}

/* ------------------------------- F. milieux semi-infinis absorbants ou évanescents */
V.groupe('F. Substrat absorbant et milieu de sortie évanescent (convention N = n − iκ)');
{
    /* Le substrat et le superstrat doivent suivre EXACTEMENT la convention des
       couches. Un substrat absorbant laissé dans la convention opposée ne se
       voit pas sur le dioptre nu (|r| y est insensible), mais fausse R dès la
       première couche déposée. Référence : récursion d'Airy en convention
       N = n + iκ, indépendante du code testé. */
    const zns = [{ matId: 'ZnS_fresnel', val: 1, unit: 'QWOT', locked: false }];
    const dZns = epaisseurs(zns);

    // Contre-exemple historique : ZnS 1 QWOT (550 nm) sur Si, incidence normale.
    for (const [lambda, attendu] of [[400, 32.29], [350, 41.86]]) {
        const p = M.computeTMMPoint(lambda, 0, etat({ substrat: 'Si', layers: zns }));
        const ref = R.rouard(lambda, 0, pourReference(zns, dZns, lambda), { n: 1, k: 0 },
            indiceSim('Si', lambda), 's');
        V.proche(`ZnS 1 QWOT sur Si à ${lambda} nm : R conforme à Airy`, p.R_avg, ref.R, 1e-12);
        V.proche(`ZnS 1 QWOT sur Si à ${lambda} nm : R = ${attendu} % (valeur de référence)`,
            100 * p.R_avg, attendu, 0.01, ' %');
    }

    // Balayage : deux substrats absorbants, trois empilements, S et P séparément.
    const substrats = [
        ['Si', etat({ substrat: 'Si' }), (l) => indiceSim('Si', l)],
        ['indice personnalisé 2,0 + 0,8i', etat({ substrat: 'Custom', customSubN: 2.0, customSubK: 0.8 }),
            () => ({ n: 2.0, k: 0.8 })],
        ['indice personnalisé 1,5 + 3i (métallique)', etat({ substrat: 'Custom', customSubN: 1.5, customSubK: 3.0 }),
            () => ({ n: 1.5, k: 3.0 })],
    ];
    const empilements = [
        ['ZnS 1 QWOT', zns],
        ['H L H', empilement('H L H')],
        ['Au 15 nm + L', [{ matId: 'Au', val: 15, unit: 'nm', locked: false }, ...empilement('L')]],
    ];
    for (const [nomSub, base, indiceSub] of substrats) {
        const ecarts = [];
        let energie = 0, reste = 0;
        for (const [, couches] of empilements) {
            const ds = epaisseurs(couches);
            for (const lambda of [350, 380, 400, 450, 500, 550, 633, 700, 800]) {
                for (const theta of [0, 30, 60, 75]) {
                    const p = M.computeTMMPoint(lambda, theta, { ...base, layers: couches });
                    const ref = pourReference(couches, ds, lambda);
                    const sub = indiceSub(lambda);
                    const s = R.rouard(lambda, theta, ref, { n: 1, k: 0 }, sub, 's');
                    const pp = R.rouard(lambda, theta, ref, { n: 1, k: 0 }, sub, 'p');
                    const ctx = `λ=${lambda} θ=${theta}`;
                    ecarts.push([Math.abs(p.Rs - s.R), `Rs ${ctx}`]);
                    ecarts.push([Math.abs(p.Rp - pp.R), `Rp ${ctx}`]);
                    ecarts.push([Math.abs(p.Ts - s.T), `Ts ${ctx}`]);
                    ecarts.push([Math.abs(p.Tp - pp.T), `Tp ${ctx}`]);
                    // Bilan d'énergie, polarisation par polarisation, sans passer par A.
                    if (p.Rs + p.Ts > 1 + 1e-12 || p.Rp + p.Tp > 1 + 1e-12) energie++;
                    // A est bien le complément exact : R + T + A = 1.
                    if (Math.abs(p.R_avg + p.T_avg + p.A_avg - 1) > 1e-12) reste++;
                }
            }
        }
        V.serieProche(`substrat ${nomSub} : Abelès et Airy concordent en S et en P (R et T)`, ecarts, 1e-11);
        V.verifie(`substrat ${nomSub} : R + T ≤ 1 dans chaque polarisation`, energie === 0,
            `${energie} violation(s)`);
        V.verifie(`substrat ${nomSub} : R + T + A = 1 à la précision machine`, reste === 0,
            `${reste} écart(s)`);
    }

    // Milieu de sortie évanescent recouvert d'une couche absorbante (configuration
    // de Kretschmann) : la branche décroissante doit être celle des couches.
    {
        const au = [{ matId: 'Au', val: 50, unit: 'nm', locked: false }];
        const ecarts = [];
        for (const lambda of [550, 633, 700]) {
            const nb = indiceSim('BK7', lambda);
            for (const theta of [30, 42, 45, 50, 60, 70]) {
                const p = M.computeTMMPoint(lambda, theta, etat({ superstrat: 'BK7', substrat: 'Air', layers: au }));
                const ref = pourReference(au, [50], lambda);
                const s = R.rouard(lambda, theta, ref, { n: nb.n, k: 0 }, { n: 1, k: 0 }, 's');
                const pp = R.rouard(lambda, theta, ref, { n: nb.n, k: 0 }, { n: 1, k: 0 }, 'p');
                ecarts.push([Math.abs(p.Rs - s.R), `Rs λ=${lambda} θ=${theta}`]);
                ecarts.push([Math.abs(p.Rp - pp.R), `Rp λ=${lambda} θ=${theta}`]);
            }
        }
        V.serieProche('BK7 / Au 50 nm / air (sortie évanescente) : Abelès et Airy concordent', ecarts, 1e-11);
    }

    // Réflexion totale avec une couche transparente : R reste exactement 1 (Q9).
    {
        const yf3 = empilement('L');
        const nBk7 = indiceSim('BK7', 633).n;
        const critique = Math.asin(1 / nBk7) * 180 / Math.PI;
        let ecartMax = 0;
        for (const theta of [critique + 1, 50, 65, 80]) {
            const p = M.computeTMMPoint(633, theta, etat({ superstrat: 'BK7', substrat: 'Air', layers: yf3 }));
            ecartMax = Math.max(ecartMax, Math.abs(p.Rs - 1), Math.abs(p.Rp - 1));
        }
        V.proche('réflexion totale à travers une couche transparente : Rs = Rp = 1', ecartMax, 0, 1e-12);
    }
}

process.exit(V.bilan() === 0 ? 0 : 1);
