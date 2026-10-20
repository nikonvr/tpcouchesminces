/* Régression des enchaînements de commandes (audit du 19 octobre 2026).
   Exécution : node tests/test_interactions.js
   Chaque groupe reproduit un défaut constaté (A01…A14, saisie, sauvegarde)
   avec les gestionnaires RÉELS du simulateur et vérifie qu'il ne revient pas.
*/
'use strict';
const vm = require('vm');
const V = require('./lib/verif');
const { charge, html } = require('./lib/harnais');

const run = (m, code) => vm.runInContext(code, m.context);
const STUBS = 'updateCharts=()=>{};calculateMetrics=()=>{};renderDesignReview=()=>{};renderLayersTable=()=>{};'
    + 'renderCustomTargetEditor=()=>{};updateMeritGridNote=()=>{};updateAcceptanceUI=()=>{};';
function setup() {
    const m = charge(null, { keepSimulation: true });
    run(m, STUBS + `wireCustomTargetEditor();
        appState.customTarget.segments=[{lmin:500,lmax:550,quantity:'T',value:90,weight:1,angle:0,pol:'moy'}];
        appState.lastQualification={marker:'ancien'};
        liveBi('txtMonteCarloResult','Décision : QUALIFIÉ (ancien)','Decision: QUALIFIED (old)');`);
    return m;
}
const mcText = m => m.element('txtMonteCarloResult').textContent;

V.suite('ENCHAÎNEMENTS DE COMMANDES — résultats périmés, imports, saisies, sauvegarde');

V.groupe('A01/A07 — une qualification ne survit à aucune modification');
{
    const m = setup();
    m.element('tbodyCustomTarget').fire('input', { target: { dataset: { tg: 'value', i: '0' }, value: '20' } });
    V.verifie('segment modifié : qualification supprimée', m.appState.lastQualification === null);
    V.verifie('segment modifié : ancien verdict remplacé par « périmé »', /périmé/.test(mcText(m)), mcText(m));
}
{
    const m = setup();
    m.element('inpTargetThreshold').value = '1';
    m.element('inpTargetThreshold').fire('input');
    V.verifie('seuil RMSE modifié : qualification supprimée', m.appState.lastQualification === null);
}
{
    const m = setup();
    m.element('arWindowList').fire('input', { target: { dataset: { ar: 'lmax', i: '0' }, value: '600' } });
    V.verifie('fenêtre AR modifiée : qualification supprimée', m.appState.lastQualification === null);
}
{
    const m = setup();
    run(m, 'mcEnCours = {};');
    m.element('tbodyCustomTarget').fire('input', { target: { dataset: { tg: 'value', i: '0' }, value: '20' } });
    V.verifie('Monte-Carlo en cours : interrompu par une modification de la cible', run(m, 'mcEnCours') === null);
}
{
    const m = setup();
    run(m, 'runFullSimulation();');
    V.verifie('changement physique : qualification supprimée', m.appState.lastQualification === null);
    V.verifie('changement physique : ancien verdict signalé périmé', /périmé/.test(mcText(m)), mcText(m));
    run(m, "setAppLanguagePro && (currentLang = 'en'); refreshLiveTexts();");
    V.verifie('message de péremption retraduit en anglais', /Outdated/.test(mcText(m)), mcText(m));
}

V.groupe('A02 — diagnostic d’aiguille retiré après modification');
{
    const m = setup();
    run(m, "needleBestInfo = {gain: 1}; recommendedNeedleStack = [{matId:'TiO2',unit:'nm',val:10}]; appState.substrat='FusedSilica';");
    run(m, 'runFullSimulation();');
    V.verifie('relance physique : diagnostic retiré', run(m, 'needleBestInfo') === null);
    V.verifie('relance physique : recommandation retirée', run(m, 'recommendedNeedleStack') === null);
}
{
    const m = setup();
    run(m, "needleBestInfo = {gain: 1}; recommendedNeedleStack = [];");
    m.element('tbodyCustomTarget').fire('input', { target: { dataset: { tg: 'value', i: '0' }, value: '20' } });
    V.verifie('mérite modifié : diagnostic retiré', run(m, 'needleBestInfo') === null);
}

V.groupe('A03/A04 — import de cible atomique, validé et échappé');
const importe = (m, text) => {
    m.element('btnTargetImport').click();
    m.element('created_input').files = [{}];
    m.element('created_input').onchange();
    const reader = m.readers[m.readers.length - 1];
    reader.result = text;
    reader.onload();
};
{
    const m = setup();
    const before = JSON.stringify(m.appState.customTarget.segments);
    importe(m, '{"segments":[null]}');
    V.verifie('segment nul : cible précédente intacte', JSON.stringify(m.appState.customTarget.segments) === before);
    V.verifie('segment nul : refus annoncé sans boîte bloquante, cible conservée', /conservée/.test(m.element('appToast').textContent), m.element('appToast').textContent);
    importe(m, '{"segments":[{"lmin":500,"lmax":550,"quantity":"T","value":"1\\" data-x=\\"injected","weight":1}]}');
    V.verifie('valeur non numérique : refusée', JSON.stringify(m.appState.customTarget.segments) === before);
    importe(m, '{"segments":[{"lmin":500,"lmax":550,"quantity":"<img>","value":50}]}');
    V.verifie('grandeur inconnue : refusée', JSON.stringify(m.appState.customTarget.segments) === before);
    importe(m, '{"segments":[{"lmin":1e308,"lmax":1.0000000000000002e308,"value":50}]}');
    V.verifie('bornes hors banc : refusées', JSON.stringify(m.appState.customTarget.segments) === before);
    importe(m, 'pas du json');
    V.verifie('JSON illisible : refusé', JSON.stringify(m.appState.customTarget.segments) === before);
    importe(m, '{"segments":[{"lmin":"600","lmax":650,"quantity":"R","value":5,"weight":2,"angle":45,"pol":"s"}],"step":2,"threshold":3}');
    const s = m.appState.customTarget.segments[0];
    V.verifie('fichier valide : cible remplacée, nombres normalisés',
        m.appState.customTarget.segments.length === 1 && s.lmin === 600 && s.quantity === 'R' && s.pol === 's' && s.angle === 45);
    V.verifie('fichier valide : pas et seuil appliqués', m.element('inpTargetStep').value === 2 && m.element('inpTargetThreshold').value === 3);
}
{
    const m = charge(null, { keepSimulation: true });
    run(m, `getObjectiveMode=()=>'custom'; evaluateCustomTarget=()=>({points:1,rmse:0});
        appState.customTarget.segments=[{lmin:500,lmax:550,quantity:'T',value:'1" data-x="injected',weight:1,angle:0,pol:'moy'}];
        renderCustomTargetEditor();`);
    V.verifie('rendu : une valeur hostile reste un texte échappé', !m.element('tbodyCustomTarget').innerHTML.includes('data-x="injected'));
}

V.groupe('A06 — grilles bornées, jamais de boucle infinie');
{
    const m = charge(null, { keepSimulation: true });
    V.verifie('grille 1e308 : refusée immédiatement', run(m, 'gridPoints(1e308, 1.0000000000000002e308, 0.1).length') <= 3);
    V.verifie('grille de 30 001 points : refusée', run(m, 'gridPoints(0, 3000, 0.1).length') === 0);
    V.verifie('grille normale : points exacts aux bornes', run(m, 'JSON.stringify(gridPoints(400, 410, 5))') === '[400,405,410]');
    m.element('inpTargetStep').value = '0.1';
    run(m, "appState.customTarget.segments=[{lmin:200,lmax:2500,quantity:'T',value:50,weight:1,angle:0,pol:'moy'}];");
    V.verifie('cible trop lourde : signalée', run(m, 'getCustomTarget().tooLarge') === true);
    V.verifie('cible trop lourde : aucun calcul lancé', run(m, 'evaluateCustomTarget(null).points') === 0);
    m.element('selMeritObjective').value = 'custom';
    V.verifie('cible trop lourde : mérite refusé avec sa raison', /trop|plus de/.test(run(m, 'meritUndefinedReason()') || ''));
    run(m, "appState.customTarget.segments=[{lmin:500,lmax:400,quantity:'T',value:50,weight:1}];");
    V.verifie('segment inversé : écarté et compté', run(m, 'getCustomTarget().ignored') === 1);
}

V.groupe('A08 — avertissement de bande conforme au calcul');
{
    const m = charge(null, { keepSimulation: true });
    run(m, "appState.lMin=500; appState.lMax=550; appState.bands=[{lmin:600,lmax:610,step:5,qty:'T'}]; updateQrBandWarning();");
    const t = m.element('txtQrBandWarning').textContent;
    V.verifie('le message ne prétend plus à une troncature', !/tronqu/.test(t), t);
    V.verifie('le message dit que toute la bande est calculée', /toute la bande/.test(t), t);
}

V.groupe('A09/A13 — mémoires typées et retraduites');
{
    const m = charge(null, { keepSimulation: true });
    run(m, STUBS + "appState.lastCalc={x:[500,550],R_avg:[1,2],T_avg:[99,98],A_avg:[0,0]}; appState.mode='spectral';");
    run(m, 'setupEventListeners();');
    m.element('btnStoreMemory').click();
    const mem = m.appState.savedMemories[0];
    V.verifie('mémoire : type d’axe enregistré', mem && mem.mode === 'spectral');
    V.verifie('mémoire : R, T et A enregistrés', mem && mem.T[1] === 98 && mem.A.length === 2);
    V.verifie('mémoire : aucun libellé figé dans une langue', mem && !('label' in mem));
}

V.groupe('A10 — QWOT évanescent annoncé');
{
    const m = charge(null, { keepSimulation: true });
    run(m, "appState.superstrat='Custom'; appState.customSuperN=2; appState.designIncDeg=60; appState.designL0=550;"
        + "appState.layers=[{matId:'FusedSilica',unit:'QWOT',val:1,locked:false},{matId:'TiO2',unit:'QWOT',val:1,locked:false},{matId:'FusedSilica',unit:'nm',val:90,locked:false}];");
    V.verifie('couche de silice en QWOT à 60° depuis n = 2 : signalée', run(m, 'JSON.stringify(qwotEvanescentLayers())') === '[1]');
}

V.groupe('A11 — saisies refusées sans corrompre l’état');
{
    const m = charge(null, { keepSimulation: true });
    run(m, STUBS + "appState.layers=[{matId:'TiO2',unit:'QWOT',val:1,locked:false}];");
    const node = m.element('rowVal'); node.dataset.idx = '0';
    m.queries.set('.inpLayerVal', [node]);
    run(m, 'attachTableEvents();');
    node.value = '-1'; node.onchange({ target: node });
    V.verifie('épaisseur négative : refusée, ancienne valeur conservée', m.appState.layers[0].val === 1 && node.value === 1);
    node.value = 'abc'; node.onchange({ target: node });
    V.verifie('épaisseur illisible : refusée', m.appState.layers[0].val === 1);
    node.value = '2,5'; node.onchange({ target: node });
    V.verifie('virgule décimale acceptée : 2,5', m.appState.layers[0].val === 2.5);
}
{
    const m = charge(null, { keepSimulation: true });
    run(m, STUBS + 'setupEventListeners();');
    const lmin = m.element('inpLMin');
    lmin.value = '900';
    lmin.fire('change');
    V.verifie('λmin > λmax : refusé', m.appState.lMin === 350 && m.appState.lMax === 850, `lMin=${m.appState.lMin}`);
}
{
    const m = charge(null, { keepSimulation: true });
    V.verifie('nombre décimal : « 2,05 » = 2.05', run(m, 'parseDecimalInput(" 2,05 ")') === 2.05);
    V.verifie('nombre décimal : « 1e-3 » accepté', run(m, 'parseDecimalInput("1e-3")') === 0.001);
    V.verifie('nombre décimal : « 2,0,5 » refusé', Number.isNaN(run(m, 'parseDecimalInput("2,0,5")')));
    V.verifie('nombre décimal : champ vide refusé', Number.isNaN(run(m, 'parseDecimalInput("")')));
}

V.groupe('A12 — conception libre réservée au mode libre');
{
    const m = charge(null, { keepSimulation: true });
    m.element('selMeritObjective').dispatchEvent = () => {};
    m.element('divCustomTarget').animate = () => {};
    run(m, STUBS + "globalThis.Event = class { constructor(type) { this.type = type; } };"
        + "applyUiMode=()=>{}; appState.uiMode='etudiant'; appState.exercise=1; enterFreeDesign();");
    V.verifie('enterFreeDesign depuis un exercice : passe réellement en libre',
        m.appState.uiMode === 'libre' && m.appState.exercise === null);
}

V.groupe('Sauvegarde du travail — export, validation, restauration');
{
    const a = charge(null, { keepSimulation: true });
    run(a, STUBS + `appState.layers=[{matId:'TiO2',unit:'nm',val:61.5,locked:true},{matId:'FusedSilica',unit:'QWOT',val:1,locked:false}];
        appState.substrat='FusedSilica'; appState.lMin=400; appState.lMax=900; appState.uiMode='etudiant'; appState.exercise=3;
        appState.customTarget.segments=[{lmin:450,lmax:650,quantity:'T',value:100,weight:1,angle:0,pol:'moy'}];`);
    a.element('selMeritObjective').value = 'custom';
    const exported = run(a, 'JSON.stringify(captureProject())');
    const b = charge(null, { keepSimulation: true });
    run(b, STUBS + 'applyUiMode=()=>{}; renderExerciseSelector=()=>{}; renderBacksideEditor=()=>{}; renderBandAnalyzer=()=>{};');
    run(b, `applyProject(validateProject(JSON.parse(${JSON.stringify(exported)})));`);
    V.verifie('restauration : couches, unités et verrous identiques',
        JSON.stringify(b.appState.layers) === JSON.stringify(a.appState.layers));
    V.verifie('restauration : milieux, plage, exercice et cible',
        b.appState.substrat === 'FusedSilica' && b.appState.lMax === 900 && b.appState.exercise === 3
        && b.appState.customTarget.segments.length === 1 && b.element('selMeritObjective').value === 'custom');
    const bad = JSON.parse(exported); bad.state.layers[0].matId = 'Inconnu';
    let refused = false;
    try { run(b, `validateProject(${JSON.stringify(bad)})`); } catch (_e) { refused = true; }
    V.verifie('matériau inconnu : fichier refusé avant toute modification', refused && b.appState.layers.length === 2);
    const bad2 = JSON.parse(exported); bad2.state.lMin = 1000;
    refused = false;
    try { run(b, `validateProject(${JSON.stringify(bad2)})`); } catch (_e) { refused = true; }
    V.verifie('plage incohérente : fichier refusé', refused);
}
{
    const m = charge(null, { keepSimulation: true });
    m.storage.set('simulateur_cm_projet_v1', '{"format":"simulateur-couches-minces","version":1,"state":{"layers":"x"}}');
    run(m, STUBS + 'restoreSavedProjectAtStartup();');
    V.verifie('enregistrement endommagé : départ à vide annoncé', /illisible/.test(m.element('txtProjectStatus').textContent));
    V.verifie('enregistrement endommagé : sauvegarde réactivée', run(m, 'projectAutosaveReady') === true);
    run(m, "appState.layers=[{matId:'TiO2',unit:'nm',val:10,locked:false}]; saveProjectNow();");
    V.verifie('sauvegarde : écrite dans le stockage local',
        JSON.parse(m.storage.get('simulateur_cm_projet_v1')).state.layers[0].val === 10);
}
{
    const m = charge(null, { keepSimulation: true });
    run(m, 'saveProjectNow();');
    V.verifie('avant la restauration de démarrage : rien n’est écrasé', !m.storage.has('simulateur_cm_projet_v1'));
}

V.groupe('Guide du mode libre — coches fidèles à l’état réel');
{
    const m = charge(null, { keepSimulation: true });
    const steps = () => run(m, 'JSON.stringify(freeGuideSteps().map(s => s.done))');
    V.verifie('départ : aucune coche d’office, même pour les milieux', steps() === '[false,false,false,false,false,false]', steps());
    run(m, "appState.layers=[{matId:'TiO2',unit:'QWOT',val:1,locked:false}];"
        + "appState.customTarget.segments=[{lmin:450,lmax:650,quantity:'T',value:100,weight:1,angle:0,pol:'moy'}];");
    V.verifie('couche et cible déclarées : étapes 1 à 3 cochées', steps() === '[true,true,true,false,false,false]', steps());
    run(m, 'workExported = true;');
    V.verifie('travail exporté : étape 6 cochée', JSON.parse(steps())[5] === true);
    run(m, "appState.customTarget.segments[0].weight = 0;");
    V.verifie('cible de poids nul : étape 3 non cochée', JSON.parse(steps())[2] === false);
    run(m, "appState.lastQualification = {};");
    V.verifie('qualification à jour : étape 5 cochée', JSON.parse(steps())[4] === true);
}

V.groupe('Mode libre épuré — structure et finition');
{
    const m = charge(null, { keepSimulation: true });
    V.verifie('bandes Fresnel par défaut reconnues (vidées en mode libre)',
        run(m, 'JSON.stringify(appState.bands) === DEFAULT_BANDS_JSON') === true);
    const texts = JSON.parse(run(m, 'JSON.stringify(FREE_TEXT)'));
    const bad = Object.entries(texts).filter(([k, v]) => !v[0] || !v[1] || (v[0] === v[1] && !/Short$/.test(k))).map(([k]) => k);
    V.verifie('libellés du mode libre en français ET en anglais', bad.length === 0, bad.join(', '));
    const src = run(m, 'prepareFreeLayout.toString() + applyFreeLayout.toString()');
    const direct = [...src.matchAll(/byId\('([A-Za-z0-9_]+)'\)/g)].map(x => x[1]);
    const listed = [...src.matchAll(/\[\s*('[A-Za-z0-9_]+'(?:\s*,\s*'[A-Za-z0-9_]+')+)\s*\]/g)]
        .flatMap(x => x[1].split(',').map(t => t.trim().slice(1, -1)));
    const ids = [...new Set(direct.concat(listed))];
    const absent = ids.filter(id => !/^(sim|bands|materials|media|stack|target|optimizer|mc)$/.test(id)
        && !html.includes(`id="${id}"`) && !src.includes(`.id = '${id}'`) && !src.includes(`id="${id}"`));
    V.verifie(`${ids.length} éléments de la mise en page libre présents dans la page`, absent.length === 0, absent.join(', '));
    run(m, "appState.lastCalc={x:[600],R_avg:[4.214],T_avg:[95.786],A_avg:[0]}; currentLang='fr'; updateCursorReadout(0);");
    V.verifie('relevés en décimales françaises : 4,21 %', m.element('valCursorR').textContent === '4,21 %', m.element('valCursorR').textContent);
    run(m, "currentLang='en'; updateCursorReadout(0);");
    V.verifie('relevés en décimales anglaises : 4.21 %', m.element('valCursorR').textContent === '4.21 %');
}

V.groupe('Annuler / Rétablir — tout le travail, sans changer de mode');
{
    const m = charge(null, { keepSimulation: true });
    run(m, STUBS + 'applyUiMode=()=>{}; renderExerciseSelector=()=>{}; renderBacksideEditor=()=>{}; renderBandAnalyzer=()=>{};'
        + "projectAutosaveReady = true; appState.uiMode='libre'; recordHistory();"
        + "appState.layers=[{matId:'TiO2',unit:'nm',val:60,locked:false}]; saveProjectNow();"
        + "appState.layers=[{matId:'TiO2',unit:'nm',val:60,locked:false},{matId:'FusedSilica',unit:'nm',val:90,locked:false}]; saveProjectNow();");
    V.verifie('trois états mémorisés', run(m, 'workHistory.past.length') === 3);
    run(m, 'stepHistory(-1);');
    V.verifie('annuler : retour à une couche', m.appState.layers.length === 1 && m.appState.layers[0].val === 60);
    run(m, 'stepHistory(-1);');
    V.verifie('annuler encore : empilement vide', m.appState.layers.length === 0);
    run(m, 'stepHistory(-1);');
    V.verifie('rien avant le premier état : sans effet', m.appState.layers.length === 0);
    run(m, 'stepHistory(1); stepHistory(1);');
    V.verifie('rétablir deux fois : deux couches', m.appState.layers.length === 2);
    V.verifie('le mode ne change pas', m.appState.uiMode === 'libre');
    run(m, 'stepHistory(-1);' + "appState.layers=[{matId:'Al2O3',unit:'nm',val:80,locked:false}]; saveProjectNow();");
    V.verifie('nouvelle modification après annulation : rétablir est vidé', run(m, 'workHistory.future.length') === 0);
}

V.groupe('Verdict Monte-Carlo en une phrase (mode libre)');
{
    const m = charge(null, { keepSimulation: true });
    const base = "{objective:'custom', acceptance:{rmseMax:5}, numRuns:500, requiredYieldPct:90, yieldPct:0, nominalMerit:10.6, decisionKey:'rejected'}";
    run(m, "currentLang='fr';");
    const h1 = run(m, `monteCarloHeadline(${base})`);
    V.verifie('nominal hors critère : le verdict dit d’améliorer la conception', /Non qualifié/.test(h1) && /nominal/.test(h1), h1);
    const h2 = run(m, `monteCarloHeadline({...${base}, nominalMerit: 2, yieldPct: 40})`);
    V.verifie('nominal conforme mais fragile : le verdict parle de sensibilité', /sensible/.test(h2), h2);
    const h3 = run(m, `monteCarloHeadline({...${base}, decisionKey:'qualified', yieldPct: 97})`);
    V.verifie('qualifié : phrase positive avec le rendement', /^✅ Qualifié : 97,0 %/.test(h3), h3);
    run(m, "currentLang='en';");
    V.verifie('verdict traduit en anglais', /^❌ Not qualified/.test(run(m, `monteCarloHeadline(${base})`)));
    const html = run(m, `monteCarloResultHtml({...${base}, nominalMinimum:0, nominalMaximum:0, feasibleCount:500, feasibilityPct:100, minimumThicknessNm:1, meanMerit:10, stdMerit:1, meritMin:9, meritMax:11, p05:9, p50:10, p95:11, toleranceNm:2, seed:42, perturbedCount:1, accepted:0, yieldLowPct:0, yieldHighPct:1, opticalState:{}})`);
    V.verifie('détail statistique replié sous le verdict', /<details/.test(html) && /Statistical details/.test(html));
}

V.groupe('Guide : optimiser ne suffit pas si la cible n’est pas atteinte');
{
    const m = charge(null, { keepSimulation: true });
    run(m, "appState.layers=[{matId:'ZnS_fresnel',unit:'QWOT',val:1,locked:false}];"
        + "appState.customTarget.segments=[{lmin:450,lmax:650,quantity:'T',value:100,weight:1,angle:0,pol:'moy'}];"
        + "liveBi('txtOptiResult','RMSE cible : 32 → 10','Target RMSE: 32 → 10');");
    const s4 = JSON.parse(run(m, 'JSON.stringify(freeGuideSteps()[3])'));
    V.verifie('cible non atteinte : étape 4 non cochée', s4.done === false);
    V.verifie('cible non atteinte : le guide propose une couche utile', s4.act === 'needle' && /RMSE/.test(s4.text), s4.text);
    m.element('inpTargetThreshold').value = '50';
    const s4b = JSON.parse(run(m, 'JSON.stringify(freeGuideSteps()[3])'));
    V.verifie('seuil atteint : étape 4 cochée', s4b.done === true);
}

V.groupe('Contre-audit — messages, cases vides, formule');
{
    const m = charge(null, { keepSimulation: true });
    run(m, "liveBi('txtOptiResult', '—', '—');");
    V.verifie('case de résultat vide marquée (masquée en mode libre)', m.element('txtOptiResult').dataset.empty === 'true');
    run(m, "liveBi('txtOptiResult', 'RMSE : 3 → 1', 'RMSE: 3 → 1');");
    V.verifie('case de résultat remplie : affichée', m.element('txtOptiResult').dataset.empty === 'false');
    run(m, "notify('essai');");
    V.verifie('message non bloquant affiché', m.element('appToast').textContent === 'essai');
    V.verifie('aucune boîte bloquante dans les chemins du mode libre (formule, aiguille)',
        html.includes("catch (err) { notify(err.message); document.getElementById('inpFormulaStr')")
        && !html.includes('alert(currentLang === \'fr\' ? "Déposez au moins une couche'));
}

V.groupe('Infobulles FR/EN');
{
    const m = charge(null, { keepSimulation: true });
    const tips = run(m, 'JSON.stringify(CONTROL_TIPS)');
    const table = JSON.parse(tips);
    const ids = Object.keys(table);
    const missing = ids.filter(id => !html.includes(`id="${id}"`));
    V.verifie(`${ids.length} commandes documentées, toutes présentes dans la page`, ids.length >= 40 && missing.length === 0, missing.join(', '));
    const same = ids.filter(id => !table[id][0] || !table[id][1] || table[id][0] === table[id][1]);
    V.verifie('chaque infobulle existe en français ET en anglais', same.length === 0, same.join(', '));
}

V.bilan();
