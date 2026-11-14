import { describe, expect, it } from 'vitest';
import { buildCalendarEvents, googleCalendarUrl, isDateOnly, monthGridDates, toIcs } from './index';
import { calendarFixtures } from './fixtures';

describe('calendar event logic', () => {
  it('rejects impossible calendar dates', () => {
    expect(isDateOnly('2026-02-30')).toBe(false);
    expect(isDateOnly('2028-02-29')).toBe(true);
  });

  it('renders all six weeks when a month needs 42 calendar cells', () => {
    const dates = monthGridDates(2026, 7);
    expect(dates).toHaveLength(42);
    expect(dates).toContain('2026-08-31');
    expect(monthGridDates(2026, 10)).toHaveLength(35);
  });
  it('omits applications with unknown dates', () => {
    expect(buildCalendarEvents(calendarFixtures, '2026-11-13')).not.toContainEqual(expect.objectContaining({ applicationId: 'app-summit' }));
  });

  it('orders events by date, then title, with stable ids', () => {
    const events = buildCalendarEvents(calendarFixtures, '2026-11-13');
    expect(events.map((event) => event.date)).toEqual(['2026-11-14', '2026-11-15', '2026-11-18', '2026-11-20']);
    expect(events[0].id).toBe('careerforge-app-north-star-posting-deadline');
  });

  it('labels verified, unverified, and personal dates distinctly', () => {
    const events = buildCalendarEvents(calendarFixtures, '2026-11-13');
    expect(events.map((event) => event.label)).toEqual(['Verified posting deadline', 'Personal application reminder', 'Unverified posting deadline', 'Personal application reminder']);
  });

  it('classifies dates as today, soon, and overdue', () => {
    const events = buildCalendarEvents(calendarFixtures, '2026-11-15');
    expect(events.find((event) => event.date === '2026-11-14')?.state).toBe('overdue');
    expect(events.find((event) => event.date === '2026-11-15')?.state).toBe('today');
    expect(events.find((event) => event.date === '2026-11-18')?.state).toBe('soon');
  });

  it('uses the next date as the exclusive all-day end boundary', () => {
    const event = buildCalendarEvents(calendarFixtures, '2026-11-13')[0];
    expect(toIcs(event)).toContain('DTSTART;VALUE=DATE:20261114');
    expect(toIcs(event)).toContain('DTEND;VALUE=DATE:20261115');
  });

  it('escapes ICS text and omits private application data', () => {
    const event = { ...buildCalendarEvents(calendarFixtures, '2026-11-13')[0], title: 'A, B; C\\D\nE' };
    const ics = toIcs(event);
    expect(ics).toContain('A\\, B\\; C\\\\D\\nE');
    expect(ics).not.toContain('sourceUrl');
    expect(ics).not.toContain('resume');
    expect(ics).not.toContain('/applications/');
  });

  it('creates a prefilled Google Calendar link without private URLs', () => {
    const url = googleCalendarUrl(buildCalendarEvents(calendarFixtures, '2026-11-13')[0]);
    expect(url).toContain('calendar.google.com/calendar/render');
    expect(url).toContain('dates=20261114%2F20261115');
    expect(url).not.toContain('sourceUrl');
  });
});
