'use strict';
const vm = require('vm');
const {chargeMoteur, scriptsDe, litSimulateur} = require('./lib/extraction');
const Ref = require('./lib/reference');
const V = require('./lib/verif');
const M = chargeMoteur();
const layer = (matId, val) => ({matId, val, unit:'nm', locked:false});
const state = o => Object.assign({superstrat:'Air', substrat:'BK7', customSuperN:1, customSubN:1.52, customSubK:0,
    designL0:550, designIncDeg:0, layers:[], considerBackside:true,
    backLayers:[], backMedium:'Air', backCustomN:1, backCustomK:0, backDesignL0:550}, o);
const compare = (label, a, b, tol=1e-11) => V.serieProche(label,
    ['Rs','Rp','Ts','Tp'].map(k => [Math.abs(a[k]-b[k]), k]), tol);

V.suite('COATING ARRIÈRE — modèle incohérent et interface bilingue');
V.groupe('A. Limites analytiques et conservation');
{
    const n = M.MATERIALS_DB.BK7.getN(550).r, r = ((n-1)/(n+1))**2;
    const out = M.computeTMMPoint(550,0,state());
    V.proche('plaque nue : R = 2r/(1+r)', out.R_avg, 2*r/(1+r), 1e-12);
    V.proche('plaque nue : T = (1-r)/(1+r)', out.T_avg, (1-r)/(1+r), 1e-12);
    M.MATERIALS_DB.IdealRear = {getN:()=>({r:Math.sqrt(n),i:0})};
    const ar = layer('IdealRear',550/(4*Math.sqrt(n)));
    const rearAR = M.computeTMMPoint(550,0,state({backLayers:[ar]}));
    V.proche('AR arrière idéal : seule la réflexion avant subsiste', rearAR.R_avg, r, 1e-12);
    V.verifie('AR arrière : la transmission augmente', rearAR.T_avg > out.T_avg);
    const both = M.computeTMMPoint(550,0,state({layers:[ar],backLayers:[ar]}));
    V.proche('AR idéal sur deux faces : R = 0', both.R_avg, 0, 1e-12);
    V.proche('AR idéal sur deux faces : T = 1', both.T_avg, 1, 1e-12);
}
{
    const s = state({layers:[layer('ZnS_fresnel',90),layer('Au',12)],backMedium:'BK7'});
    compare('sortie identique au substrat sans coating : calcul avant inchangé',
        M.computeTMMPoint(550,40,s), M.computeTMMPoint(550,40,{...s,considerBackside:false}));
    compare('option désactivée : aucune influence d’un coating arrière stocké',
        M.computeTMMPoint(550,40,{...s,considerBackside:false,backLayers:[layer('Au',500)]}),
        M.computeTMMPoint(550,40,{...s,considerBackside:false}));
    const a = M.computeTMMPoint(550,25,state({layers:[layer('Au',40)],backLayers:[layer('TiO2',70)]}));
    const b = M.computeTMMPoint(550,25,state({layers:[layer('Au',10)],backLayers:[layer('TiO2',70)]}),[40]);
    compare('les épaisseurs d’essai de l’optimiseur valent aussi au retour',a,b);
    const t = M.computeTMMPoint(550,60,state({superstrat:'BK7',substrat:'Air'}));
    V.proche('réflexion totale avant : R = 1', t.R_avg, 1, 1e-12);
    V.proche('réflexion totale avant : T = 0', t.T_avg, 0, 1e-10);
    const trapped = M.computeTMMPoint(550,60,state({superstrat:'BK7',substrat:'Custom',customSubN:2}));
    V.proche('réflexion totale arrière : toute la lumière finit réfléchie',trapped.R_avg,1,1e-12);
    V.proche('réflexion totale arrière : transmission nulle',trapped.T_avg,0,1e-10);
    let refused=false;
    try {M.computeTMMPoint(550,0,state({substrat:'Custom',customSubK:0.01}));} catch (_) {refused=true;}
    V.verifie('un substrat absorbant n’est pas assimilé à une lame transparente',refused);
}

V.groupe('B. Référence indépendante : moyenne de simulations cohérentes');
{
    const configs = [
        ['deux faces nues',[],[]],
        ['coatings asymétriques',[layer('ZnS_fresnel',75),layer('YF3_fresnel',110)],[layer('TiO2',45),layer('FusedSilica',95)]],
        ['deux coatings absorbants',[layer('Au',15)],[layer('Au',20)]],
        ['arrière métallique épais',[layer('TiO2',70)],[layer('Au',500)]],
    ];
    for (const [label,front,rear] of configs) {
        const errors=[];
        for (const lambda of [450,550,650]) for (const angle of [0,40]) {
            const nBulk=M.MATERIALS_DB.BK7.getN(lambda).r;
            const gamma=Math.sqrt(nBulk*nBulk-Math.sin(angle*Math.PI/180)**2);
            const optical = layers => layers.map(l => {const N=M.MATERIALS_DB[l.matId].getN(lambda);return {n:N.r,k:N.i,d:l.val};});
            const f=optical(front), b=optical(rear), N=1024;
            const avg={s:{R:0,T:0},p:{R:0,T:0}};
            for (let j=0;j<N;j++) {
                const bulk={n:nBulk,k:0,d:(1000+(j+0.5)/N)*lambda/(2*gamma)};
                const deposited=[...b.slice().reverse(),bulk,...f];
                for (const pol of ['s','p']) {
                    const ref=Ref.rouard(lambda,angle,deposited,{n:1,k:0},{n:1,k:0},pol);
                    avg[pol].R+=ref.R/N; avg[pol].T+=ref.T/N;
                }
            }
            const out=M.computeTMMPoint(lambda,angle,state({layers:front,backLayers:rear}));
            for (const pol of ['s','p']) for (const qty of ['R','T']) errors.push([Math.abs(out[qty+pol]-avg[pol][qty]),`${lambda} nm, ${angle}°, ${qty}${pol}`]);
        }
        V.serieProche(`${label} : Abelès incohérent / Airy cohérent moyenné`,errors,1e-10);
    }
    V.verifie('aucun garde-fou d’énergie ou de polarisation déclenché',M.Garde.intact);
}

V.groupe('C. Traitement fixe et interface élève');
{
    const nodes=new Map();
    const get=id=>{
        if(id!=='backsidePanel' && id!=='inpBackFormula')return null;
        if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'H L',listeners:{},querySelector:()=>null,
            addEventListener(type,cb){this.listeners[type]=cb;}});
        return nodes.get(id);
    };
    const context=vm.createContext({window:{addEventListener(){}},document:{getElementById:get,querySelector:()=>null},console,alert:()=>{}});
    vm.runInContext(scriptsDe(litSimulateur()),context);
    vm.runInContext('runFullSimulation=()=>{};',context);
    const U=vm.runInContext('({appState,MATERIALS_DB,renderBacksideEditor,wireBacksideEditor,captureOpticalState,computeTMMPointCustom,computeTMMPoint,setLang:lang=>currentLang=lang})',context);
    U.appState.layers=[layer('ZnS_fresnel',88),layer('YF3_fresnel',111)];
    U.appState.considerBackside=true;
    U.wireBacksideEditor();
    const click=action=>get('backsidePanel').listeners.click({target:{closest:()=>({dataset:{rearAction:action}})}});
    click('copy');
    V.verifie('copie avant → arrière : mêmes épaisseurs physiques',JSON.stringify(U.appState.backLayers.map(l=>l.val))==='[88,111]');
    U.appState.layers[0].val=150;
    V.proche('la copie arrière reste indépendante',U.appState.backLayers[0].val,88,0);
    const frozen=U.captureOpticalState();
    const before=U.computeTMMPointCustom(550,20,'Air','BK7',U.appState.layers,frozen);
    U.appState.backLayers[0].val=30;
    const after=U.computeTMMPointCustom(550,20,'Air','BK7',U.appState.layers,frozen);
    compare('l’instantané conserve aussi le coating arrière',before,after);
    compare('le calcul auxiliaire de mérite inclut le coating arrière',
        U.computeTMMPointCustom(550,20,'Air','BK7',U.appState.layers),U.computeTMMPoint(550,20,U.appState));
    click('quarter');
    V.proche('préréglage élève : SiO₂ quart d’onde',U.appState.backLayers[0].val,550/(4*U.MATERIALS_DB.FusedSilica.getN(550).r),1e-12);
    click('formula');
    V.verifie('formule arrière : conversion en nm',U.appState.backLayers.length===2 && U.appState.backLayers.every(l=>l.unit==='nm'));
    const saved=U.appState.backLayers[0].val;
    U.appState.designL0=700;U.appState.designIncDeg=40;
    V.proche('changer le banc avant ne change pas les épaisseurs arrière',U.appState.backLayers[0].val,saved,0);
    for (const lang of ['fr','en']) {
        U.setLang(lang);U.renderBacksideEditor();
        const html=get('backsidePanel').innerHTML;
        const foreign=lang==='en'? /Face arrière|Réglages|Épaisseur|Ajouter une|Traitement connu|couche\(s\)|substrat épais/i : /Rear surface|Advanced settings|Thickness|Add a layer|Known coating|Copy front coating/i;
        V.verifie(`éditeur arrière intégralement ${lang==='fr'?'français':'anglais'}`,!foreign.test(html));
    }
}
process.exitCode=V.bilan()?1:0;
