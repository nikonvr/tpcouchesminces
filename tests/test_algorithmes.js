/* =============================================================================
   TESTS DES ALGORITHMES NUMÉRIQUES
   -----------------------------------------------------------------------------
   Optimiseur BFGS, tirage pseudo-aléatoire, loi normale, quantiles, intervalle
   de Wilson, analyse d'une liste de couches. Chaque brique est éprouvée sur des
   cas dont la réponse est connue par ailleurs — fonctions tests classiques de
   l'optimisation, valeurs de référence de la statistique, propriétés de loi.

   Lancement :  node tests/test_algorithmes.js
   ========================================================================== */
'use strict';

const { chargeMoteur } = require('./lib/extraction.js');
const R = require('./lib/reference.js');
const V = require('./lib/verif.js');

const M = chargeMoteur();

V.suite('TESTS DES ALGORITHMES NUMÉRIQUES');

/* ------------------------------------------------------- 1. Wilson */
V.groupe('1. Intervalle de confiance de Wilson à 95 %');
{
    // Réimplémentation indépendante, sur toute la plage utile.
    const ecarts = [];
    for (const n of [10, 50, 100, 500, 1000]) {
        for (let x = 0; x <= n; x += Math.max(1, Math.floor(n / 20))) {
            const a = M.wilsonInterval(x, n);
            const b = R.wilson(x, n);
            ecarts.push([Math.abs(a[0] - b[0]), `borne basse x=${x}/${n}`]);
            ecarts.push([Math.abs(a[1] - b[1]), `borne haute x=${x}/${n}`]);
        }
    }
    V.serieProche('conforme à la formule de Wilson', ecarts, 1e-15);

    // Propriétés que tout intervalle de confiance doit respecter.
    let bornes = 0, ordre = 0, contient = 0, largeur = 0;
    let precedente = Infinity;
    for (const n of [10, 100, 1000]) {
        for (let x = 0; x <= n; x++) {
            const [lo, hi] = M.wilsonInterval(x, n);
            if (lo < 0 || hi > 1) bornes++;
            if (lo > hi) ordre++;
            const p = x / n;
            if (p < lo - 1e-12 || p > hi + 1e-12) contient++;
        }
        const l = M.wilsonInterval(Math.round(n / 2), n);
        if (l[1] - l[0] > precedente) largeur++;
        precedente = l[1] - l[0];
    }
    V.verifie('l’intervalle reste dans [0, 1]', bornes === 0, `${bornes} sortie(s)`);
    V.verifie('la borne basse ne dépasse jamais la borne haute', ordre === 0);
    V.verifie('l’intervalle contient toujours la proportion observée', contient === 0,
        `${contient} cas`);
    V.verifie('l’intervalle se resserre quand N augmente', largeur === 0);

    // Cas limites : le succès total ne donne PAS une borne basse de 100 %.
    const [lo1000] = M.wilsonInterval(1000, 1000);
    V.verifie('1000 succès sur 1000 ne prouvent pas 100 % de rendement',
        lo1000 < 1 && lo1000 > 0.99, `borne basse = ${(100 * lo1000).toFixed(3)} %`);
    const [lo0, hi0] = M.wilsonInterval(0, 100);
    V.verifie('0 succès sur 100 donne une borne haute strictement positive',
        lo0 < 1e-12 && hi0 > 0 && hi0 < 0.05,
        `[${(100 * lo0).toExponential(2)} ; ${(100 * hi0).toFixed(2)} %]`);
    // Valeur de référence publiée pour 0/100 : borne haute ≈ 3,7 %.
    V.proche('0/100 : borne haute conforme à la valeur tabulée', hi0, 0.03698, 5e-4);
}

/* ------------------------------------------------------- 2. quantiles */
V.groupe('2. Quantiles empiriques');
{
    const s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    V.proche('médiane d’une série paire', M.quantile(s, 0.5), 5.5, 1e-12);
    V.proche('minimum en p = 0', M.quantile(s, 0), 1, 1e-12);
    V.proche('maximum en p = 1', M.quantile(s, 1), 10, 1e-12);
    V.proche('P05 par interpolation linéaire', M.quantile(s, 0.05), 1.45, 1e-12);
    V.proche('P95 par interpolation linéaire', M.quantile(s, 0.95), 9.55, 1e-12);
    V.verifie('une série vide renvoie NaN', Number.isNaN(M.quantile([], 0.5)));

    // Monotonie en p.
    let inversions = 0, precedent = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.01) {
        const q = M.quantile(s, Math.min(1, p));
        if (q < precedent - 1e-12) inversions++;
        precedent = q;
    }
    V.verifie('le quantile croît avec p', inversions === 0, `${inversions} inversion(s)`);
}

/* -------------------------------------------- 3. tirage pseudo-aléatoire */
V.groupe('3. Générateur pseudo-aléatoire à graine (reproductibilité)');
{
    const a = M.createSeededRandom(42);
    const b = M.createSeededRandom(42);
    const sa = [], sb = [];
    for (let i = 0; i < 10000; i++) { sa.push(a()); sb.push(b()); }
    V.verifie('deux générateurs de même graine produisent la même suite',
        sa.every((x, i) => x === sb[i]));

    const c = M.createSeededRandom(43);
    const sc = [];
    for (let i = 0; i < 1000; i++) sc.push(c());
    V.verifie('une graine différente produit une autre suite',
        sc.some((x, i) => x !== sa[i]));

    const hors = sa.filter(x => x < 0 || x >= 1).length;
    V.verifie('les tirages restent dans [0, 1[', hors === 0, `${hors} hors bornes`);

    const moyenne = sa.reduce((s, x) => s + x, 0) / sa.length;
    const variance = sa.reduce((s, x) => s + (x - moyenne) ** 2, 0) / (sa.length - 1);
    V.proche('moyenne empirique proche de 1/2', moyenne, 0.5, 0.02);
    V.proche('variance empirique proche de 1/12', variance, 1 / 12, 0.005);

    // Uniformité par histogramme : aucun décile ne doit être anormalement creusé.
    const paniers = new Array(10).fill(0);
    for (const x of sa) paniers[Math.min(9, Math.floor(x * 10))]++;
    const attendu = sa.length / 10;
    const chi2 = paniers.reduce((s, o) => s + (o - attendu) ** 2 / attendu, 0);
    V.verifie('répartition uniforme sur 10 déciles (χ² < 21,7 à 5 %)', chi2 < 21.666,
        `χ² = ${chi2.toFixed(2)}`);
}

/* --------------------------------------------------- 4. loi normale */
V.groupe('4. Tirage gaussien (Box–Muller)');
{
    const rng = M.createSeededRandom(42);
    const g = [];
    for (let i = 0; i < 200000; i++) g.push(M.standardNormalFrom(rng(), rng()));

    const m = g.reduce((s, x) => s + x, 0) / g.length;
    const v = g.reduce((s, x) => s + (x - m) ** 2, 0) / (g.length - 1);
    V.proche('moyenne nulle', m, 0, 0.02);
    V.proche('écart-type unité', Math.sqrt(v), 1, 0.02);

    // Symétrie et aplatissement : une gaussienne a un kurtosis de 3.
    const sd = Math.sqrt(v);
    const skew = g.reduce((s, x) => s + ((x - m) / sd) ** 3, 0) / g.length;
    const kurt = g.reduce((s, x) => s + ((x - m) / sd) ** 4, 0) / g.length;
    V.proche('distribution symétrique (asymétrie nulle)', skew, 0, 0.05);
    V.proche('aplatissement conforme à une gaussienne', kurt, 3, 0.15);

    // Proportions dans ±1σ, ±2σ, ±3σ.
    const part = (k) => g.filter(x => Math.abs(x - m) <= k * sd).length / g.length;
    V.proche('≈ 68,3 % des tirages dans ±1σ', part(1), 0.6827, 0.01);
    V.proche('≈ 95,4 % des tirages dans ±2σ', part(2), 0.9545, 0.005);
    V.proche('≈ 99,7 % des tirages dans ±3σ', part(3), 0.9973, 0.002);

    /* Le modèle d'erreur du TP : σ = Δd/2, donc environ 95 % des erreurs
       tombent dans ±Δd. C'est exactement ce que l'énoncé annonce. */
    for (const dd of [1, 2, 5]) {
        const r2 = M.createSeededRandom(42);
        let dedans = 0;
        const N = 100000;
        for (let i = 0; i < N; i++) {
            if (Math.abs(M.standardNormalFrom(r2(), r2()) * dd / 2) <= dd) dedans++;
        }
        V.proche(`σ = Δd/2 avec Δd = ${dd} nm : ≈ 95 % des erreurs dans ±${dd} nm`,
            dedans / N, 0.9545, 0.01);
    }
}

/* ----------------------------------------------------------- 5. BFGS */
V.groupe('5. Optimiseur quasi-Newton BFGS');
{
    /* L'optimiseur est éprouvé sur des fonctions tests dont le minimum est connu
       analytiquement, indépendamment de toute physique. Les épaisseurs sont
       bornées en dessous par le seuil de nettoyage : les minima choisis sont
       donc placés au-dessus de cette borne. */
    const seuil = M.cleanThresholdNm();
    V.proche('seuil de nettoyage par défaut', seuil, 2, 1e-12, ' nm');

    // (a) Quadratique séparable : minimum en (30, 60, 90).
    {
        const cible = [30, 60, 90];
        const cout = (d) => cible.reduce((s, c, i) => s + (d[i] - c) ** 2, 0);
        const res = M.bfgsDescent([10, 10, 10], [0, 1, 2], cout);
        V.serieProche('quadratique séparable : minimum atteint',
            res.thick.map((x, i) => [Math.abs(x - cible[i]), `x${i}`]), 0.05);
        V.proche('coût final quasi nul', res.cost, 0, 1e-2);
    }

    // (b) Quadratique mal conditionnée (vallée étroite).
    {
        const cout = (d) => (d[0] - 40) ** 2 + 400 * (d[1] - 80) ** 2;
        const res = M.bfgsDescent([10, 10], [0, 1], cout);
        V.proche('vallée étroite : première variable', res.thick[0], 40, 0.2);
        V.proche('vallée étroite : seconde variable', res.thick[1], 80, 0.2);
    }

    // (c) Rosenbrock décalée : cas classiquement difficile.
    {
        const cout = (d) => (10 - d[0] / 10) ** 2 + 100 * (d[1] / 10 - (d[0] / 10) ** 2) ** 2;
        const res = M.bfgsDescent([50, 50], [0, 1], cout);
        V.verifie('Rosenbrock : le coût est fortement réduit',
            cout(res.thick) < cout([50, 50]) / 100,
            `${cout([50, 50]).toExponential(3)} → ${cout(res.thick).toExponential(3)}`);
    }

    // (d) Déterminisme : deux descentes identiques donnent le même résultat.
    {
        const cout = (d) => Math.sin(d[0] / 7) + (d[0] - 55) ** 2 / 500 + (d[1] - 33) ** 2 / 300;
        const a = M.bfgsDescent([20, 90], [0, 1], cout);
        const b = M.bfgsDescent([20, 90], [0, 1], cout);
        V.verifie('deux lancements identiques donnent les mêmes épaisseurs',
            a.thick.every((x, i) => x === b.thick[i]) && a.cost === b.cost);
    }

    // (e) Le coût ne remonte jamais : la recherche linéaire n'accepte qu'une baisse.
    {
        const cible = [45, 70, 25, 90];
        const cout = (d) => cible.reduce((s, c, i) => s + (d[i] - c) ** 2, 0);
        const depart = [10, 10, 10, 10];
        const res = M.bfgsDescent(depart, [0, 1, 2, 3], cout);
        V.verifie('le coût final est inférieur ou égal au coût initial',
            res.cost <= cout(depart) + 1e-12,
            `${cout(depart).toFixed(4)} → ${res.cost.toFixed(4)}`);
    }

    // (f) Les couches verrouillées ne bougent pas d'un nanomètre.
    {
        const cout = (d) => d.reduce((s, x) => s + (x - 50) ** 2, 0);
        const depart = [20, 300, 20, 300, 20];
        const res = M.bfgsDescent(depart, [0, 2, 4], cout);
        V.verifie('les couches hors périmètre restent strictement inchangées',
            res.thick[1] === depart[1] && res.thick[3] === depart[3],
            `couche 2 : ${depart[1]} → ${res.thick[1]}, couche 4 : ${depart[3]} → ${res.thick[3]}`);
        V.verifie('les couches libres, elles, ont bougé',
            [0, 2, 4].every(i => Math.abs(res.thick[i] - depart[i]) > 1),
            res.thick.join(', '));
    }

    // (g) Bornes : aucune épaisseur ne descend sous le seuil ni ne dépasse 1200 nm.
    {
        const versZero = (d) => d.reduce((s, x) => s + x, 0);          // pousse vers le bas
        const r1 = M.bfgsDescent([100, 100, 100], [0, 1, 2], versZero);
        V.verifie(`aucune épaisseur ne passe sous le seuil de ${seuil} nm`,
            r1.thick.every(x => x >= seuil - 1e-9), r1.thick.join(', '));

        const versInfini = (d) => -d.reduce((s, x) => s + x, 0);       // pousse vers le haut
        const r2 = M.bfgsDescent([100, 100], [0, 1], versInfini);
        V.verifie('aucune épaisseur ne dépasse 1200 nm',
            r2.thick.every(x => x <= 1200 + 1e-9), r2.thick.join(', '));
    }

    // (h) Aucune variable libre : l'appel doit rendre l'empilement intact.
    {
        const depart = [10, 20, 30];
        const res = M.bfgsDescent(depart, [], () => 1);
        V.verifie('sans variable libre, rien n’est modifié',
            res.thick.every((x, i) => x === depart[i]));
    }

    // (i) Caractère LOCAL : depuis deux départs différents, deux minima différents.
    {
        // Double puits : minima marqués vers 20 nm et vers 120 nm.
        const cout = (d) => Math.min((d[0] - 20) ** 2, 0.5 * (d[0] - 120) ** 2 + 3);
        const bas = M.bfgsDescent([25, 0], [0], cout);
        const haut = M.bfgsDescent([115, 0], [0], cout);
        V.verifie('BFGS converge vers le minimum de sa vallée de départ, pas vers l’optimum global',
            Math.abs(bas.thick[0] - 20) < 1 && Math.abs(haut.thick[0] - 120) < 1,
            `départ 25 → ${bas.thick[0].toFixed(2)} ; départ 115 → ${haut.thick[0].toFixed(2)}`);
    }
}

/* ------------------------------------------- 6. sélection des couches */
V.groupe('6. Analyse d’une liste de couches (« 1,3,5-7 »)');
{
    const cas = [
        ['16-18', 18, [15, 16, 17]],
        ['1,3,5-7', 18, [0, 2, 4, 5, 6]],
        [' 2 , 4 ', 18, [1, 3]],
        ['18', 18, [17]],
        ['1-18', 18, Array.from({ length: 18 }, (_, i) => i)],
        ['3-3', 18, [2]],
    ];
    for (const [texte, n, attendu] of cas) {
        const r = M.parseLayerSelection(texte, n);
        V.verifie(`« ${texte} » → couches ${attendu.map(i => i + 1).join(',')}`,
            r.ok && r.indices.length === attendu.length &&
            r.indices.every((v, i) => v === attendu[i]),
            r.ok ? `obtenu ${r.indices.map(i => i + 1).join(',')}` : r.reason);
    }

    const invalides = ['', '0', '19', 'abc', '-3', '1-', '2.5', '1;2', '20-25'];
    for (const texte of invalides) {
        const r = M.parseLayerSelection(texte, 18);
        V.verifie(`« ${texte} » est refusé avec un message explicite`, !r.ok && !!r.reason,
            r.ok ? `accepté à tort : ${r.indices.map(i => i + 1).join(',')}` : '');
    }

    /* Deux tolérances volontaires, à garder telles quelles : un intervalle écrit
       à l'envers est remis dans l'ordre, et une virgule en trop est ignorée.
       L'étudiant qui tape vite ne doit pas être bloqué par de la ponctuation. */
    const inverse = M.parseLayerSelection('5-2', 18);
    V.verifie('« 5-2 » est remis dans l’ordre plutôt que refusé',
        inverse.ok && JSON.stringify(inverse.indices) === JSON.stringify([1, 2, 3, 4]),
        inverse.ok ? inverse.normalized : inverse.reason);
    const virgule = M.parseLayerSelection('1,,2', 18);
    V.verifie('« 1,,2 » tolère la virgule en trop',
        virgule.ok && JSON.stringify(virgule.indices) === JSON.stringify([0, 1]),
        virgule.ok ? virgule.normalized : virgule.reason);

    // Toute sélection acceptée doit fournir la liste normalisée affichable.
    for (const texte of ['16-18', '1,3,5-7', '5-2']) {
        const r = M.parseLayerSelection(texte, 18);
        V.verifie(`« ${texte} » expose une liste normalisée lisible`,
            r.ok && typeof r.normalized === 'string' && r.normalized.length > 0,
            r.ok ? r.normalized : r.reason);
    }

    // Doublons et désordre doivent être normalisés, pas dupliqués.
    const r = M.parseLayerSelection('5,3,5,4-5', 18);
    V.verifie('les doublons sont fusionnés et la liste est triée',
        r.ok && JSON.stringify(r.indices) === JSON.stringify([2, 3, 4]),
        r.ok ? r.indices.join(',') : r.reason);
}

process.exit(V.bilan() === 0 ? 0 : 1);
