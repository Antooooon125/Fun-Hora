import assert from 'node:assert/strict';
import { BODY_KEYS, displayBirthDate, longitudeParts, parseBirthDate, parseBirthTime, resolveBirthTime, validateChart } from '../chart-data.mjs';

assert.equal(parseBirthDate('29/02/2024'), '2024-02-29');
assert.equal(displayBirthDate('1990-12-31'), '31/12/1990');
assert.throws(() => parseBirthDate('29/02/2023'), /valid birth date/);
assert.throws(() => parseBirthDate('2024-02-29'), /DD\/MM\/YYYY/);

assert.equal(parseBirthTime('18:30'), '18:30');
assert.equal(parseBirthTime('8:05'), '08:05');
assert.equal(parseBirthTime('00:00'), '00:00');
assert.throws(() => parseBirthTime('24:00'), /24-hour/);
assert.throws(() => parseBirthTime('12:60'), /24-hour/);
assert.throws(() => parseBirthTime('6:30 PM'), /24-hour/);

const finalArc = longitudeParts(29 + 59 / 60 + 45 / 3600);
assert.equal(finalArc.sign, 0);
assert.equal(finalArc.min, 59);
assert(longitudeParts(0.5 - 1 / 3600).degreesInSign < 0.5);
assert.equal(longitudeParts(30).sign, 1);

assert.deepEqual(resolveBirthTime('2024-01-15', '06:30', 'Asia/Bangkok'), [
  {offset: 7, utc: '2024-01-14T23:30:00.000Z'}
]);
assert.deepEqual(resolveBirthTime('2024-07-15', '12:00', 'America/New_York'), [
  {offset: -4, utc: '2024-07-15T16:00:00.000Z'}
]);
assert.deepEqual(resolveBirthTime('2024-11-03', '01:30', 'America/New_York'), [
  {offset: -4, utc: '2024-11-03T05:30:00.000Z'},
  {offset: -5, utc: '2024-11-03T06:30:00.000Z'}
]);
assert.deepEqual(resolveBirthTime('2024-03-10', '02:30', 'America/New_York'), []);
assert.deepEqual(resolveBirthTime('2024-01-15', '06:30', '', 5.75), [
  {offset: 5.75, utc: '2024-01-15T00:45:00.000Z'}
]);
assert.throws(() => resolveBirthTime('2024-02-30', '06:30', 'UTC'), /valid birth date/);
assert.throws(() => resolveBirthTime('2024-02-29', '06:30', 'Wrong/Zone'), /IANA/);

const legacy = {
  name: '', subtitle: 'Sample chart', location: 'Bangkok',
  birthDate: '1990-01-15', birthTime: '06:30', tz: 7, lat: 13.7563, lon: 100.5018, weekday: 1,
  bodies: BODY_KEYS.map(key => ({key, label: key, thNum: key, sign: 0, deg: 0, min: 0, motion: '', note: ''}))
};
assert.deepEqual(validateChart(legacy).bodies, legacy.bodies);
const chart = {
  ...legacy, schemaVersion: 2,
  settings: {
    utc: '1990-01-14T23:30:00.000Z', timeZone: 'Asia/Bangkok', appVersion: '4.2', engineVersion: '0.7.0',
    ayan: 23.7, ayanMode: 'lahiri', nodeMode: 'mean', chartStyle: 'thai_square', d2Mode: 'kashinatha', karakaMode: '8'
  },
  bodies: legacy.bodies.map(body => ({ ...body, longitude: 0.001 }))
};
assert.deepEqual(validateChart(JSON.parse(JSON.stringify(chart))), chart);
assert.throws(() => validateChart({ ...legacy, bodies: [] }), /Invalid Fun-Hora chart/);
assert.throws(() => validateChart({ ...chart, settings: { ...chart.settings, nodeMode: 'unknown' } }), /Invalid Fun-Hora chart/);
console.log('Verified precision boundaries, historical time zones, DST overlap and gap, and legacy and v4.2 chart files.');
