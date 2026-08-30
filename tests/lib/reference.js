/* =============================================================================
   IMPLÉMENTATIONS DE RÉFÉRENCE, INDÉPENDANTES DU SIMULATEUR
   -----------------------------------------------------------------------------
   Rien ici n'est repris du code testé. Trois niveaux de référence :

     1. FORMULES FERMÉES  — Fresnel, lame quart d'onde, miroir quart d'onde,
        métal semi-infini. Ce sont des vérités de manuel : si le simulateur
        s'en écarte, c'est le simulateur qui a tort.

     2. ALGORITHME DIFFÉRENT — récursion d'Airy/Rouard sur les amplitudes,
        là où le simulateur multiplie des matrices d'Abelès. Deux chemins de
        calcul distincts qui doivent aboutir au même nombre.

     3. LOIS PHYSIQUES — conservation de l'énergie, égalité S/P à incidence
        normale, limite d'une couche épaisse. Elles ne dépendent d'aucune
        implémentation.

   CONVENTION. Deux écritures de l'indice complexe cohabitent dans la
   littérature : N = n − i·k avec une onde en e^(−iβ) (Macleod, celle de
   l'énoncé), et N = n + i·k avec une onde en e^(+iβ). Elles sont conjuguées
   l'une de l'autre, donc rigoureusement équivalentes pour R et T.

   La référence adopte DÉLIBÉRÉMENT la seconde, alors que le simulateur suit la
   première. Une erreur de convention dans le code testé — mélanger les deux
   au sein d'un même calcul — apparaît alors immédiatement, ce qui ne serait
   pas le cas si les deux implémentations partageaient la même écriture.

   Ce qui compte, et qui est vérifié plus bas par les lois physiques : dans une
   couche absorbante, l'onde doit DÉCROÎTRE. Avec N = n + i·k et e^(+iβ),
   le facteur de propagation vaut e^(−2πkd/λ) < 1.
   ========================================================================== */
'use strict';

/* ---------------------------------------------------------------- complexes */
/* Arithmétique complexe écrite ici, volontairement distincte de celle du
   simulateur : une erreur commune aux deux passerait sinon inaperçue. */
const C = {
    de: (re, im = 0) => ({ re, im }),
    plus: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    moins: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
    fois: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
    sur: (a, b) => {
        const d = b.re * b.re + b.im * b.im;
        return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
    },
    module: (a) => Math.hypot(a.re, a.im),
    module2: (a) => a.re * a.re + a.im * a.im,
    /* Racine principale par la forme polaire demi-angle. */
    racine: (a) => {
        const m = Math.sqrt(Math.hypot(a.re, a.im));
        const t = Math.atan2(a.im, a.re) / 2;
        return { re: m * Math.cos(t), im: m * Math.sin(t) };
    },
    /* exp(i·z) pour z complexe. */
    expI: (z) => {
        const amp = Math.exp(-z.im);
        return { re: amp * Math.cos(z.re), im: amp * Math.sin(z.re) };
    },
};

/* ------------------------------------------------------------- dispersions */

/** Sellmeier BK7 (Schott), coefficients publics. */
function bk7(lambdaNm) {
    const L2 = (lambdaNm / 1000) ** 2;
    const n2 = 1
        + (1.03961212 * L2) / (L2 - 0.00600069867)
        + (0.231792344 * L2) / (L2 - 0.0200179144)
        + (1.01046945 * L2) / (L2 - 103.560653);
    return { n: Math.sqrt(n2), k: 0 };
}

/** Interpolation cubique monotone de Fritsch–Carlson (PCHIP), réécrite ici. */
function pchipMonotone(xs, ys, x) {
    const n = xs.length;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    const h = [], d = [];
    for (let i = 0; i < n - 1; i++) {
        h.push(xs[i + 1] - xs[i]);
        d.push((ys[i + 1] - ys[i]) / h[i]);
    }
    const m = new Array(n);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
        if (d[i - 1] * d[i] <= 0) {
            m[i] = 0;
        } else {
            const w1 = 2 * h[i] + h[i - 1];
            const w2 = h[i] + 2 * h[i - 1];
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
        }
    }
    let i = 0;
    while (i < n - 2 && xs[i + 1] < x) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t, t3 = t2 * t;
    return ys[i] * (2 * t3 - 3 * t2 + 1)
         + h[i] * m[i] * (t3 - 2 * t2 + t)
         + ys[i + 1] * (-2 * t3 + 3 * t2)
         + h[i] * m[i + 1] * (t3 - t2);
}

/* Tables Institut Fresnel, recopiées depuis la documentation matériaux et non
   depuis le code du simulateur. */
const TABLE_ZNS = [
    [350, 2.713, 0.2379], [400, 2.558, 0.0066], [450, 2.467, 0.0003], [500, 2.410, 0],
    [550, 2.372, 0], [600, 2.346, 0], [650, 2.326, 0], [700, 2.312, 0],
    [750, 2.301, 0], [800, 2.292, 0],
];
const TABLE_YF3 = [
    [350, 1.483, 0], [400, 1.477, 0], [450, 1.474, 0], [500, 1.471, 0],
    [550, 1.469, 0], [600, 1.468, 0], [650, 1.466, 0], [700, 1.466, 0],
    [750, 1.465, 0], [800, 1.464, 0],
];

function depuisTable(table, lambdaNm) {
    const xs = table.map(r => r[0]);
    return {
        n: pchipMonotone(xs, table.map(r => r[1]), lambdaNm),
        k: pchipMonotone(xs, table.map(r => r[2]), lambdaNm),
    };
}

const zns = (l) => depuisTable(TABLE_ZNS, l);
const yf3 = (l) => depuisTable(TABLE_YF3, l);

/* ------------------------------------------------------- moteur de référence */

/** N = n + i·k (convention conjuguée de celle du simulateur, cf. en-tête). */
const indiceComplexe = (n, k) => C.de(n, k);

/**
 * γ = √(N² − α²), branche à décroissance physique.
 * Avec N = n + i·k et une onde en e^(+iβ), la décroissance impose Im(γ) ≥ 0.
 * On choisit donc −g plutôt que le conjugué : la seconde racine d'un nombre
 * complexe est son opposé, jamais son conjugué.
 */
function gamma(N, alpha) {
    const g = C.racine(C.moins(C.fois(N, N), C.de(alpha * alpha, 0)));
    return g.im < 0 ? C.de(-g.re, -g.im) : g;
}

/** Admittance optique : η = γ en S, η = N²/γ en P. */
function admittance(N, g, pol) {
    return pol === 's' ? g : C.sur(C.fois(N, N), g);
}

/**
 * R et T par récursion d'Airy/Rouard sur les amplitudes.
 *
 * @param {number} lambdaNm
 * @param {number} thetaDeg     incidence dans le superstrat
 * @param {Array}  couches      [{n, k, d}] dans l'ORDRE DE DÉPÔT (substrat → superstrat)
 * @param {object} superstrat   {n, k}
 * @param {object} substrat     {n, k}
 * @param {'s'|'p'} pol
 */
function rouard(lambdaNm, thetaDeg, couches, superstrat, substrat, pol) {
    const nSup = indiceComplexe(superstrat.n, superstrat.k);
    const nSub = indiceComplexe(substrat.n, substrat.k);
    const alpha = superstrat.n * Math.sin(thetaDeg * Math.PI / 180);

    // La lumière arrive par le superstrat : elle rencontre les couches dans
    // l'ordre inverse du dépôt.
    const ordre = couches.slice().reverse();
    const milieux = [nSup, ...ordre.map(c => indiceComplexe(c.n, c.k)), nSub];
    const ep = [null, ...ordre.map(c => c.d), null];

    const g = milieux.map(N => gamma(N, alpha));
    const eta = milieux.map((N, i) => admittance(N, g[i], pol));

    const rInterface = (a, b) => C.sur(C.moins(eta[a], eta[b]), C.plus(eta[a], eta[b]));
    const tInterface = (a, b) => C.sur(C.de(2 * eta[a].re, 2 * eta[a].im), C.plus(eta[a], eta[b]));

    const dernier = milieux.length - 1;
    let r = rInterface(dernier - 1, dernier);
    let t = tInterface(dernier - 1, dernier);

    for (let j = dernier - 1; j >= 1; j--) {
        const beta = C.de(g[j].re, g[j].im);
        const phase = C.de(beta.re * (2 * Math.PI * ep[j] / lambdaNm),
                           beta.im * (2 * Math.PI * ep[j] / lambdaNm));
        const e1 = C.expI(phase);
        const e2 = C.fois(e1, e1);
        const rij = rInterface(j - 1, j);
        const tij = tInterface(j - 1, j);
        const den = C.plus(C.de(1, 0), C.fois(C.fois(rij, r), e2));
        const rNouveau = C.sur(C.plus(rij, C.fois(r, e2)), den);
        const tNouveau = C.sur(C.fois(C.fois(tij, t), e1), den);
        r = rNouveau;
        t = tNouveau;
    }

    const R = C.module2(r);
    const den0 = Math.abs(eta[0].re) > 1e-12 ? eta[0].re : 1e-12;
    const T = (eta[dernier].re / den0) * C.module2(t);
    return { R, T };
}

/* ------------------------------------------------------- formules fermées */

/** Coefficients de Fresnel exacts d'un dioptre entre deux milieux transparents. */
function fresnelDioptre(n1, n2, thetaDeg) {
    const t1 = thetaDeg * Math.PI / 180;
    const s2 = (n1 / n2) * Math.sin(t1);
    const c1 = Math.cos(t1);
    if (s2 >= 1) return { Rs: 1, Rp: 1, totale: true };          // réflexion totale
    const c2 = Math.sqrt(1 - s2 * s2);
    const rs = (n1 * c1 - n2 * c2) / (n1 * c1 + n2 * c2);
    const rp = (n2 * c1 - n1 * c2) / (n2 * c1 + n1 * c2);
    return { Rs: rs * rs, Rp: rp * rp, totale: false };
}

/** Réflectivité d'une lame quart d'onde à sa longueur d'onde de conception. */
function quartOndeSimple(n0, n1, ns) {
    const x = (n0 * ns - n1 * n1) / (n0 * ns + n1 * n1);
    return x * x;
}

/** Miroir quart d'onde (HL)^p H : admittance équivalente et réflectivité. */
function miroirQuartOnde(n0, nH, nL, ns, periodes) {
    const Y = Math.pow(nH / nL, 2 * periodes) * (nH * nH) / ns;
    const x = (n0 - Y) / (n0 + Y);
    return x * x;
}

/** Réflectivité normale d'un métal semi-infini vu depuis l'air. */
function metalSemiInfini(n, k) {
    return ((n - 1) ** 2 + k * k) / ((n + 1) ** 2 + k * k);
}

/** Intervalle de Wilson, réécrit indépendamment. */
function wilson(succes, essais, z = 1.959963984540054) {
    if (essais <= 0) return [0, 1];
    const p = succes / essais;
    const z2 = z * z;
    const centre = (p + z2 / (2 * essais)) / (1 + z2 / essais);
    const demi = (z / (1 + z2 / essais))
        * Math.sqrt(p * (1 - p) / essais + z2 / (4 * essais * essais));
    return [Math.max(0, centre - demi), Math.min(1, centre + demi)];
}

module.exports = {
    C, bk7, pchipMonotone, zns, yf3, TABLE_ZNS, TABLE_YF3,
    rouard, gamma, admittance, indiceComplexe,
    fresnelDioptre, quartOndeSimple, miroirQuartOnde, metalSemiInfini, wilson,
};
