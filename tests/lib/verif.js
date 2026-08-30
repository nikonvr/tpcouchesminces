/* =============================================================================
   PETIT HARNAIS DE TEST — sans dépendance externe
   Sortie lisible en console, code de retour 0 si tout passe, 1 sinon.
   ========================================================================== */
'use strict';

const etat = { suite: '', total: 0, echecs: [], groupes: [] };

function suite(nom) {
    etat.suite = nom;
    console.log('\n' + '='.repeat(78));
    console.log(nom);
    console.log('='.repeat(78));
}

function groupe(nom) {
    etat.groupes.push(nom);
    console.log('\n  ' + nom);
}

/** Vérifie une condition booléenne. */
function verifie(libelle, condition, detail = '') {
    etat.total++;
    if (condition) {
        console.log(`    OK    ${libelle}`);
    } else {
        etat.echecs.push({ suite: etat.suite, libelle, detail });
        console.log(`    ECHEC ${libelle}${detail ? '  — ' + detail : ''}`);
    }
    return !!condition;
}

/** Vérifie |obtenu − attendu| ≤ tolerance. */
function proche(libelle, obtenu, attendu, tolerance, unite = '') {
    const ecart = Math.abs(obtenu - attendu);
    const ok = Number.isFinite(ecart) && ecart <= tolerance;
    return verifie(
        `${libelle}`,
        ok,
        ok ? '' : `obtenu ${format(obtenu)}${unite}, attendu ${format(attendu)}${unite}, ` +
                  `écart ${ecart.toExponential(3)} > tolérance ${tolerance.toExponential(3)}`
    );
}

/** Vérifie que l'écart maximal d'une série reste sous la tolérance. */
function serieProche(libelle, ecarts, tolerance) {
    let pire = 0, ou = null;
    for (const [e, contexte] of ecarts) {
        if (!(e <= pire)) { pire = e; ou = contexte; }
    }
    const ok = Number.isFinite(pire) && pire <= tolerance;
    return verifie(
        `${libelle}  (${ecarts.length} points, écart max ${pire.toExponential(3)})`,
        ok,
        ok ? '' : `pire cas : ${ou}`
    );
}

function format(x) {
    if (!Number.isFinite(x)) return String(x);
    if (x !== 0 && (Math.abs(x) < 1e-4 || Math.abs(x) >= 1e6)) return x.toExponential(6);
    return String(Number(x.toPrecision(10)));
}

function bilan() {
    console.log('\n' + '='.repeat(78));
    if (etat.echecs.length === 0) {
        console.log(`RESULTAT : ${etat.total} contrôles, 0 échec.`);
    } else {
        console.log(`RESULTAT : ${etat.total} contrôles, ${etat.echecs.length} ECHEC(S)`);
        for (const e of etat.echecs) {
            console.log(`  - ${e.libelle}`);
            if (e.detail) console.log(`      ${e.detail}`);
        }
    }
    console.log('='.repeat(78));
    return etat.echecs.length;
}

module.exports = { suite, groupe, verifie, proche, serieProche, bilan, format, etat };
