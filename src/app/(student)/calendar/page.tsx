'use client';

import { useMemo, useState } from 'react';
import { buildCalendarEvents, googleCalendarUrl, monthGridDates, toIcs, type CalendarEvent } from '../../../lib/calendar';
import { calendarFixtures } from '../../../lib/calendar/fixtures';

// A fixed reference date keeps this fictional schedule reproducible.
const SAMPLE_TODAY = '2026-11-13';

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function downloadIcs(event: CalendarEvent) {
  const blob = new Blob([toIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.id}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date(`${SAMPLE_TODAY}T00:00:00Z`));
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const events = useMemo(() => buildCalendarEvents(calendarFixtures, SAMPLE_TODAY), []);
  const monthEvents = events.filter((event) => event.date.startsWith(month.toISOString().slice(0, 7)));

  return (
    <main className="calendar-shell" aria-labelledby="calendar-title">
      <div className="calendar-header">
        <div>
          <p className="eyebrow">Career Forge · fixture preview</p>
          <h1 id="calendar-title">Your career calendar</h1>
          <p className="muted">Deadlines and personal reminders in one place. Dates are shown as all-day events.</p>
        </div>
        <div className="calendar-nav" aria-label="Calendar navigation">
          <button type="button" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))} aria-label="Previous month">←</button>
          <strong>{monthLabel(month)}</strong>
          <button type="button" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))} aria-label="Next month">→</button>
        </div>
      </div>

      <aside className="calendar-notice" aria-label="Calendar preview limitations">
        <strong>Fictional calendar preview</strong>
        <p>These are sample applications, not your saved records. Due states use the sample reference date November 13, 2026, not today. Google Calendar receives the fictional event title, company and date when you choose its link; a downloaded .ics file contains the same details. No profile facts or notes are included.</p>
      </aside>

      <section className="calendar-grid" aria-label={`${monthLabel(month)} calendar`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div className="weekday" key={day}>{day}</div>)}
        {monthGridDates(month.getUTCFullYear(), month.getUTCMonth()).map((dateString) => {
          const date = new Date(`${dateString}T00:00:00Z`);
          const dayEvents = events.filter((event) => event.date === dateString);
          return <div className={`calendar-day${date.getUTCMonth() === month.getUTCMonth() ? '' : ' outside'}`} key={dateString}>
            <span>{date.getUTCDate()}</span>
            {dayEvents.map((event) => <button type="button" className={`event-chip ${event.state}`} key={event.id} onClick={() => setSelected(event)}>{event.title}</button>)}
          </div>;
        })}
      </section>

      <section className="upcoming" aria-labelledby="upcoming-title">
        <div className="section-heading"><div><p className="eyebrow">Sample schedule</p><h2 id="upcoming-title">Fictional events</h2></div><span className="count">{monthEvents.length} this month</span></div>
        {events.length === 0 ? <p className="empty-state">No dated applications yet. Add a deadline or personal reminder from a saved application.</p> : <div className="event-list">{events.map((event) => <article className="event-card" key={event.id}>
          <button type="button" className="event-card-main" onClick={() => setSelected(event)}><span className={`state-dot ${event.state}`} aria-hidden="true" /><span><strong>{event.title}</strong><span className="event-meta">{event.company} · {formatDate(event.date)}</span><span className="event-label">{event.label}</span></span></button>
          <div className="export-actions"><a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">Google Calendar</a><button type="button" onClick={() => downloadIcs(event)}>Download .ics</button></div>
        </article>)}</div>}
      </section>

      {selected && <section className="detail-panel" aria-label="Event details" aria-live="polite"><div><p className="eyebrow">Sample event details</p><h2>{selected.title}</h2><p>{selected.company} · {formatDate(selected.date)}</p><p className={`status status-${selected.state}`}>{selected.state === 'today' ? 'Due on the sample date' : selected.state === 'overdue' ? 'Past the sample date' : selected.state === 'soon' ? 'Due soon after the sample date' : 'Later than the sample date'}</p><p className="muted">{selected.label}. This fictional event contains its title, company and date when exported.</p></div><button type="button" onClick={() => setSelected(null)}>Close</button></section>}
      <style jsx>{`
        .calendar-shell { max-width: 1120px; margin: 0 auto; padding: 48px 24px 80px; color: var(--cf-text); }
        .calendar-notice { border: 1px solid var(--cf-border); border-radius: 12px; padding: 16px; background: var(--cf-subtle); }
        .calendar-notice p { margin: 8px 0 0; color: var(--cf-muted); }
        .calendar-header, .section-heading { display: flex; justify-content: space-between; gap: 24px; align-items: end; }
        h1, h2, p { margin-top: 0; } h1 { font-size: clamp(2rem, 5vw, 4rem); margin-bottom: 12px; letter-spacing: -.05em; } h2 { margin-bottom: 8px; }
        .eyebrow { color: var(--cf-leather); font-size: .75rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 10px; } .muted { color: var(--cf-muted); }
        .calendar-nav { display: flex; align-items: center; gap: 16px; white-space: nowrap; } button, a { font: inherit; } button { cursor: pointer; } button:focus-visible, a:focus-visible { outline: 3px solid var(--cf-focus); outline-offset: 2px; } .calendar-nav button { border: 1px solid var(--cf-border); border-radius: 10px; background: var(--cf-surface); color: var(--cf-text); padding: 8px 12px; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border: 1px solid var(--cf-border); border-radius: 18px; overflow: hidden; margin: 40px 0; background: var(--cf-surface); } .weekday { background: var(--cf-subtle); color: var(--cf-muted); font-size: .75rem; font-weight: 800; padding: 12px; text-align: center; } .calendar-day { min-height: 92px; padding: 10px; border-top: 1px solid var(--cf-border); border-right: 1px solid var(--cf-border); } .calendar-day:nth-child(7n) { border-right: 0; } .calendar-day.outside { background: var(--cf-subtle); color: var(--cf-muted); } .event-chip { display: block; width: 100%; margin-top: 8px; padding: 5px 7px; border: 1px solid var(--cf-border); border-radius: 7px; background: var(--cf-subtle); color: var(--cf-text); text-align: left; font-size: .72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .event-chip.overdue { border-color: var(--cf-danger); } .event-chip.today { border-color: var(--cf-accent); }
        .count { border-radius: 999px; background: var(--cf-subtle); color: var(--cf-text); padding: 7px 12px; font-size: .8rem; font-weight: 700; } .event-list { display: grid; gap: 12px; margin-top: 20px; } .event-card { display: flex; justify-content: space-between; gap: 20px; align-items: center; border: 1px solid var(--cf-border); border-radius: 14px; background: var(--cf-surface); padding: 16px; } .event-card-main { display: flex; align-items: flex-start; gap: 12px; border: 0; background: transparent; color: var(--cf-text); text-align: left; } .state-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--cf-leather); margin-top: 6px; flex: 0 0 auto; } .state-dot.overdue { background: var(--cf-danger); } .state-dot.today { background: var(--cf-accent); } .event-meta, .event-label { display: block; color: var(--cf-muted); font-size: .85rem; margin-top: 4px; } .event-label { color: var(--cf-leather); font-size: .75rem; font-weight: 700; } .export-actions { display: flex; gap: 12px; align-items: center; font-size: .8rem; } .export-actions a { color: var(--cf-leather); } .export-actions button { border: 1px solid var(--cf-border); background: var(--cf-subtle); border-radius: 8px; padding: 8px 10px; color: var(--cf-text); }
        .empty-state { border: 1px dashed var(--cf-border); border-radius: 14px; padding: 24px; color: var(--cf-muted); margin-top: 20px; } .detail-panel { position: fixed; right: 24px; bottom: 24px; max-width: 420px; display: flex; justify-content: space-between; gap: 20px; padding: 22px; border: 1px solid var(--cf-border); border-radius: 16px; background: var(--cf-surface); color: var(--cf-text); box-shadow: 0 16px 40px #0003; } .detail-panel > button { height: fit-content; border: 0; background: transparent; color: var(--cf-leather); font-weight: 700; } .status { font-weight: 800; } .status-overdue { color: var(--cf-danger); } .status-today, .status-soon, .status-upcoming { color: var(--cf-leather); }
        @media (max-width: 700px) { .calendar-shell { padding: 28px 14px 60px; } .calendar-header, .section-heading, .event-card { align-items: flex-start; flex-direction: column; } .calendar-nav { width: 100%; justify-content: space-between; } .calendar-day { min-height: 74px; padding: 6px; font-size: .8rem; } .event-chip { font-size: .65rem; padding: 4px; } .export-actions { width: 100%; flex-wrap: wrap; } .detail-panel { left: 14px; right: 14px; bottom: 14px; } }
      `}</style>
    </main>
  );
}
