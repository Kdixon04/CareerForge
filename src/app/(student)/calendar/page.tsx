'use client';

import { useMemo, useState } from 'react';
import { buildCalendarEvents, googleCalendarUrl, toIcs, type CalendarEvent } from '../../../lib/calendar';
import { calendarFixtures } from '../../../lib/calendar/fixtures';

const TODAY = '2026-11-13';

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
  const [month, setMonth] = useState(new Date(`${TODAY}T00:00:00Z`));
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const events = useMemo(() => buildCalendarEvents(calendarFixtures, TODAY), []);
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

      <section className="calendar-grid" aria-label={`${monthLabel(month)} calendar`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div className="weekday" key={day}>{day}</div>)}
        {Array.from({ length: 35 }, (_, index) => {
          const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index - new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1)).getUTCDay() + 1));
          const dateString = date.toISOString().slice(0, 10);
          const dayEvents = events.filter((event) => event.date === dateString);
          return <div className={`calendar-day${date.getUTCMonth() === month.getUTCMonth() ? '' : ' outside'}`} key={dateString}>
            <span>{date.getUTCDate()}</span>
            {dayEvents.map((event) => <button type="button" className={`event-chip ${event.state}`} key={event.id} onClick={() => setSelected(event)}>{event.title}</button>)}
          </div>;
        })}
      </section>

      <section className="upcoming" aria-labelledby="upcoming-title">
        <div className="section-heading"><div><p className="eyebrow">Keep moving</p><h2 id="upcoming-title">Upcoming reminders</h2></div><span className="count">{monthEvents.length} this month</span></div>
        {events.length === 0 ? <p className="empty-state">No dated applications yet. Add a deadline or personal reminder from a saved application.</p> : <div className="event-list">{events.map((event) => <article className="event-card" key={event.id}>
          <button type="button" className="event-card-main" onClick={() => setSelected(event)}><span className={`state-dot ${event.state}`} aria-hidden="true" /><span><strong>{event.title}</strong><span className="event-meta">{event.company} · {formatDate(event.date)}</span><span className="event-label">{event.label}</span></span></button>
          <div className="export-actions"><a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">Google Calendar</a><button type="button" onClick={() => downloadIcs(event)}>Download .ics</button></div>
        </article>)}</div>}
      </section>

      {selected && <div className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="event-detail-title"><div><p className="eyebrow">Event details</p><h2 id="event-detail-title">{selected.title}</h2><p>{selected.company} · {formatDate(selected.date)}</p><p className={`status status-${selected.state}`}>{selected.state === 'today' ? 'Due today' : selected.state === 'overdue' ? 'Overdue' : selected.state === 'soon' ? 'Due soon' : 'Upcoming'}</p><p className="muted">{selected.label}. Private application and profile information stays inside Career Forge.</p></div><button type="button" onClick={() => setSelected(null)}>Close</button></div>}
      <style jsx>{`
        .calendar-shell { max-width: 1120px; margin: 0 auto; padding: 48px 24px 80px; color: #17251f; }
        .calendar-header, .section-heading { display: flex; justify-content: space-between; gap: 24px; align-items: end; }
        h1, h2, p { margin-top: 0; } h1 { font-size: clamp(2rem, 5vw, 4rem); margin-bottom: 12px; letter-spacing: -.05em; } h2 { margin-bottom: 8px; }
        .eyebrow { color: #16805b; font-size: .75rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 10px; } .muted { color: #62736b; }
        .calendar-nav { display: flex; align-items: center; gap: 16px; white-space: nowrap; } button, a { font: inherit; } button { cursor: pointer; } .calendar-nav button { border: 1px solid #cddbd4; border-radius: 10px; background: #fff; padding: 8px 12px; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border: 1px solid #dce7e1; border-radius: 18px; overflow: hidden; margin: 40px 0; background: #fff; } .weekday { background: #f0f6f2; color: #62736b; font-size: .75rem; font-weight: 800; padding: 12px; text-align: center; } .calendar-day { min-height: 92px; padding: 10px; border-top: 1px solid #e6eee9; border-right: 1px solid #e6eee9; } .calendar-day:nth-child(7n) { border-right: 0; } .calendar-day.outside { background: #fafcfb; color: #a8b6ae; } .event-chip { display: block; width: 100%; margin-top: 8px; padding: 5px 7px; border: 0; border-radius: 7px; background: #d9f4e7; color: #116345; text-align: left; font-size: .72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .event-chip.overdue { background: #ffe4df; color: #a73d2f; } .event-chip.today { background: #ffe9a8; color: #785600; }
        .count { border-radius: 999px; background: #e7f5ed; color: #116345; padding: 7px 12px; font-size: .8rem; font-weight: 700; } .event-list { display: grid; gap: 12px; margin-top: 20px; } .event-card { display: flex; justify-content: space-between; gap: 20px; align-items: center; border: 1px solid #dce7e1; border-radius: 14px; background: #fff; padding: 16px; } .event-card-main { display: flex; align-items: flex-start; gap: 12px; border: 0; background: transparent; text-align: left; } .state-dot { width: 10px; height: 10px; border-radius: 50%; background: #42a878; margin-top: 6px; flex: 0 0 auto; } .state-dot.overdue { background: #d95545; } .state-dot.today { background: #edb62d; } .event-meta, .event-label { display: block; color: #62736b; font-size: .85rem; margin-top: 4px; } .event-label { color: #16805b; font-size: .75rem; font-weight: 700; } .export-actions { display: flex; gap: 12px; align-items: center; font-size: .8rem; } .export-actions a { color: #116345; } .export-actions button { border: 1px solid #cddbd4; background: #f7fbf8; border-radius: 8px; padding: 8px 10px; color: #116345; }
        .empty-state { border: 1px dashed #cddbd4; border-radius: 14px; padding: 24px; color: #62736b; margin-top: 20px; } .detail-panel { position: fixed; right: 24px; bottom: 24px; max-width: 420px; display: flex; justify-content: space-between; gap: 20px; padding: 22px; border: 1px solid #b9d8c7; border-radius: 16px; background: #f7fffa; box-shadow: 0 16px 40px #17251f22; } .detail-panel > button { height: fit-content; border: 0; background: transparent; color: #116345; font-weight: 700; } .status { font-weight: 800; } .status-overdue { color: #a73d2f; } .status-today { color: #a87900; } .status-soon, .status-upcoming { color: #16805b; }
        @media (max-width: 700px) { .calendar-shell { padding: 28px 14px 60px; } .calendar-header, .section-heading, .event-card { align-items: flex-start; flex-direction: column; } .calendar-nav { width: 100%; justify-content: space-between; } .calendar-day { min-height: 74px; padding: 6px; font-size: .8rem; } .event-chip { font-size: .65rem; padding: 4px; } .export-actions { width: 100%; flex-wrap: wrap; } .detail-panel { left: 14px; right: 14px; bottom: 14px; } }
      `}</style>
    </main>
  );
}

