// Recorrido exhaustivo de las decisiones finitas; los textos libres se verifican por clases y límites.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { missions, getOptions, functionTitle, selectedOption, proposalFor, changeChoice, SUMMARY_STEP } from '../public/journey.js';
import { cleanAnswers, firstInvalidStep, allowedStep, parseSaved, validateField, fieldRules, stepFields } from '../public/validation.js';
import { answerRows, buildIdeaDocument, ideaText, escapeHTML } from '../public/experience.js';
const start = performance.now();
const sample = { ...cleanAnswers({}), appName: 'Mi app & compañía 👩‍💻', customSituation: 'El barrio necesita coordinar ayuda.', customAudience: 'Vecinos y voluntarios', customFunction1: 'Pedir ayuda', customFunction2: 'Ofrecer ayuda', customFunction3: 'Coordinar entregas', participants: '5', target: '4', note: 'Una idea breve & propia' };
const logo = 'data:image/png;base64,iVBORw0KGgo=';
const stats = { combinations: 0, paths: 0, numericValidPairs: 0, invalidNumericCases: 0, transitionChecks: 0, functionOrders: 0, invalidStepChecks: 0, exports: 0, textBoundaryChecks: 0, perMission: {} };
const combinations = values => {
  const result = [];
  for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) for (let k = j + 1; k < values.length; k++) result.push([values[i], values[j], values[k]]);
  return result;
};
const permutations = ([a,b,c]) => [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]];
for (const mission of missions) {
  let count = 0;
  const base = { ...sample, mission: mission.id };
  for (const functions of combinations(getOptions('functions', base).map(o => o.id))) {
    stats.combinations++;
    for (const order of permutations(functions)) {
      const a = { ...base, functions: order, audience: 'reader', mainFunction: order[0], reason: 'problem', mode: 'mode-0', test: 'test-0', improve: 'improve-0' };
      assert.equal(firstInvalidStep(a), -1);
      assert.deepEqual(answerRows(a).find(row => row.step === 2).value.split('\n'), order.map((id, i) => `${i + 1}. ${functionTitle(id, a)}`));
      assert.equal(proposalFor(a).screens[0], functionTitle(order[0], a));
      stats.functionOrders++;
    }
    for (const mainFunction of functions) for (const audience of getOptions('audience', base).map(o => o.id)) for (const reason of getOptions('reason', base).map(o => o.id)) {
      const partial = { ...base, functions, mainFunction, audience, reason };
      for (const mode of getOptions('mode', partial).map(o => o.id)) for (const task of getOptions('test', partial).map(o => o.id)) for (const improve of getOptions('improve', partial).map(o => o.id)) {
        const a = { ...partial, mode, test: task, improve };
        assert.equal(firstInvalidStep(a), -1);
        assert.equal(allowedStep(SUMMARY_STEP, a), SUMMARY_STEP);
        const p = proposalFor(a), rows = answerRows(a), html = buildIdeaDocument(a, mission.title, logo), text = ideaText(a);
        assert.ok(p.firstVersion.includes(functionTitle(mainFunction, a)));
        for (const key of ['mode', 'reason']) assert.ok(p.firstVersion.includes(selectedOption(key, a).detail));
        assert.ok(p.test.includes(selectedOption('test', a).detail));
        assert.ok(p.improve.includes(selectedOption('improve', a).detail));
        assert.equal(p.screens.length, 3);
        assert.equal(p.screens[0], functionTitle(mainFunction, a));
        for (const row of rows) { assert.ok(text.includes(row.value)); assert.ok(html.includes(escapeHTML(row.value))); }
        assert.ok(html.includes('alumnado/secretaría'));
        assert.doesNotMatch(html, /<script|(?:src|href)=["']https?:/i);
        stats.paths++; stats.exports++; count++;
      }
    }
  }
  stats.perMission[mission.id] = count;
  console.log(`${mission.id}: ${count} recorridos y fichas verificados`);
}
const valid = { ...sample, mission: 'propia', functions: ['calendar', 'reminders', 'official'], mainFunction: 'official', audience: 'reader', reason: 'simple', mode: 'mode-0', test: 'test-0', improve: 'improve-1' };
for (let participants = 1; participants <= 20; participants++) for (let target = 1; target <= 20; target++) {
  const a = { ...valid, participants: String(participants), target: String(target) };
  assert.equal(Boolean(validateField('target', a.target, a)), target > participants);
  if (target <= participants) { assert.equal(firstInvalidStep(a), -1); stats.numericValidPairs++; }
}
for (const key of ['participants', 'target']) for (const value of ['', ' ', '\n', '0', '-1', '21', '100', '1.5', '1,5', '1e1', '1E1', '+5', '05', ' 5', '5 ', 'cinco', '５', 'NaN', 'Infinity', null, 5, [], {}]) {
  assert.ok(validateField(key, value, valid), `${key}: ${JSON.stringify(value)}`); stats.invalidNumericCases++;
}
for (const [key, r] of Object.entries(fieldRules)) if (r.type === 'text') {
  const a = { ...valid, functions: ['custom-1', 'custom-2', 'custom-3'] };
  for (const value of ['A', 'Árbol', 'App 👩🏽‍💻', 'A'.repeat(r.max)]) { assert.equal(validateField(key, value, a), ''); stats.textBoundaryChecks++; }
  for (const value of ['A'.repeat(r.max + 1), '<img src=x onerror=alert(1)>', 'A\u200B', 'A\u202E', 'A\u0000', null, {}]) { assert.ok(validateField(key, value, a)); stats.textBoundaryChecks++; }
}
for (const mission of missions) for (const targetMission of missions) {
  const a = { ...valid, mission: mission.id, functions: mission.functions.slice(0, 3), mainFunction: mission.functions[0] };
  const changed = changeChoice(a, 'mission', targetMission.id).answers;
  assert.equal(changed.customSituation, a.customSituation); assert.equal(changed.note, a.note);
  assert.ok(changed.functions.every(id => getOptions('functions', changed).some(o => o.id === id)));
  if (mission.id !== targetMission.id) { assert.equal(changed.mainFunction, ''); assert.equal(changed.test, ''); }
  assert.ok(parseSaved(JSON.stringify({ ...changed, _step: SUMMARY_STEP })).step <= SUMMARY_STEP); stats.transitionChecks++;
}
for (const key of ['audience', 'mainFunction', 'mode']) for (const o of getOptions(key, valid)) {
  const changed = changeChoice(valid, key, o.id).answers;
  if (o.id !== valid[key]) assert.equal(changed.test, ''); stats.transitionChecks++;
}
for (const [i, fields] of stepFields.entries()) for (const key of fields) {
  const a = { ...valid, functions: ['custom-1','custom-2','custom-3'], mainFunction: 'custom-1', [key]: key === 'functions' ? [] : '' };
  if (fieldRules[key].optional) continue;
  assert.equal(allowedStep(SUMMARY_STEP, a), i); assert.throws(() => buildIdeaDocument(a, 'Misión', logo)); stats.invalidStepChecks++;
}
assert.equal(stats.paths, 142155); assert.equal(stats.combinations, 195); assert.equal(stats.functionOrders, 1170); assert.equal(stats.numericValidPairs, 210);
const report = { date: new Date().toISOString(), durationSeconds: Number(((performance.now()-start)/1000).toFixed(2)), ...stats,
  scope: 'Decisiones finitas completas y exportaciones. Los límites numéricos, tipos, textos y transiciones se verifican por separado. No equivale a recorrer 142155 pantallas a mano ni a certificar interpretación semántica o dispositivos físicos.' };
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
