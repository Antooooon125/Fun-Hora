import init, { XalenWasm } from './pkg/xalen_wasm.js';

const AYANAMSA_IDS = { lahiri: 0, suriyayart: 0, kp: 1, raman: 2 };
const PLANET_IDS = { Sun: 0, Moon: 1, Mercury: 2, Venus: 3, Mars: 4, Jupiter: 5, Saturn: 6 };
const SIDEREAL_OFFSET = { suriyayart: -0.592 };

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

export async function loadEphemeris(moduleOptions) {
  await init(moduleOptions);
  const engine = new XalenWasm();

  return function calculateEphemeris({year, month, day, utcHours, lat, lon, ayanMode, nodeMode}) {
    const jd = XalenWasm.julianDay(year, month, day, 0) + utcHours / 24;
    const ayanId = AYANAMSA_IDS[ayanMode];
    const adjustment = SIDEREAL_OFFSET[ayanMode] ?? 0;
    const ayan = XalenWasm.ayanamsaDeg(jd, ayanId) + adjustment;
    const houses = JSON.parse(engine.housesJson(jd, lat, lon, 0));
    if (!Number.isFinite(houses.ascendant)) throw new Error('XALEN returned an invalid ascendant.');

    const siderealMap = { Lagna: normalizeDegrees(houses.ascendant * 180 / Math.PI - ayan) };
    const speedMap = {};
    const bodyIds = { ...PLANET_IDS, Rahu: nodeMode === 'true' ? 10 : 9 };
    for (const [body, id] of Object.entries(bodyIds)) {
      const position = JSON.parse(engine.planetPositionJson(jd, id, true, ayanId));
      if (!Number.isFinite(position.longitude) || !Number.isFinite(position.lon_speed)) {
        throw new Error('XALEN returned an invalid position for ' + body);
      }
      siderealMap[body] = normalizeDegrees(position.longitude - adjustment);
      speedMap[body] = position.lon_speed;
    }
    siderealMap.Ketu = normalizeDegrees(siderealMap.Rahu + 180);
    const sunrise = engine.precedingSunrise(jd, lat, lon);
    let specialLagnas = null;
    if (Number.isFinite(sunrise)) {
      const sunriseSun = engine.siderealLongitude(sunrise, PLANET_IDS.Sun, ayanId) - adjustment;
      const elapsedHours = (jd - sunrise) * 24;
      specialLagnas = {
        hora: normalizeDegrees(sunriseSun + elapsedHours * 30),
        ghati: normalizeDegrees(sunriseSun + elapsedHours * 75),
        sunriseUtc: new Date(Math.round((sunrise - 2440587.5) * 86400) * 1000).toISOString(),
      };
    }
    return { ayan, siderealMap, speedMap, specialLagnas };
  };
}
