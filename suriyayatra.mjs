// Thai Suriyayatra, using the standard natal settings in the reference workbook.
// Traditional longitudes are calculated in arcminutes before conversion to degrees.
const DAY = 86400;
const ARC = 21600;
const RAD = Math.PI / 180;
const {trunc, floor, round} = Math;
const mod = (x, n) => ((x % n) + n) % n;
const sin = x => Math.sin(x * RAD);
const cos = x => Math.cos(x * RAD);

// Calc!AB3:AG11. Inner planets use the solar mean longitude for the first correction.
const PLANETS = {
  Mercury: [7, 46, 4, 1, 10642, 14869, 220, 100, 21],
  Venus: [5, 3, -10, 243, 10944, 3121, 80, 320, 11],
  Mars: [1, 2, 16, 505, 5420, 20754, 127, 45, 4 / 15],
  Jupiter: [1, 12, 1, 1032, 14297, 672, 172, 92, 3 / 7],
  Saturn: [1, 30, 6, 10000, 11944, 21101, 247, 63, 7 / 6],
  Uranus: [1, 84, 1, 7224, 16277, 8160, 124, 644, 3 / 7]
};

function calendarDay(year, month, day) {
  const y = year + (month < 3 ? 9999 : 10000);
  const m = month + (month < 3 ? 13 : 1);
  return day - 4346448 + trunc(30.6 * m) + trunc(365.25 * y) + trunc(y / 400) - trunc(y / 100);
}

function eraEpoch(year, era, correction) {
  const april = era * 0.25875 + trunc(era / 100 + 0.38) - trunc(era / 4 + 0.5)
    - trunc(era / 400 + 0.595) - 5.53375;
  return calendarDay(year, 4, trunc(april)) + 2415020 - 0.791666666511446 + april - trunc(april) + correction;
}

function calendar(jd, offset) {
  const local = new Date(Math.round((jd - 2440587.5) * DAY) * 1000 + offset * 3600000);
  const year = local.getUTCFullYear(), month = local.getUTCMonth() + 1, day = local.getUTCDate();
  const localSeconds = local.getUTCHours() * 3600 + local.getUTCMinutes() * 60 + local.getUTCSeconds();
  const serial = calendarDay(year, month, day);
  const correction = serial > 7395 ? 18 / 1440 : 0;
  const thaiJulian = serial + 2415020 - 19 / 24 + localSeconds / DAY;
  const adjusted = thaiJulian - correction;
  const era = year - 638;
  const thisEpoch = eraEpoch(year, era, correction);
  const passedEpoch = thisEpoch <= thaiJulian;
  const epoch = passedEpoch ? thisEpoch : eraEpoch(year - 1, era - 1, correction);
  const chula = passedEpoch ? era : era - 1;
  const historical = chula < 610;
  const oldEra = trunc((adjusted - 588100.74125 + 19 / 24) / 365.25875);
  const cycle = historical ? oldEra - 1 : chula;
  const epochDays = cycle * 365.25875 + (historical ? 1 : 1.46625);
  const eraDays = cycle * 292207 + (historical ? 0 : 373);
  const eraCount = trunc(eraDays / 800) + 1;
  const serialDays = adjusted - 588465.208333333 - (historical ? -1 : 1365701);
  const seconds = mod(localSeconds - correction * DAY, DAY) || (localSeconds ? DAY : 0);
  const elapsedDays = trunc(serialDays) - eraCount - (seconds === DAY ? 1 : 0);
  const accumulated = epochDays + thaiJulian - (historical ? 588100.74125 + oldEra * 365.25875 - 19 / 24 + correction : epoch) + correction;
  const baseRate = 800 - mod(eraDays, 800) + (elapsedDays - 1) * 800;
  const sun = solarLongitude(baseRate + trunc(seconds / 108));
  return {historical, cycle, eraCount, elapsedDays, seconds, localSeconds, accumulated, epochDays, correction,
    civilMidnight: Math.floor(jd + offset / 24 - 0.5) + 0.5 - offset / 24,
    solarDay: trunc(adjusted - 2415018.20833334) + 2415018.5, sun};
}

function quadrant(angle) {
  return floor(mod(angle, ARC) / 5400);
}
function foldedArc(angle) {
  const q = quadrant(angle);
  const part = mod(angle, 5400);
  return q % 2 ? 5400 - part : part;
}
function interpolateArc(angle, slopes, bases) {
  const arc = foldedArc(angle);
  const index = trunc(arc / 900);
  return bases[index] + trunc(slopes[index] * (arc - index * 900) / 900);
}
function solarLongitude(rate) {
  const sign = trunc(rate / 24350);
  const remainder = rate - sign * 24350;
  const degree = trunc(remainder / 811);
  const mean = sign * 1800 + degree * 60 + trunc((remainder - degree * 811) / 14) - 3;
  const anomaly = mod(mean - 4800, ARC);
  const correction = interpolateArc(anomaly, [35, 32, 27, 22, 13, 5, 0], [0, 35, 67, 94, 116, 129, 134]);
  return {mean, trueArc:mod(mean + (anomaly < 10800 ? -correction : correction), ARC)};
}
function lunarLongitude({historical, eraCount, elapsedDays, seconds, sun}) {
  const lunarEpoch = historical ? 556 : 650;
  const epochRemainder = mod(eraCount * 11 + lunarEpoch, 692);
  const lunarDays = (elapsedDays - 1) * 703 + epochRemainder + trunc(seconds * 703 / DAY);
  const lunation = eraCount - (historical ? 1 : 0);
  const eraTithi = mod(trunc((lunation * 11 + lunarEpoch) / 692) + lunation, 30);
  const tithi = mod(trunc(lunarDays / 692) + eraTithi, 30);
  const remainder = mod(lunarDays, 692);
  const mean = mod(tithi * 720 + trunc(remainder / 25) + remainder - 40 + sun.mean, ARC);
  const perigeeEpoch = mod(eraCount + (historical ? 813 : -621), 3232);
  const perigeeDays = mod(elapsedDays + perigeeEpoch, 3232);
  const perigeeSigns = ((perigeeDays - 1) * DAY + seconds) * 3 / (808 * DAY);
  const perigee = trunc(perigeeSigns * 1800) + 2;
  const anomaly = mod(mean - perigee, ARC);
  const correction = interpolateArc(anomaly, [77, 71, 61, 47, 30, 10, 0], [0, 77, 148, 209, 256, 286, 296]);
  return mod(mean + (anomaly < 10800 ? -correction : correction), ARC);
}
function epicycle(arc) {
  return arc < 1800 ? trunc(arc * 14640 / 1800) : arc < 3600
    ? 14640 + trunc((arc - 1800) * 10980 / 1800)
    : 25620 + trunc((arc - 3600) * 3660 / 1800);
}
function planetLongitude(coefficients, cycleArc, oldEra, solarMean, inner) {
  const [n, d, drift, divisor, epoch, oldEpoch, apogee, scale, motion] = coefficients;
  const mean = mod(trunc(cycleArc * n / d) + trunc(cycleArc * drift / divisor) + (oldEra ? oldEpoch : epoch), ARC);
  const firstMean = inner ? solarMean : mean;
  const first = mod(firstMean - apogee * 60, ARC);
  const firstSin = epicycle(foldedArc(first));
  const firstCos = epicycle(5400 - foldedArc(first));
  const cosineSign = [1,-1,-1,1];
  const equationSign = [-1,-1,1,1];
  const corrected = mod(firstMean + equationSign[quadrant(first)] * trunc(firstSin * 60 /
    (scale * 60 + trunc((firstCos + 30) / 120) * cosineSign[quadrant(first)])), ARC);
  const second = mod(corrected - (inner ? mean : solarMean), ARC);
  const secondSin = epicycle(foldedArc(second));
  const secondCos = epicycle(5400 - foldedArc(second));
  const base = inner ? motion * 60 : trunc((scale * 60 + trunc((firstCos + 30) / 120) * cosineSign[quadrant(first)]) * motion);
  const divisor2 = base + trunc((secondSin + 30) / 180) + trunc((secondCos + 30) / 60) * cosineSign[quadrant(second)];
  return mod(corrected + trunc(secondSin * 60 / divisor2) * equationSign[quadrant(second)], ARC);
}

function solarEquatorial(jd) {
  const t = (jd - 2451545) / 36525;
  const sunMean = mod(280.46645 + 36000.76983 * t + 0.0003032 * t ** 2, 360);
  const moonMean = mod(218.3164591 + 481267.88134236 * t - 0.0013268 * t ** 2 + t ** 3 / 538841 - t ** 4 / 65194000, 360);
  const anomaly = 357.5291 + 35999.0503 * t - 0.0001559 * t ** 2 - 0.00000048 * t ** 3;
  const node = 125.04452 - 1934.136261 * t + 0.0020708 * t ** 2 + t ** 3 / 450000;
  const center = (1.9146 - 0.004817 * t - 0.000014 * t ** 2) * sin(anomaly)
    + (0.019993 - 0.000101 * t) * sin(2 * anomaly) + 0.00029 * sin(3 * anomaly);
  const longitude = mod(sunMean + center - 0.00569 - 0.00478 * sin(node), 360);
  const obliquity = 23 + 26 / 60 + (21.448 - 46.815 * t - 0.00059 * t ** 2 + 0.001813 * t ** 3
    + 9.2 * cos(node) + 0.57 * cos(2 * sunMean) + 0.1 * cos(2 * moonMean) - 0.09 * cos(2 * node)) / 3600;
  const nutation = (-17.2 * sin(node) - 1.32 * sin(2 * sunMean) - 0.23 * sin(2 * moonMean) + 0.21 * sin(2 * node)) / 3600;
  const sidereal = mod(15 * (6 + 41 / 60 + (50.54841 + 8640184.812866 * t
    + 0.093104 * t ** 2 - 0.0000062 * t ** 3) / 3600), 360) + nutation * cos(obliquity);
  return {
    declination: Math.asin(sin(obliquity) * sin(longitude)) / RAD,
    ra: mod(Math.atan2(cos(obliquity) * sin(longitude), cos(longitude)) / RAD, 360),
    sidereal
  };
}

// Calc!BN5:BN63. The workbook reports sunrise rounded to a civil minute.
function sunriseMinutes(day, lat, lon, offset) {
  const now = solarEquatorial(day);
  const before = solarEquatorial(day - 1);
  const after = solarEquatorial(day + 1);
  const horizon = -50 / 60;
  const cosine = (sin(horizon) - sin(lat) * sin(now.declination)) / (cos(lat) * cos(now.declination));
  if (Math.abs(cosine) >= 1) return null;
  const transit = mod((now.ra - lon - now.sidereal) / 360, 1);
  const rise = transit - Math.acos(cosine) / (RAD * 360);
  const interpolate = (current, previous, following, circular = false) => {
    const a = circular ? mod(current - previous, 360) : current - previous;
    const b = circular ? mod(following - current, 360) : following - current;
    const fraction = rise + 6.4 / DAY;
    return current + fraction / 2 * (a + b + fraction * (b - a));
  };
  const dec = interpolate(now.declination, before.declination, after.declination);
  const ra = interpolate(now.ra, before.ra, after.ra, true);
  const hourAngle = mod(now.sidereal + 360.985647 * rise, 360) + lon - ra;
  const altitude = (sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(hourAngle)) / RAD;
  const adjustment = (altitude - horizon) / (360 * cos(dec) * cos(lat) * sin(hourAngle));
  return mod(round(offset * 60 + (rise + adjustment) * 1440), 1440);
}

const RISING_MINUTES = [120, 96, 72, 120, 144, 168, 168, 144, 120, 72, 96, 120];

function ascendantArc(sunArc, sunrise, localMeanMinutes) {
  const sunriseSign = floor(sunArc / 1800);
  const elapsed = mod(localMeanMinutes - sunrise, 1440);
  const risingStart = RISING_MINUTES.slice(0, sunriseSign).reduce((a, b) => a + b, 0)
    + RISING_MINUTES[sunriseSign] * (sunArc % 1800) / 1800;
  let cursor = mod(risingStart + elapsed, 1440);
  for (const [sign, duration] of RISING_MINUTES.entries()) {
    if (cursor <= duration) return mod(round(sign * 1800 + cursor * 1800 / duration), ARC);
    cursor -= duration;
  }
  throw new Error('Suriyayatra could not determine the rising sign.');
}

function solarArcAtSunrise(day, sunrise) {
  const sunriseCount = floor(day.accumulated - sunrise / 1440 + 1e-9) + sunrise / 1440;
  return solarLongitude(trunc((sunriseCount - day.epochDays - day.correction) * 800)).trueArc;
}

function lunarNodes(day, cycleArc) {
  const mean = mod(trunc(cycleArc / 20) + trunc(cycleArc / 265), ARC);
  const rahu = mod((day.historical ? 12154 : 15150) - mean, ARC);
  return {Rahu: rahu, Ketu: mod(rahu + ARC / 2, ARC)};
}

function natalPlanets(day) {
  const cycleArc = (day.cycle - (day.historical ? 0 : 610)) * ARC + day.sun.mean - 23;
  const result = {Sun: day.sun.trueArc, Moon: lunarLongitude(day)};
  for (const [body, coefficients] of Object.entries(PLANETS)) {
    result[body] = planetLongitude(coefficients, cycleArc, day.historical, day.sun.mean - 23,
      body === 'Mercury' || body === 'Venus');
  }
  return {...result, ...lunarNodes(day, cycleArc)};
}

export function calculateSuriyayatra(jd, lat, lon, offset) {
  const birth = calendar(jd, offset);
  const sunrise = sunriseMinutes(birth.solarDay, lat, lon, offset);
  const positions = natalPlanets(birth);

  positions.Lagna = ascendantArc(positions.Sun, sunrise ?? 360, birth.localSeconds / 60 - offset * 60 + lon * 4);
  const precedingDay = birth.localSeconds / 60 < (sunrise ?? 360) ? calendar(jd - 1, offset) : birth;
  const precedingSunrise = precedingDay === birth ? sunrise : sunriseMinutes(precedingDay.solarDay, lat, lon, offset);
  let specialLagnas = null;
  if (precedingSunrise !== null) {
    const sunriseJd = precedingDay.civilMidnight + precedingSunrise / 1440;
    const sunriseSun = solarArcAtSunrise(precedingDay, precedingSunrise) / 60;
    const elapsedMinutes = (precedingDay === birth ? 0 : 1440) + birth.localSeconds / 60 - precedingSunrise;
    specialLagnas = {
      hora: mod(sunriseSun + elapsedMinutes / 2, 360),
      ghati: mod(sunriseSun + elapsedMinutes * 1.25, 360),
      sunriseUtc: new Date(Math.round((sunriseJd - 2440587.5) * DAY) * 1000).toISOString()
    };
  }
  const before = natalPlanets(calendar(jd - 0.5, offset));
  const after = natalPlanets(calendar(jd + 0.5, offset));
  const speedMap = Object.fromEntries(Object.keys(before).map(body =>
    [body, (mod(after[body] - before[body] + ARC / 2, ARC) - ARC / 2) / 60]));
  return {
    ayan: null,
    siderealMap: Object.fromEntries(Object.entries(positions).map(([body, arc]) => [body, arc / 60])),
    speedMap,
    specialLagnas
  };
}

function lookupSegment(degrees, boundaries, signs) {
  const next = boundaries.findIndex(boundary => degrees < boundary);
  return signs[next < 0 ? signs.length - 1 : next];
}

// Divisional-chart rules in Calc and the Sheet1 G:Z results table.
export function suriyayatraDivision(divisor, sign, degrees) {
  const minutes = round(degrees * 60);
  const part = floor(minutes * divisor / 1800);
  const evenSign = sign % 2 === 1;
  const modality = sign % 3;
  const elementStart = [0, 9, 6, 3][sign % 4];
  switch (divisor) {
    case 1: return sign;
    case 2: return (minutes < 900) !== evenSign ? 4 : 3;
    case 3: return mod(sign + 4 * part, 12);
    case 4: return mod(sign + 3 * part, 12);
    case 5: return lookupSegment(minutes, [360,720,1080,1440], evenSign ? [1,5,11,9,7] : [0,10,8,2,6]);
    case 6: return (evenSign ? 6 : 0) + part;
    case 7: return mod(sign + part + (evenSign ? 6 : 0), 12);
    case 8: return mod(modality * 4 + part, 12);
    case 9: return mod(sign * 9 + part, 12);
    case 10: return mod(sign + part + (evenSign ? 8 : 0), 12);
    case 11: return mod(-sign + part, 12);
    case 12: return mod(sign + part, 12);
    case 16: return mod(modality * 4 + part, 12);
    case 20: return mod(modality * 4 + part, 12);
    case 24: return mod((evenSign ? 3 : 4) + part, 12);
    case 27: return mod(elementStart + part, 12);
    case 30: return evenSign
      ? lookupSegment(minutes, [300,720,1200,1500], [1,5,11,9,7])
      : lookupSegment(minutes, [300,600,1080,1500], [0,10,8,2,6]);
    case 40: return mod((evenSign ? 6 : 0) + part, 12);
    case 45: return mod(modality * 4 + part, 12);
    case 60: return mod(sign + part, 12);
    default: throw new Error('Unsupported Suriyayatra division: D' + divisor);
  }
}
