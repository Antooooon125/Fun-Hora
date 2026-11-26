import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadEphemeris } from '../site/ephemeris.mjs';
import { XalenWasm } from '../site/pkg/xalen_wasm.js';

const bytes = await readFile(new URL('../site/pkg/xalen_wasm_bg.wasm', import.meta.url));
const calculate = await loadEphemeris({ module_or_path: bytes });
const birth = {
  year: 1990, month: 1, day: 15, utcHours: -0.5,
  lat: 13.7563, lon: 100.5018, ayanMode: 'lahiri', nodeMode: 'true'
};
const chart = calculate(birth);
const jd = XalenWasm.julianDay(1990, 1, 14, 23.5);
const engine = new XalenWasm();
const normalize = degrees => ((degrees % 360) + 360) % 360;
const expectedAscendant = JSON.parse(engine.housesJson(jd, birth.lat, birth.lon, 0)).ascendant;
const expectedMars = JSON.parse(engine.planetPositionJson(jd, 4, true, 0));

assert.equal(Object.keys(chart.siderealMap).length, 10);
assert(Object.values(chart.siderealMap).every(degrees => degrees >= 0 && degrees < 360));
assert(Math.abs(chart.siderealMap.Lagna - normalize(expectedAscendant * 180 / Math.PI - chart.ayan)) < 1e-8);
assert(Math.abs(chart.siderealMap.Mars - expectedMars.longitude) < 1e-8);
assert(Math.abs(chart.speedMap.Mars - expectedMars.lon_speed) < 1e-8);

for (const nodeMode of ['true', 'mean']) {
  const {siderealMap} = calculate({ ...birth, nodeMode });
  const id = nodeMode === 'true' ? 10 : 9;
  assert(Math.abs(siderealMap.Rahu - engine.siderealLongitude(jd, id, 0)) < 1e-8);
  assert.equal(siderealMap.Ketu, normalize(siderealMap.Rahu + 180));
}
assert.notEqual(chart.siderealMap.Rahu, calculate({ ...birth, nodeMode: 'mean' }).siderealMap.Rahu);

for (const [ayanMode, id] of [['kp', 1], ['raman', 2]]) {
  assert.equal(calculate({ ...birth, ayanMode }).ayan, XalenWasm.ayanamsaDeg(jd, id));
}
assert.throws(() => calculate({ ...birth, ayanMode: 'suriyayart' }), /Unknown calculation method/);
console.log('Verified XALEN positions, speeds, ascendant, UTC rollover, ayanamsas, and true and mean nodes.');

const sunrise = engine.precedingSunrise(jd, birth.lat, birth.lon);
assert(sunrise <= jd && jd - sunrise > 0.9 && jd - sunrise < 1);
assert.match(chart.specialLagnas.sunriseUtc, /^1990-01-13T/);
const sunriseSun = engine.siderealLongitude(sunrise, 0, 0);
const hoursAfterSunrise = (jd - sunrise) * 24;
assert(Math.abs(chart.specialLagnas.hora - normalize(sunriseSun + 30 * hoursAfterSunrise)) < 1e-8);
assert(Math.abs(chart.specialLagnas.ghati - normalize(sunriseSun + 75 * hoursAfterSunrise)) < 1e-8);
const midday = calculate({ ...birth, utcHours: 5 });
assert.match(midday.specialLagnas.sunriseUtc, /^1990-01-14T/);
const polar = calculate({ ...birth, month: 6, day: 21, utcHours: 12, lat: 89, lon: 0 });
assert.equal(polar.specialLagnas, null);
engine.free();
console.log('Verified HL and GL calculations, preceding sunrise at early and midday births, and polar-day handling.');
