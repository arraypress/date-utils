import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isTimeZone,
  localDate,
  startOfLocalDay,
  addDays,
  periodStart,
  nextPeriod,
  previousPeriod,
  periodBounds,
  periodLabel,
  parseLocalDate,
  formatLocalDate,
} from '../src/index.js';

const HOUR = 3_600_000;

describe('localDate / startOfLocalDay', () => {
  it('reads the calendar date in a zone without daylight saving', () => {
    assert.deepEqual(localDate(Date.UTC(2026, 9, 9, 16, 59), 'Asia/Bangkok'), { y: 2026, m: 10, d: 9 });
    assert.deepEqual(localDate(Date.UTC(2026, 9, 9, 17, 0), 'Asia/Bangkok'), { y: 2026, m: 10, d: 10 });
    assert.equal(startOfLocalDay({ y: 2026, m: 10, d: 10 }, 'Asia/Bangkok'), Date.UTC(2026, 9, 9, 17));
  });

  it('makes the London day the clocks go forward 23 hours, and back 25', () => {
    const tz = 'Europe/London';
    const forward = startOfLocalDay({ y: 2026, m: 3, d: 29 }, tz);
    assert.equal(forward, Date.UTC(2026, 2, 29, 0));
    assert.equal(startOfLocalDay({ y: 2026, m: 3, d: 30 }, tz) - forward, 23 * HOUR);
    const back = startOfLocalDay({ y: 2026, m: 10, d: 25 }, tz);
    assert.equal(back, Date.UTC(2026, 9, 24, 23));
    assert.equal(startOfLocalDay({ y: 2026, m: 10, d: 26 }, tz) - back, 25 * HOUR);
  });

  it('follows New York’s changes, which happen at 2am', () => {
    const tz = 'America/New_York';
    assert.equal(startOfLocalDay({ y: 2026, m: 3, d: 8 }, tz), Date.UTC(2026, 2, 8, 5));
    assert.equal(startOfLocalDay({ y: 2026, m: 3, d: 9 }, tz), Date.UTC(2026, 2, 9, 4));
    assert.equal(startOfLocalDay({ y: 2026, m: 11, d: 2 }, tz) - startOfLocalDay({ y: 2026, m: 11, d: 1 }, tz), 25 * HOUR);
  });

  it('round-trips: a day’s first instant falls on that day', () => {
    for (const tz of ['Europe/London', 'America/New_York', 'Asia/Bangkok', 'Australia/Lord_Howe', 'Pacific/Chatham']) {
      for (const date of [{ y: 2026, m: 1, d: 1 }, { y: 2026, m: 4, d: 5 }, { y: 2026, m: 10, d: 4 }, { y: 2026, m: 10, d: 25 }]) {
        assert.deepEqual(localDate(startOfLocalDay(date, tz), tz), date, `${tz} ${formatLocalDate(date)}`);
        assert.notDeepEqual(localDate(startOfLocalDay(date, tz) - 1, tz), date, `${tz} ${formatLocalDate(date)} starts there`);
      }
    }
  });

  it('knows a time zone from a typo', () => {
    assert.equal(isTimeZone('Asia/Bangkok'), true);
    assert.equal(isTimeZone('Asia/Bankok'), false);
  });
});

describe('periods', () => {
  it('finds a period’s first day (weeks start on Monday)', () => {
    const friday = { y: 2026, m: 10, d: 9 };
    assert.deepEqual(periodStart(friday, 'day'), friday);
    assert.deepEqual(periodStart(friday, 'week'), { y: 2026, m: 10, d: 5 });
    assert.deepEqual(periodStart({ y: 2026, m: 10, d: 11 }, 'week'), { y: 2026, m: 10, d: 5 }); // a Sunday
    assert.deepEqual(periodStart(friday, 'month'), { y: 2026, m: 10, d: 1 });
    assert.deepEqual(periodStart(friday, 'quarter'), { y: 2026, m: 10, d: 1 });
    assert.deepEqual(periodStart({ y: 2026, m: 5, d: 20 }, 'quarter'), { y: 2026, m: 4, d: 1 });
    assert.deepEqual(periodStart(friday, 'year'), { y: 2026, m: 1, d: 1 });
    assert.throws(() => periodStart(friday, 'fortnight'), RangeError);
  });

  it('steps forward and back, across years', () => {
    assert.deepEqual(nextPeriod({ y: 2026, m: 12, d: 1 }, 'month'), { y: 2027, m: 1, d: 1 });
    assert.deepEqual(previousPeriod({ y: 2026, m: 1, d: 1 }, 'quarter'), { y: 2025, m: 10, d: 1 });
    assert.deepEqual(nextPeriod({ y: 2026, m: 12, d: 28 }, 'week'), { y: 2027, m: 1, d: 4 });
    assert.deepEqual(nextPeriod({ y: 2026, m: 10, d: 9 }, 'day', -10), { y: 2026, m: 9, d: 29 });
    assert.deepEqual(addDays({ y: 2028, m: 2, d: 28 }, 1), { y: 2028, m: 2, d: 29 });
  });

  it('gives a period’s bounds in a time zone, for a query', () => {
    const { start, from, to } = periodBounds({ y: 2026, m: 10, d: 9 }, 'month', 'Asia/Bangkok');
    assert.deepEqual(start, { y: 2026, m: 10, d: 1 });
    assert.equal(from, Date.UTC(2026, 8, 30, 17));
    assert.equal(to, Date.UTC(2026, 9, 31, 17));
    const london = periodBounds({ y: 2026, m: 10, d: 25 }, 'day', 'Europe/London');
    assert.equal(london.to - london.from, 25 * HOUR);
  });

  it('labels periods, with ISO weeks', () => {
    const start = { y: 2026, m: 10, d: 5 };
    assert.equal(periodLabel(start, 'day'), '2026-10-05');
    assert.equal(periodLabel(start, 'week'), '2026-W41');
    assert.equal(periodLabel(start, 'month'), '2026-10');
    assert.equal(periodLabel(start, 'quarter'), '2026-Q4');
    assert.equal(periodLabel(start, 'year'), '2026');
    assert.equal(periodLabel({ y: 2026, m: 12, d: 28 }, 'week'), '2026-W53'); // 2026 has 53 weeks
    assert.equal(periodLabel({ y: 2024, m: 12, d: 30 }, 'week'), '2025-W01'); // belongs to the next ISO year
    assert.equal(periodLabel(periodStart({ y: 2027, m: 1, d: 1 }, 'week'), 'week'), '2026-W53');
  });
});

describe('parseLocalDate / formatLocalDate', () => {
  it('reads and writes YYYY-MM-DD, refusing dates that don’t exist', () => {
    assert.deepEqual(parseLocalDate('2026-10-09'), { y: 2026, m: 10, d: 9 });
    assert.equal(formatLocalDate({ y: 2026, m: 1, d: 5 }), '2026-01-05');
    for (const bad of ['2026-02-30', '2026-13-01', '26-10-09', '2026-10-9', '', null, undefined]) assert.equal(parseLocalDate(bad), null, String(bad));
    assert.deepEqual(parseLocalDate('2028-02-29'), { y: 2028, m: 2, d: 29 });
  });
});
