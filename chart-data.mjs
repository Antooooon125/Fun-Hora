export const BODY_KEYS = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
export const APP_VERSION = '4.2';
export const ENGINE_VERSION = '0.7.0';

const HOUR = 3600000;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const SETTINGS = {
  ayanMode: ['lahiri', 'suriyayart', 'kp', 'raman'],
  nodeMode: ['true', 'mean'],
  chartStyle: ['thai_round', 'thai_square'],
  d2Mode: ['parashari', 'kashinatha', 'parivritti'],
  karakaMode: ['7', '8']
};

export function longitudeParts(longitude) {
  const sign = Math.floor(longitude / 30);
  const degreesInSign = longitude - sign * 30;
  const deg = Math.floor(degreesInSign);
  const min = Math.floor((degreesInSign - deg) * 60);
  return {sign, deg, min, degreesInSign};
}

function civilTimestamp(date, time) {
  const iso = date + 'T' + time;
  const timestamp = Date.parse(iso + ':00Z');
  if (!DATE_TIME.test(iso) || !Number.isFinite(timestamp) ||
      new Date(timestamp).toISOString().slice(0, 16) !== iso) {
    throw new Error('Enter a valid birth date and local time.');
  }
  return timestamp;
}

export function resolveBirthTime(date, time, zone, manualOffset) {
  const wallTime = civilTimestamp(date, time);
  if (!zone) {
    if (!Number.isFinite(manualOffset) || Math.abs(manualOffset) > 14) {
      throw new Error('Enter a UTC offset between -14 and +14 hours.');
    }
    return [{offset: manualOffset, utc: new Date(wallTime - manualOffset * HOUR).toISOString()}];
  }

  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
  } catch {
    throw new Error('Choose an IANA time zone or leave it blank to enter an offset.');
  }
  const offsetAt = instant => {
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(({type, value}) => [type, value]));
    const date = parts.year.padStart(4, '0') + '-' + parts.month + '-' + parts.day;
    const time = parts.hour + ':' + parts.minute + ':' + parts.second;
    return (Date.parse(date + 'T' + time + 'Z') - instant) / HOUR;
  };
  const offsets = new Set();
  for (let hours = -36; hours <= 36; hours += 6) offsets.add(offsetAt(wallTime + hours * HOUR));
  return [...offsets]
    .map(offset => ({offset, instant: wallTime - Math.round(offset * HOUR)}))
    .filter(({instant, offset}) => offsetAt(instant) === offset)
    .sort((a, b) => a.instant - b.instant)
    .map(({offset, instant}) => ({offset, utc: new Date(instant).toISOString()}));
}

export function validateChart(chart) {
  const fail = () => { throw new Error('Invalid Fun-Hora chart file.'); };
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!chart || ![undefined, 1, 2].includes(chart.schemaVersion) ||
      !Array.isArray(chart.bodies) || chart.bodies.length !== BODY_KEYS.length ||
      !integer(chart.weekday, 0, 6) || !Number.isFinite(chart.tz) || Math.abs(chart.tz) > 24 ||
      !Number.isFinite(chart.lat) || Math.abs(chart.lat) > 90 ||
      !Number.isFinite(chart.lon) || Math.abs(chart.lon) > 180 ||
      ![chart.name, chart.subtitle, chart.location].every(value => typeof value === 'string')) fail();
  civilTimestamp(chart.birthDate, chart.birthTime);

  const bodies = BODY_KEYS.map(key => {
    const body = chart.bodies.find(entry => entry?.key === key);
    if (!body || !integer(body.sign, 0, 11) || !integer(body.deg, 0, 29) ||
        !integer(body.min, 0, 59) ||
        ![body.label, body.thNum, body.motion, body.note].every(value => typeof value === 'string')) fail();
    if (body.longitude !== undefined && (!Number.isFinite(body.longitude) ||
        body.longitude < 0 || body.longitude >= 360 || longitudeParts(body.longitude).sign !== body.sign)) fail();
    return body;
  });

  let settings;
  if (chart.settings !== undefined) {
    settings = chart.settings;
    if (!settings || !Object.entries(SETTINGS).every(([key, values]) => values.includes(settings[key])) ||
        !['appVersion', 'engineVersion', 'timeZone', 'utc'].every(key => typeof settings[key] === 'string') ||
        !Number.isFinite(Date.parse(settings.utc)) || !Number.isFinite(settings.ayan)) fail();
  }
  return { ...chart, bodies, settings };
}
