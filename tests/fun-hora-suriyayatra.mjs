import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateSuriyayatra, suriyayatraDivision } from '../suriyayatra.mjs';

const fixtures = JSON.parse(readFileSync(new URL('./suriyayatra-fixtures.json', import.meta.url), 'utf8'));
const bodies = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Uranus'];
const divisors = [1, 9, 3, 2, 12, 30, 7, 10, 16, 60, 4, 20, 24, 27, 40, 45, 5, 6, 8, 11];
const mod360 = longitude => ((longitude % 360) + 360) % 360;

for (const {birth, status, lat, lon, sunrise, sunArc, position, division} of fixtures) {
  const [year, month, day, hour, minute] = birth;
  const localMinutes = hour * 60 + minute;
  const jd = Date.UTC(year, month - 1, day, hour - 7, minute) / 86400000 + 2440587.5;
  const chart = calculateSuriyayatra(jd, lat, lon, 7);
  const label = birth.slice(0, 3).join('-');
  assert.equal(status, 0, label);
  for (const [i, body] of bodies.entries()) {
    const [sign, deg, min] = position[i];
    const longitude = chart.siderealMap[body];
    assert.equal(Math.round(longitude * 60), sign * 1800 + deg * 60 + min, label + ' ' + body + ' longitude');
    const actualSign = Math.floor(longitude / 30);
    for (const [j, divisor] of divisors.entries()) {
      assert.equal(suriyayatraDivision(divisor, actualSign, longitude - actualSign * 30), division[i][j],
        label + ' ' + body + ' D' + divisor);
    }
  }
  const recordedSunrise = Math.round(sunrise * 60);
  if (localMinutes >= recordedSunrise) {
    const utc = new Date(Date.UTC(year, month - 1, day, -7, recordedSunrise)).toISOString();
    const elapsed = localMinutes - recordedSunrise;
    assert.equal(chart.specialLagnas.sunriseUtc, utc, label + ' sunrise');
    assert(Math.abs(chart.specialLagnas.hora - mod360(sunArc / 60 + elapsed * 0.5)) < 1e-9);
    assert(Math.abs(chart.specialLagnas.ghati - mod360(sunArc / 60 + elapsed * 1.25)) < 1e-9);
  } else {
    const localSunrise = new Date(Date.parse(chart.specialLagnas.sunriseUtc) + 7 * 3600000);
    const previousDay = new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
    assert.equal(localSunrise.toISOString().slice(0, 10), previousDay, label + ' preceding sunrise');
  }
}
console.log('Suriyayatra matches Excel fixtures for all 11 natal placements and all 20 charts.');
