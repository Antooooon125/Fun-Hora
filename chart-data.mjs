export const BODY_KEYS = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
export const APP_VERSION = '4.3';
export const ENGINE_VERSION = '0.7.0';

const HOUR = 3600000;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const SETTINGS = {
  ayanMode: ['lahiri', 'suriyayart', 'suriyayatra', 'kp', 'raman'],
  nodeMode: ['true', 'mean'],
  chartStyle: ['thai_round', 'thai_square'],
  d2Mode: ['parashari', 'kashinatha', 'parivritti'],
  karakaMode: ['7', '8']
};

export function longitudeParts(longitude) {
  const sign = Math.floor(longitude / 30);
  const degreesInSign = longitude - sign * 30;
  const deg = Math.floor(degreesInSign);
  const min = Math.min(59, Math.floor((degreesInSign - deg) * 60 + 1e-9));
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

export function parseBirthDate(input) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) throw new Error('Enter the birth date as DD/MM/YYYY.');
  const [, day, month, year] = match;
  const iso = year + '-' + month + '-' + day;
  civilTimestamp(iso, '00:00');
  return iso;
}

export function displayBirthDate(iso) {
  return iso.split('-').reverse().join('/');
}

export function formatBirthTimeInput(input) {
  return input.replace(/^(\d{2})::(\d{0,2})$/, '$1:$2').replace(/^([01]\d|2[0-3])(\d{0,2})$/, '$1:$2');
}

export function parseBirthTime(input) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(formatBirthTimeInput(input.trim()));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
    throw new Error('Enter a 24-hour birth time from 00:00 to 23:59.');
  }
  return match[1].padStart(2, '0') + ':' + match[2];
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
      !Array.isArray(chart.bodies) || chart.bodies.length !== BODY_KEYS.length + (chart.settings?.ayanMode === "suriyayatra" ? 1 : 0) ||
      !integer(chart.weekday, 0, 6) || !Number.isFinite(chart.tz) || Math.abs(chart.tz) > 24 ||
      !Number.isFinite(chart.lat) || Math.abs(chart.lat) > 90 ||
      !Number.isFinite(chart.lon) || Math.abs(chart.lon) > 180 ||
      ![chart.name, chart.subtitle, chart.location].every(value => typeof value === 'string')) fail();
  civilTimestamp(chart.birthDate, chart.birthTime);

  const keys = chart.settings?.ayanMode === "suriyayatra" ? [...BODY_KEYS, "Uranus"] : BODY_KEYS;
  const bodies = keys.map(key => {
    const body = chart.bodies.find(entry => entry?.key === key);
    if (!body || !integer(body.sign, 0, 11) || !integer(body.deg, 0, 29) ||
        !integer(body.min, 0, 59) ||
        ![body.label, body.thNum, body.motion, body.note].every(value => typeof value === 'string')) fail();
    if (body.longitude !== undefined && (!Number.isFinite(body.longitude) ||
        body.longitude < 0 || body.longitude >= 360 || longitudeParts(body.longitude).sign !== body.sign)) fail();
    return body;
  });

  const lagnas = chart.specialLagnas;
  if (lagnas !== undefined && lagnas !== null &&
      (![lagnas.hora, lagnas.ghati].every(value => Number.isFinite(value) && value >= 0 && value < 360) ||
       typeof lagnas.sunriseUtc !== 'string' || !Number.isFinite(Date.parse(lagnas.sunriseUtc)))) fail();

  let settings;
  if (chart.settings !== undefined) {
    settings = chart.settings;
    if (!settings || !Object.entries(SETTINGS).every(([key, values]) => values.includes(settings[key])) ||
        !['appVersion', 'engineVersion', 'timeZone', 'utc'].every(key => typeof settings[key] === 'string') ||
        !Number.isFinite(Date.parse(settings.utc)) ||
        (settings.ayanMode === "suriyayatra" ? settings.ayan !== null : !Number.isFinite(settings.ayan))) fail();
  }
  return { ...chart, bodies, settings };
}
