/* Régression des matériaux personnalisés.
   Exécution : node tests/test_materiaux.js
   Le script exécute le JavaScript RÉEL complet dans un contexte isolé.
   Les seuls remplacements sont le DOM, le stockage et les rafraîchissements
   graphiques : les commandes, imports, tables et calculs restent ceux du HTML.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const { scriptsDe } = require('./lib/extraction');
const V = require('./lib/verif');
const Ref = require('./lib/reference');
const html = fs.readFileSync(process.env.TP_SIMULATEUR || path.join(root, 'simulateur_couches_minces.html'), 'utf8');

const { charge } = require('./lib/harnais');

const fresh = () => {
    const m = charge();
    m.element('selMatInspect').value = m.appState.activeCustomMatId;
    return m;
};
const custom = (m, table, sym = 'M1') => {
    const mat = m.appState.customMaterials[0];
    Object.assign(mat, { table, sym });
    m.registerCustomMaterialInDb(mat);
    return mat;
};
const paste = (m, text) => {
    m.element('txtPasteMatData').value = text;
    m.element('btnApplyPastedMat').click();
    return m.appState.customMaterials[0].table;
};
const noThrow = (label, fn) => {
    try { fn(); V.verifie(label, true); }
    catch (e) { V.verifie(label, false, e.message); }
};

V.suite('MATÉRIAUX PERSONNALISÉS — imports, commandes, persistance et physique');
V.groupe('A. Fonctionnement nominal et raccordement au moteur');
{
    const m = fresh(), mat = m.appState.customMaterials[0];
    V.proche('la table est lue par le moteur à 550 nm', m.getMediumIndex(mat.id, 550, 1.5).r, 1.518, 1e-12);
    m.element('btnUseCustomAsSub').click();
    V.verifie('le bouton Substrat applique le bon matériau et relance le calcul',
        m.appState.substrat === mat.id && m.counters.simulate === 1);
    m.element('btnAddCustomAsLayer').click();
    V.verifie('le bouton Couche ajoute le matériau personnel', m.appState.layers[0].matId === mat.id);
    m.renderCustomMatEditor();
    V.verifie('le statut utilise la valeur réelle de la table',
        m.element('txtCustomMatStatus').textContent.includes('1.518'), m.element('txtCustomMatStatus').textContent);
    for (const button of ['btnAddMatRow', 'btnSetMatConstant', 'btnGenMatGrid']) {
        const isolated = fresh();
        noThrow(`${button} fonctionne sur la table initiale`, () => isolated.element(button).click());
    }
}
{
    const m = fresh();
    const mat = custom(m, [{ l: 550, n: 1.6, k: 0 }]);
    const state = { ...m.appState, layers: [{ matId: mat.id, unit: 'QWOT', val: 1, locked: false }] };
    V.proche('épaisseur QWOT pour n = 1,6', m.getPhysicalThicknessNm(state.layers[0], 550, 0, 1), 550 / (4 * 1.6), 1e-12);
    const r = m.computeTMMPoint(550, 0, state).R_avg;
    const ns = m.MATERIALS_DB.BK7.getN(550).r;
    V.proche('monocouche personnelle : Fresnel quart d’onde', r, ((1 - 1.6 ** 2 / ns) / (1 + 1.6 ** 2 / ns)) ** 2, 1e-12);
    custom(m, [{ l: 550, n: 0.8, k: 0 }]);
    V.proche('QWOT respecte aussi un indice autorisé inférieur à 1', m.getPhysicalThicknessNm(state.layers[0], 550, 0, 1), 550 / (4 * 0.8), 1e-12);
    custom(m, [{ l: 550, n: 2, k: 30 }]);
    const thick = m.computeTMMPoint(200, 0, { ...state, layers: [{matId: mat.id, unit: 'nm', val: 1200}] });
    V.verifie('couche très absorbante autorisée : sortie numérique finie',
        [thick.R_avg, thick.T_avg, thick.A_avg].every(Number.isFinite), JSON.stringify(thick));
}

V.groupe('B. Imports : données connues et protection contre les altérations');
for (const [label, input, n, k] of [
    ['CSV décimal point', '550,1.518,0.01', 1.518, 0.01],
    ['Excel tabulé', '550\t1.518\t0.01', 1.518, 0.01],
    ['µm décimal point', '0.55 1.518 0.01', 1.518, 0.01],
    ['Excel français décimal virgule', '550;1,518;0,010', 1.518, 0.01],
]) {
    const m = fresh(), rows = paste(m, input);
    V.verifie(label, rows.length === 1 && rows[0].l === 550 && rows[0].n === n && rows[0].k === k, JSON.stringify(rows));
}
for (const [label, input] of [
    ['ne pas convertir silencieusement k négatif en zéro', '550 1.5 -0.1'],
    ['ne pas inventer un k nul si le champ est invalide', '550 1.5 garbage'],
    ['ne pas tronquer une longueur d’onde de 6 µm à 5 µm', '6.0 1.5 0'],
    ['ne pas tronquer une mesure à 6000 nm', '6000 1.5 0'],
]) {
    const m = fresh(), before = JSON.stringify(m.appState.customMaterials[0].table);
    const rows = paste(m, input);
    V.verifie(label, m.alerts.length > 0 && JSON.stringify(rows) === before, JSON.stringify(rows));
}
{
    const m = fresh();
    const rows = paste(m, '# commentaire\nlambda_nm,n,k\n550,1.5,0');
    V.verifie('entête simple et commentaires ignorés', rows.length === 1 && rows[0].n === 1.5);
    const rowsQuoted = paste(fresh(), '"550","1.518","0.01"');
    V.verifie('CSV avec champs entre guillemets compris', rowsQuoted.length === 1 && rowsQuoted[0].n === 1.518, JSON.stringify(rowsQuoted));
    const precise = paste(fresh(), '550.01 1.5 0\n550.04 1.6 0');
    V.verifie('deux longueurs d’onde distinctes restent distinctes et exactes',
        precise.length === 2 && precise[0].l === 550.01 && precise[1].l === 550.04, JSON.stringify(precise));
}

V.groupe('C. Formules : matériaux et multiplicateurs attendus');
for (const [formula, ids, vals] of [
    ['H L 2H', ['ZnS_fresnel', 'YF3_fresnel', 'ZnS_fresnel'], [1,1,2]],
    ['(HL)^3', ['ZnS_fresnel','YF3_fresnel','ZnS_fresnel','YF3_fresnel','ZnS_fresnel','YF3_fresnel'], [1,1,1,1,1,1]],
    ['M1 L 2M1', ['custom_mat_1','YF3_fresnel','custom_mat_1'], [1,1,2]],
    ['(M1 L)^2', ['custom_mat_1','YF3_fresnel','custom_mat_1','YF3_fresnel'], [1,1,1,1]],
    ['SiO2', ['FusedSilica'], [1]],
    ['TiO2', ['TiO2'], [1]],
    ['Si3N4', ['Si3N4'], [1]],
]) {
    const m = fresh(), layers = m.parseStackFormula(formula);
    V.verifie(`formule ${formula}`, JSON.stringify(layers.map(l => l.matId)) === JSON.stringify(ids)
        && JSON.stringify(layers.map(l => l.val)) === JSON.stringify(vals), JSON.stringify(layers));
}
{
    const m = fresh(), mat = m.appState.customMaterials[0];
    m.element('inpCustomMatSym').value = 'H'; m.element('inpCustomMatSym').fire('change');
    const layers = m.parseStackFormula('H L H');
    V.verifie('un code personnel ne détourne pas H de ZnS', layers[0].matId === 'ZnS_fresnel', JSON.stringify(layers));
    m.element('inpCustomMatSym').value = 'S1'; m.element('inpCustomMatSym').fire('change');
    V.verifie('le code personnel S1 est reconnu', m.parseStackFormula('S1')[0]?.matId === mat.id, JSON.stringify(m.parseStackFormula('S1')));
    m.element('inpCustomMatSym').value = '2X'; m.element('inpCustomMatSym').fire('change');
    V.verifie('les codes ambigus commençant par un chiffre sont refusés', mat.sym !== '2X', mat.sym);
}
{
    const m = fresh();
    m.element('btnNewCustomMat').click();
    m.appState.activeCustomMatId = 'custom_mat_1';
    m.element('btnDeleteCustomMat').click();
    m.element('btnNewCustomMat').click();
    const symbols = m.appState.customMaterials.map(mat => mat.sym);
    V.verifie('création après suppression : codes distincts', new Set(symbols).size === symbols.length, JSON.stringify(symbols));
}

V.groupe('D. Stockage, références et sélecteurs');
{
    const m = fresh();
    const reloaded = charge(JSON.parse(m.storage.get('simulateur_cm_custom_materials')));
    V.proche('persistance d’une table valide', reloaded.MATERIALS_DB.custom_mat_1.getN(550).r, 1.518, 1e-12);
    const empty = charge([]);
    V.verifie('une liste volontairement vide reste vide après rechargement', empty.appState.customMaterials.length === 0);
    noThrow('une entrée locale endommagée ne bloque pas tout le démarrage', () => charge([null]));
}
{
    const m = fresh();
    m.element('selNeedleMaterial').value = 'TiO2';
    const before = m.counters.render;
    m.element('btnNewCustomMat').click();
    V.verifie('création : les sélecteurs des couches sont actualisés', m.counters.render > before);
    V.verifie('création : le choix du matériau de l’aiguille est conservé', m.element('selNeedleMaterial').value === 'TiO2', m.element('selNeedleMaterial').value);
}
{
    const m = fresh(), mat = m.appState.customMaterials[0];
    m.appState.layers = [{ matId: mat.id, val: 100, unit: 'nm', locked: true }];
    m.element('btnDeleteCustomMat').click();
    V.verifie('supprimer un matériau utilisé ne remplace pas une couche figée par ZnS',
        m.appState.layers[0].matId === mat.id && !!m.MATERIALS_DB[mat.id], JSON.stringify(m.appState.layers));
}
{
    const m = fresh(), mat = custom(m, [{l: 550, n: 1.5, k: 0}]);
    const archived = [{matId: mat.id, val: 100, unit: 'nm'}];
    m.appState.layers = archived;
    const opticalState = m.captureOpticalState();
    const before = m.computeTMMPointCustom(550, 0, 'Air', 'BK7', archived, opticalState).R_avg;
    custom(m, [{l: 550, n: 2.5, k: 0}]);
    const after = m.computeTMMPointCustom(550, 0, 'Air', 'BK7', archived, opticalState).R_avg;
    V.proche('un empilement archivé garde son spectre après édition de la table', after, before, 1e-12);
}

V.groupe('E. Face arrière : portée réelle du code existant');
{
    const m = fresh();
    const state = { ...m.appState, layers: [{matId: 'ZnS_fresnel', val: 100, unit: 'nm'}] };
    const frontOnly = m.computeTMMPoint(550, 0, {...state, considerBackside: false});
    const checked = m.computeTMMPoint(550, 0, {...state, considerBackside: true});
    V.verifie('la face arrière intervient aussi avec un coating avant',
        Math.abs(frontOnly.R_avg - checked.R_avg) > 1e-5 && checked.R_avg + checked.T_avg <= 1 + 1e-12);
    const ns = m.MATERIALS_DB.BK7.getN(550).r;
    const r = ((1 - ns)/(1 + ns)) ** 2;
    V.proche('plaque transparente nue : réflexion incohérente analytique',
        m.computeTMMPoint(550, 0, {...state, layers: [], considerBackside: true}).R_avg, 2*r/(1+r), 1e-12);
}

V.groupe('F. Imports ambigus, éditions invalides et chargement asynchrone');
for (const [input, unit, ok] of [
    ['"550", "1.518", "0.01"', 'auto', true],
    ['550 1,518 0,010', 'auto', true],
    ['550;1.5;-0.1', 'auto', false],
    ['0.55 1.5 0\n700 1.5 0', 'auto', false],
    ['550 1.5 0\n550 1.6 0', 'nm', false],
    ['lambda_um,n,k\n0.55,1.5,0', 'auto', true],
    ['lambda_nm,n,k\n0.55,1.5,0', 'auto', false],
    ['0.55 1.5 0', 'um', true],
    ['0.55 1.5 0', 'nm', false],
    ['550 1.5 0\nwavelength,k\n550 0.02', 'auto', false],
    ['550 1.5 0 extra', 'auto', false],
    ['lambda_nm,n,sigma\n550,1.5,0.01', 'auto', false],
    ['lambda_nm,n,k,extra\n550,1.5,0', 'auto', false],
]) {
    const m = fresh(); let result = true;
    try { m.parseMaterialTableText(input, unit); } catch (_) { result = false; }
    V.verifie(`validation d’import ${JSON.stringify(input)} (${unit})`, result === ok);
}
for (const [selector, value] of [['.inpMatRowN', '-1'], ['.inpMatRowK', '-0.2'], ['.inpMatRowL', '550'], ['.inpMatRowN', '']]) {
    const m = fresh(), node = m.element('row');
    node.dataset.idx = '0'; node.value = value;
    m.queries.set(selector, [node]);
    const before = JSON.stringify(m.appState.customMaterials[0].table);
    m.attachCustomMatRowEvents(); node.onchange({target: node});
    V.verifie(`édition invalide ${selector}=${JSON.stringify(value)} sans mutation partielle`,
        m.alerts.length > 0 && JSON.stringify(m.appState.customMaterials[0].table) === before);
}
{
    const m = fresh(), before = JSON.stringify(m.appState.customMaterials[0].table);
    m.element('inpImportMatFile').fire('change', { target: {files: [{}], value: ''} });
    m.element('btnNewCustomMat').click();
    m.readers[0].onload({target: {result: '550 2.2 0'}});
    V.verifie('un import tardif ne modifie pas un autre matériau devenu actif',
        m.alerts.length > 0 && JSON.stringify(m.appState.customMaterials[0].table) === before
        && m.appState.customMaterials[1].table[1].n === 1.6);
}
{
    const m = fresh();
    const ids = new Set(m.appState.customMaterials.map(x => x.id));
    for (let i = 0; i < 5; i++) m.element('btnNewCustomMat').click();
    V.verifie('créations rapides : identifiants uniques', new Set(m.appState.customMaterials.map(x => x.id)).size === ids.size + 5);
    m.appState.superstrat = m.appState.activeCustomMatId;
    const before = JSON.stringify(m.appState.customMaterials.find(x => x.id === m.appState.superstrat).table);
    paste(m, '550 1.5 0.1');
    V.verifie('un superstrat actif reste transparent après tentative d’import absorbant',
        m.alerts.length > 0 && JSON.stringify(m.appState.customMaterials.find(x => x.id === m.appState.superstrat).table) === before);
}
for (const formula of ['Mystere', '(HL)^999999999', '(HL', 'HL)', 'H -2L', '(HL)^0']) {
    const m = fresh(); let rejected = false;
    try { m.parseStackFormula(formula); } catch (_) { rejected = true; }
    V.verifie(`formule refusée sans matériau de remplacement : ${formula}`, rejected);
}
{
    const m = fresh();
    V.verifie('groupes imbriqués et codes complets : nombre de couches exact', m.parseStackFormula('((HL)^2 Si3N4)^3').length === 15);
    m.element('inpCustomMatSym').value = 'H1'; m.element('inpCustomMatSym').fire('change');
    V.verifie('un code préfixé par H reste distinct de H', m.parseStackFormula('H1 H')[0].matId === 'custom_mat_1'
        && m.parseStackFormula('H1 H')[1].matId === 'ZnS_fresnel');
}

V.groupe('G. Données locales récupérables et instantanés indépendants');
{
    const m = charge(null, {writeError: true});
    V.verifie('quota épuisé : message et tables conservées en mémoire', m.alerts.length > 0 && m.appState.customMaterials.length === 1);
    noThrow('stockage bloqué : démarrage possible', () => charge(null, {readError: true}));
    const rows = [{l: 550, n: 1.7, k: 0}];
    const recovery = charge([null, {id: 'custom_mat_ok', sym: 'H', name: 'verre', table: rows}, {id: 'BK7', sym: 'X', table: rows}]);
    V.verifie('récupération : entrée valide conservée et alias H protégé', recovery.appState.customMaterials.length === 1
        && recovery.appState.customMaterials[0].id === 'custom_mat_ok'
        && recovery.appState.customMaterials[0].sym !== 'H' && recovery.MATERIALS_DB.BK7.type !== 'custom_table');
}
{
    const m = fresh(), mat = m.appState.customMaterials[0];
    m.appState.layers = [{matId: mat.id, val: 100, unit: 'nm'}];
    const frozen = m.captureOpticalState();
    const before = m.computeTMMPointCustom(550, 40, 'Air', 'BK7', m.appState.layers, frozen);
    delete m.MATERIALS_DB[mat.id];
    const after = m.computeTMMPointCustom(550, 40, 'Air', 'BK7', m.appState.layers, frozen);
    V.verifie('instantané lisible après suppression de la définition courante', JSON.stringify(before) === JSON.stringify(after));
}
{
    const m = fresh();
    m.appState.substrat = 'Custom'; m.appState.customSubN = 2; m.appState.customSubK = 0.5;
    const frozen = m.captureOpticalState(), layers = [{matId: 'ZnS_fresnel', val: 100, unit: 'nm'}];
    const before = m.computeTMMPointCustom(550, 20, 'Air', 'Custom', layers, frozen);
    m.appState.customSubN = 3; m.appState.customSubK = 1;
    V.verifie('instantané : les indices constants des milieux restent figés', JSON.stringify(before)
        === JSON.stringify(m.computeTMMPointCustom(550, 20, 'Air', 'Custom', layers, frozen)));
    const a = {layerCount: 1, complianceFlags: [true], opticalMediaSignature: 'verre1'};
    V.verifie('comparateur : des milieux différents rendent la comparaison invalide',
        m.reviewPairingStatus(a, {...a, opticalMediaSignature: 'verre2'}) === 'invalid');
}

V.groupe('H. Couches opaques : référence Airy indépendante et limite de Fresnel');
{
    const m = fresh(), errors = [];
    for (const [n,k] of [[2,30], [0.1,10], [0.8,0]]) {
        const mat = custom(m, [{l: 550, n, k}]);
        for (const d of [1,20,200,1200]) for (const l of [350,550,800]) for (const angle of [0,25,70]) {
            const state = {...m.appState, layers: [{matId: mat.id, val: d, unit: 'nm'}]};
            const out = m.computeTMMPoint(l, angle, state);
            const sub = {n: m.MATERIALS_DB.BK7.getN(l).r, k: 0};
            for (const pol of ['s', 'p']) {
                const ref = Ref.rouard(l, angle, [{n,k,d}], {n:1,k:0}, sub, pol);
                errors.push([Math.abs(out[pol === 's' ? 'Rs' : 'Rp'] - ref.R), `${n}/${k}, ${d} nm, ${l} nm, ${angle}°, ${pol}, R`]);
                errors.push([Math.abs(out[pol === 's' ? 'Ts' : 'Tp'] - ref.T), `${n}/${k}, ${d} nm, ${l} nm, ${angle}°, ${pol}, T`]);
            }
        }
    }
    V.serieProche('accord Abelès mis à l’échelle / Airy', errors, 1e-10);
    const mat = custom(m, [{l:550,n:2,k:30}]);
    V.proche('limite opaque : Fresnel du métal semi-infini',
        m.computeTMMPoint(200,0,{...m.appState,layers:[{matId:mat.id,unit:'nm',val:1200}]}).R_avg,
        Ref.metalSemiInfini(2,30), 1e-12);
    const long = m.parseStackFormula('(HL)^1000');
    const out = m.computeTMMPoint(550,0,{...m.appState,layers:long});
    V.verifie('miroir de 2000 couches : énergie finie et bornée', Number.isFinite(out.R_avg) && Number.isFinite(out.T_avg)
        && out.R_avg + out.T_avg <= 1 + 1e-10);
    V.verifie('aucun garde-fou déclenché par les nouveaux cas physiques', m.Garde.intact);
}
process.exitCode = V.bilan() ? 1 : 0;
