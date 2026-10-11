import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDateRange,
  getGroupBy,
  formatPeriod,
  unixToDatetime,
  datetimeToUnix,
  shortDate,
  dateTime,
  relativeTime,
  byDateDesc,
  byDateAsc,
  DATE_PRESETS,
} from '../src/index.js';

// ── getDateRange ────────────────────────────

describe('getDateRange', () => {
  it('today returns same-day range', () => {
    const { from, to } = getDateRange('today');
    assert.ok(from.endsWith('T00:00:00Z'));
    assert.ok(to.endsWith('T23:59:59Z'));
    assert.equal(from.slice(0, 10), to.slice(0, 10));
  });

  it('7d returns 7-day range', () => {
    const { from, to } = getDateRange('7d');
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diff = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
    assert.ok(diff >= 7 && diff <= 8);
  });

  it('30d returns ~30-day range', () => {
    const { from, to } = getDateRange('30d');
    const diff = Math.round((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
    assert.ok(diff >= 30 && diff <= 31);
  });

  it('90d returns ~90-day range', () => {
    const { from, to } = getDateRange('90d');
    const diff = Math.round((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
    assert.ok(diff >= 90 && diff <= 91);
  });

  it('ytd starts Jan 1', () => {
    const { from } = getDateRange('ytd');
    assert.ok(from.includes('-01-01T00:00:00Z'));
  });

  it('all returns nulls', () => {
    const { from, to } = getDateRange('all');
    assert.equal(from, null);
    assert.equal(to, null);
  });

  it('custom with dates', () => {
    const { from, to } = getDateRange('custom', { from: '2026-01-15', to: '2026-02-28' });
    assert.equal(from, '2026-01-15T00:00:00Z');
    assert.equal(to, '2026-02-28T23:59:59Z');
  });

  it('custom without dates returns nulls', () => {
    const { from, to } = getDateRange('custom');
    assert.equal(from, null);
    assert.equal(to, null);
  });

  it('unknown preset defaults to all', () => {
    const { from, to } = getDateRange('unknown');
    assert.equal(from, null);
    assert.equal(to, null);
  });

  it('yesterday returns previous day', () => {
    const { from, to } = getDateRange('yesterday');
    assert.ok(from.endsWith('T00:00:00Z'));
    assert.ok(to.endsWith('T23:59:59Z'));
    assert.equal(from.slice(0, 10), to.slice(0, 10));
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    assert.equal(from.slice(0, 10), yesterday.toISOString().slice(0, 10));
  });

  it('this_month starts on 1st', () => {
    const { from, to } = getDateRange('this_month');
    assert.ok(from.endsWith('-01T00:00:00Z'));
    assert.ok(to.endsWith('T23:59:59Z'));
  });

  it('last_month returns full previous month', () => {
    const { from, to } = getDateRange('last_month');
    assert.ok(from.endsWith('-01T00:00:00Z'));
    assert.ok(to.endsWith('T23:59:59Z'));
    // from and to should be in the same month
    assert.equal(from.slice(0, 7), to.slice(0, 7));
  });

  it('this_quarter starts on quarter boundary', () => {
    const { from } = getDateRange('this_quarter');
    const month = parseInt(from.slice(5, 7), 10);
    assert.ok([1, 4, 7, 10].includes(month));
    assert.ok(from.endsWith('-01T00:00:00Z'));
  });

  it('last_quarter returns full previous quarter', () => {
    const { from, to } = getDateRange('last_quarter');
    const fromMonth = parseInt(from.slice(5, 7), 10);
    assert.ok([1, 4, 7, 10].includes(fromMonth));
    assert.ok(from.endsWith('-01T00:00:00Z'));
    assert.ok(to.endsWith('T23:59:59Z'));
  });

  it('this_year starts Jan 1', () => {
    const { from } = getDateRange('this_year');
    assert.ok(from.includes('-01-01T00:00:00Z'));
  });

  it('this_year equals ytd', () => {
    const ytd = getDateRange('ytd');
    const thisYear = getDateRange('this_year');
    assert.equal(ytd.from, thisYear.from);
    assert.equal(ytd.to, thisYear.to);
  });

  it('last_year returns full previous year', () => {
    const { from, to } = getDateRange('last_year');
    const year = new Date().getFullYear() - 1;
    assert.equal(from, `${year}-01-01T00:00:00Z`);
    assert.equal(to, `${year}-12-31T23:59:59Z`);
  });
});

// ── getGroupBy ──────────────────────────────

describe('getGroupBy', () => {
  it('today → day', () => assert.equal(getGroupBy('today'), 'day'));
  it('yesterday → day', () => assert.equal(getGroupBy('yesterday'), 'day'));
  it('7d → day', () => assert.equal(getGroupBy('7d'), 'day'));
  it('30d → day', () => assert.equal(getGroupBy('30d'), 'day'));
  it('this_month → day', () => assert.equal(getGroupBy('this_month'), 'day'));
  it('last_month → day', () => assert.equal(getGroupBy('last_month'), 'day'));
  it('90d → week', () => assert.equal(getGroupBy('90d'), 'week'));
  it('this_quarter → week', () => assert.equal(getGroupBy('this_quarter'), 'week'));
  it('last_quarter → week', () => assert.equal(getGroupBy('last_quarter'), 'week'));
  it('ytd → month', () => assert.equal(getGroupBy('ytd'), 'month'));
  it('this_year → month', () => assert.equal(getGroupBy('this_year'), 'month'));
  it('last_year → month', () => assert.equal(getGroupBy('last_year'), 'month'));
  it('all → month', () => assert.equal(getGroupBy('all'), 'month'));
  it('custom → month', () => assert.equal(getGroupBy('custom'), 'month'));
});

// ── formatPeriod ────────────────────────────

describe('formatPeriod', () => {
  it('day format', () => assert.equal(formatPeriod('2026-03-24', 'day'), 'Mar 24'));
  it('day format — Jan 1', () => assert.equal(formatPeriod('2026-01-01', 'day'), 'Jan 1'));
  it('day format — Dec 31', () => assert.equal(formatPeriod('2026-12-31', 'day'), 'Dec 31'));
  it('month format', () => assert.equal(formatPeriod('2026-03', 'month'), 'Mar 2026'));
  it('month format — Dec', () => assert.equal(formatPeriod('2026-12', 'month'), 'Dec 2026'));
  it('month format — Jan', () => assert.equal(formatPeriod('2026-01', 'month'), 'Jan 2026'));
  it('week format', () => assert.equal(formatPeriod('2026-12', 'week'), 'W12'));
  it('week format — W01', () => assert.equal(formatPeriod('2026-01', 'week'), 'W01'));
  it('empty → empty', () => assert.equal(formatPeriod('', 'day'), ''));
  it('null → empty', () => assert.equal(formatPeriod(null, 'day'), ''));
});

// ── unixToDatetime ─────────────────────────

describe('unixToDatetime', () => {
  it('converts unix timestamp', () => assert.equal(unixToDatetime(1700000000), '2023-11-14 22:13:20'));
  it('converts epoch', () => assert.equal(unixToDatetime(1), '1970-01-01 00:00:01'));
  it('null → null', () => assert.equal(unixToDatetime(null), null));
  it('undefined → null', () => assert.equal(unixToDatetime(undefined), null));
  it('zero → null', () => assert.equal(unixToDatetime(0), null));
});

// ── datetimeToUnix ─────────────────────────

describe('datetimeToUnix', () => {
  it('converts SQL datetime', () => assert.equal(datetimeToUnix('2023-11-14 22:13:20'), 1700000000));
  it('converts ISO string', () => assert.equal(datetimeToUnix('2023-11-14T22:13:20Z'), 1700000000));
  it('null → null', () => assert.equal(datetimeToUnix(null), null));
  it('empty → null', () => assert.equal(datetimeToUnix(''), null));
  it('invalid → null', () => assert.equal(datetimeToUnix('not-a-date'), null));
  it('roundtrips with unixToDatetime', () => {
    const ts = 1700000000;
    assert.equal(datetimeToUnix(unixToDatetime(ts)), ts);
  });
});

// ── shortDate ───────────────────────────────

describe('shortDate', () => {
  it('formats ISO string', () => assert.equal(shortDate('2026-03-24T10:30:00Z'), 'Mar 24, 2026'));
  it('formats date-only string', () => assert.equal(shortDate('2026-03-24'), 'Mar 24, 2026'));
  it('formats Jan 1', () => assert.equal(shortDate('2026-01-01T00:00:00Z'), 'Jan 1, 2026'));
  it('formats Dec 31', () => assert.equal(shortDate('2026-12-31T23:59:59Z'), 'Dec 31, 2026'));
  it('empty → empty', () => assert.equal(shortDate(''), ''));
  it('null → empty', () => assert.equal(shortDate(null), ''));
  it('invalid → empty', () => assert.equal(shortDate('not-a-date'), ''));
});

describe('shortDate — locale and timeZone', () => {
  it('German', () => assert.equal(shortDate('2026-03-24T10:30:00Z', { locale: 'de' }), '24. März 2026'));
  it('French', () => assert.equal(shortDate('2026-03-24T10:30:00Z', { locale: 'fr' }), '24 mars 2026'));
  it('en-US is the default', () => assert.equal(shortDate('2026-03-24T10:30:00Z', { locale: 'en-US' }), 'Mar 24, 2026'));
  it('time zone moves the day', () => assert.equal(shortDate('2026-03-24T01:00:00Z', { timeZone: 'America/New_York' }), 'Mar 23, 2026'));
  it('unknown locale and zone keep the defaults', () => {
    assert.equal(shortDate('2026-03-24T10:30:00Z', { locale: 'xx', timeZone: 'Nowhere/Zone' }), 'Mar 24, 2026');
    assert.equal(shortDate('2026-03-24T10:30:00Z', { locale: 'not a locale' }), 'Mar 24, 2026');
  });
  it('invalid → empty', () => assert.equal(shortDate('not-a-date', { locale: 'de' }), ''));
});

// ── dateTime ────────────────────────────────

describe('dateTime', () => {
  it('formats with time', () => {
    const result = dateTime('2026-03-24T10:30:00Z');
    assert.ok(result.includes('Mar 24, 2026'));
    assert.ok(result.includes('10:30'));
  });

  it('midnight', () => {
    const result = dateTime('2026-03-24T00:00:00Z');
    assert.ok(result.includes('00:00'));
  });

  it('empty → empty', () => assert.equal(dateTime(''), ''));
  it('null → empty', () => assert.equal(dateTime(null), ''));
});

describe('dateTime — locale and timeZone', () => {
  it('German', () => assert.equal(dateTime('2026-03-24T10:30:00Z', { locale: 'de' }), '24. März 2026, 10:30'));
  it('Japanese', () => assert.equal(dateTime('2026-03-24T10:30:00Z', { locale: 'ja' }), '2026年3月24日 10:30'));
  it('en-US matches the default', () => {
    assert.equal(dateTime('2026-03-24T10:30:00Z', { locale: 'en-US' }), dateTime('2026-03-24T10:30:00Z'));
    assert.equal(dateTime('2026-03-24T00:05:00Z', { locale: 'en-US' }), dateTime('2026-03-24T00:05:00Z'));
  });
  it('24-hour in every locale', () => assert.equal(dateTime('2026-03-24T00:05:00Z', { locale: 'de' }), '24. März 2026, 00:05'));
  it('time zone', () => assert.equal(dateTime('2026-03-24T10:30:00Z', { timeZone: 'Asia/Bangkok' }), 'Mar 24, 2026, 17:30'));
  it('locale and time zone', () => assert.equal(dateTime('2026-03-24T10:30:00Z', { locale: 'de', timeZone: 'Asia/Bangkok' }), '24. März 2026, 17:30'));
  it('unknown locale and zone keep the defaults', () => {
    assert.equal(dateTime('2026-03-24T10:30:00Z', { locale: 'xx', timeZone: 'Nowhere/Zone' }), dateTime('2026-03-24T10:30:00Z'));
  });
  it('null → empty', () => assert.equal(dateTime(null, { locale: 'de' }), ''));
});

// ── relativeTime ────────────────────────────

describe('relativeTime', () => {
  it('just now (recent)', () => {
    const now = new Date().toISOString();
    assert.equal(relativeTime(now), 'just now');
  });

  it('minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    assert.equal(relativeTime(d), '5 minutes ago');
  });

  it('1 minute ago', () => {
    const d = new Date(Date.now() - 90 * 1000).toISOString();
    assert.equal(relativeTime(d), '1 minute ago');
  });

  it('hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    assert.equal(relativeTime(d), '3 hours ago');
  });

  it('1 hour ago', () => {
    const d = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    assert.equal(relativeTime(d), '1 hour ago');
  });

  it('days ago', () => {
    const d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(relativeTime(d), '5 days ago');
  });

  it('1 day ago', () => {
    const d = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
    assert.equal(relativeTime(d), '1 day ago');
  });

  it('months ago', () => {
    const d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(relativeTime(d), '2 months ago');
  });

  it('1 year ago', () => {
    const d = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(relativeTime(d), '1 year ago');
  });

  it('future date → just now', () => {
    const d = new Date(Date.now() + 60000).toISOString();
    assert.equal(relativeTime(d), 'just now');
  });

  it('empty → empty', () => assert.equal(relativeTime(''), ''));
  it('null → empty', () => assert.equal(relativeTime(null), ''));
});

describe('relativeTime — now and locale', () => {
  const now = Date.parse('2026-03-24T12:00:00Z');
  const ago = (ms) => new Date(now - ms).toISOString();
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it('now measures from a given moment, in English', () => {
    assert.equal(relativeTime(ago(2 * HOUR), { now }), '2 hours ago');
    assert.equal(relativeTime(ago(2 * HOUR), { now: new Date(now) }), '2 hours ago');
    assert.equal(relativeTime(ago(-MIN), { now }), 'just now');
  });

  it('German, at the English thresholds', () => {
    const de = (ms) => relativeTime(ago(ms), { locale: 'de', now });
    assert.equal(de(30 * 1000), 'jetzt');
    assert.equal(de(-MIN), 'jetzt');
    assert.equal(de(90 * 1000), 'vor 1 Minute');
    assert.equal(de(5 * MIN), 'vor 5 Minuten');
    assert.equal(de(3 * HOUR), 'vor 3 Stunden');
    assert.equal(de(36 * HOUR), 'gestern');
    assert.equal(de(5 * DAY), 'vor 5 Tagen');
    assert.equal(de(29 * DAY), 'vor 29 Tagen');
    assert.equal(de(60 * DAY), 'vor 2 Monaten');
    assert.equal(de(362 * DAY), 'letztes Jahr');
    assert.equal(de(800 * DAY), 'vor 2 Jahren');
  });

  it('French', () => assert.equal(relativeTime(ago(2 * HOUR), { locale: 'fr', now }), 'il y a 2 heures'));
  it('unknown locale → English', () => assert.equal(relativeTime(ago(2 * HOUR), { locale: 'xx', now }), '2 hours ago'));
  it('null → empty', () => assert.equal(relativeTime(null, { locale: 'de' }), ''));
});

// ── byDateDesc / byDateAsc ──────────────────

describe('byDateDesc — Astro CollectionEntry shape', () => {
  const posts = [
    { id: 'a', data: { date: new Date('2026-01-01') } },
    { id: 'b', data: { date: new Date('2026-03-01') } },
    { id: 'c', data: { date: new Date('2026-02-01') } },
  ];

  it('sorts newest first', () => {
    const sorted = [...posts].sort(byDateDesc).map((p) => p.id);
    assert.deepEqual(sorted, ['b', 'c', 'a']);
  });

  it('items with no date sort to the bottom (desc)', () => {
    const mixed = [...posts, { id: 'x', data: {} }];
    const sorted = [...mixed].sort(byDateDesc).map((p) => p.id);
    assert.equal(sorted[sorted.length - 1], 'x');
  });
});

describe('byDateDesc — flat shape', () => {
  it('uses item.date when item.data is absent', () => {
    const items = [
      { id: 'a', date: '2026-01-01' },
      { id: 'b', date: '2026-03-01' },
    ];
    const sorted = [...items].sort(byDateDesc).map((i) => i.id);
    assert.deepEqual(sorted, ['b', 'a']);
  });
});

describe('byDateAsc', () => {
  const posts = [
    { id: 'a', data: { date: new Date('2026-01-01') } },
    { id: 'b', data: { date: new Date('2026-03-01') } },
    { id: 'c', data: { date: new Date('2026-02-01') } },
  ];

  it('sorts oldest first', () => {
    const sorted = [...posts].sort(byDateAsc).map((p) => p.id);
    assert.deepEqual(sorted, ['a', 'c', 'b']);
  });

  it('handles string dates equivalently', () => {
    const items = [
      { id: 'a', data: { date: '2026-01-01' } },
      { id: 'b', data: { date: '2026-03-01' } },
    ];
    const sorted = [...items].sort(byDateAsc).map((i) => i.id);
    assert.deepEqual(sorted, ['a', 'b']);
  });

  it('returns 0 when both items missing dates (stable)', () => {
    assert.equal(byDateAsc({}, {}), 0);
  });
});

// ── DATE_PRESETS ────────────────────────────

describe('DATE_PRESETS', () => {
  it('exports every preset getDateRange accepts', () => {
    // Sanity-check the union matches by feeding each through getDateRange.
    for (const preset of DATE_PRESETS) {
      if (preset === 'custom') {
        const r = getDateRange(preset, { from: '2026-01-01', to: '2026-01-31' });
        assert.ok(r.from && r.to, `${preset} returned a custom range`);
      } else if (preset === 'all') {
        const r = getDateRange(preset);
        assert.equal(r.from, null);
        assert.equal(r.to, null);
      } else {
        const r = getDateRange(preset);
        assert.ok(r.from, `${preset} returned from`);
        assert.ok(r.to, `${preset} returned to`);
      }
    }
  });

  it('is frozen', () => {
    assert.ok(Object.isFrozen(DATE_PRESETS));
  });
});
