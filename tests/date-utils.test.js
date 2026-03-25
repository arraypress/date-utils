import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDateRange, getGroupBy, formatPeriod, shortDate, dateTime, relativeTime } from '../src/index.js';

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
});

// ── getGroupBy ──────────────────────────────

describe('getGroupBy', () => {
  it('today → day', () => assert.equal(getGroupBy('today'), 'day'));
  it('7d → day', () => assert.equal(getGroupBy('7d'), 'day'));
  it('30d → day', () => assert.equal(getGroupBy('30d'), 'day'));
  it('90d → week', () => assert.equal(getGroupBy('90d'), 'week'));
  it('ytd → month', () => assert.equal(getGroupBy('ytd'), 'month'));
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
