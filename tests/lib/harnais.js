/* Harnais commun : exécute le JavaScript RÉEL complet du simulateur dans un
   contexte isolé. Seuls le DOM, le stockage et les rafraîchissements
   graphiques sont simulés ; commandes, imports, tables et calculs restent
   ceux du HTML. Options :
     readError / writeError : stockage local qui échoue ;
     keepSimulation        : conserve runFullSimulation et renderLayersTable
                             (sinon remplacés par des compteurs). */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { scriptsDe } = require('./extraction');
const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(process.env.TP_SIMULATEUR || path.join(root, 'simulateur_couches_minces.html'), 'utf8');

function charge(saved = null, options = {}) {
    const nodes = new Map(), queries = new Map(), alerts = [], readers = [];
    const storage = new Map(saved === null ? [] : [['simulateur_cm_custom_materials', JSON.stringify(saved)]]);
    function element(id) {
        if (!nodes.has(id)) {
            const listeners = new Map(), classes = new Set();
            nodes.set(id, {
                value: '', textContent: '', dataset: {}, style: {}, disabled: false,
                _html: '',
                set innerHTML(value) {
                    this._html = value;
                    const firstOption = /<option value="([^"]+)"/.exec(value);
                    if (firstOption) this.value = firstOption[1];
                },
                get innerHTML() { return this._html; },
                classList: {
                    add: c => classes.add(c), remove: c => classes.delete(c),
                    contains: c => classes.has(c), toggle: () => {},
                },
                addEventListener(type, callback) {
                    if (!listeners.has(type)) listeners.set(type, []);
                    listeners.get(type).push(callback);
                },
                fire(type, extra = {}) {
                    const event = { target: this, currentTarget: this, ...extra };
                    for (const cb of listeners.get(type) || []) cb(event);
                },
                click() { this.fire('click'); },
                scrollIntoView() {}, appendChild() {}, blur() {}, setAttribute() {},
            });
        }
        return nodes.get(id);
    }
    element('selMatInspect').value = 'ZnS_fresnel';
    element('selSubstrat').value = 'BK7';
    element('selSuperstrat').value = 'Air';
    const counters = { render: 0, simulate: 0 };
    const context = vm.createContext({
        window: { addEventListener() {} },
        document: {
            getElementById: element,
            querySelector: () => null,
            querySelectorAll: selector => queries.get(selector) || [],
            createElement: tag => element('created_' + tag),
        },
        localStorage: {
            getItem: k => { if (options.readError) throw new Error('storage blocked'); return storage.get(k) ?? null; },
            setItem: (k, v) => { if (options.writeError) throw new Error('quota exceeded'); storage.set(k, v); },
        },
        FileReader: class { constructor() { readers.push(this); } readAsText() {} },
        alert: text => alerts.push(text), confirm: () => true,
        setTimeout: () => 0, clearTimeout: () => {}, performance: { now: () => 0 },
        console, counters,
    });
    vm.runInContext(scriptsDe(html), context, { filename: 'simulateur-reel.js' });
    // Isole les effets graphiques des tests de commandes. Aucun calcul changé.
    vm.runInContext(options.keepSimulation
        ? 'matChart = {data: {}, update() {}};'
        : 'renderLayersTable = () => counters.render++; runFullSimulation = () => counters.simulate++; matChart = {data: {}, update() {}};', context);
    const api = vm.runInContext(`({ appState, MATERIALS_DB, MAT_SHORT,
        initCustomMaterials, registerCustomMaterialInDb, sanitizeMatTable,
        getMediumIndex, getPhysicalThicknessNm, computeTMMPoint,
        computeTMMPointCustom, captureOpticalState, parseStackFormula, renderCustomMatEditor,
        parseMaterialTableText, attachCustomMatRowEvents, reviewPairingStatus,
        saveCustomMaterialsToStorage, wireCustomMatEvents, Garde })`, context);
    api.initCustomMaterials();
    api.wireCustomMatEvents();
    return { ...api, element, queries, alerts, counters, storage, readers, context };
}

module.exports = { charge, html };
