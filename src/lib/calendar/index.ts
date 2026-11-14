export type CalendarEventKind = 'posting_deadline' | 'personal_reminder';
export type CalendarEventState = 'overdue' | 'today' | 'soon' | 'upcoming';

export type CalendarJob = {
  id: string;
  title: string;
  company: string;
  deadline: string | null;
  deadlineVerified: boolean;
};

export type CalendarApplication = {
  id: string;
  job: CalendarJob;
  personalReminder: string | null;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
};

export type CalendarEvent = {
  id: string;
  applicationId: string;
  date: string;
  title: string;
  company: string;
  kind: CalendarEventKind;
  label: string;
  verified: boolean;
  state: CalendarEventState;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value: string): boolean {
  if (!DATE_ONLY.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function monthGridDates(year: number, monthIndex: number): string[] {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, index) =>
    new Date(Date.UTC(year, monthIndex, index - firstWeekday + 1)).toISOString().slice(0, 10),
  );
}

function dateValue(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime();
}

export function addDays(date: string, days: number): string {
  const next = new Date(dateValue(date));
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function getEventState(date: string, today: string): CalendarEventState {
  const delta = Math.round((dateValue(date) - dateValue(today)) / 86_400_000);
  if (delta < 0) return 'overdue';
  if (delta === 0) return 'today';
  if (delta <= 7) return 'soon';
  return 'upcoming';
}

export function buildCalendarEvents(
  applications: CalendarApplication[],
  today: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const application of applications) {
    const { job } = application;
    if (job.deadline && isDateOnly(job.deadline)) {
      events.push({
        id: `careerforge-${application.id}-posting-deadline`,
        applicationId: application.id,
        date: job.deadline,
        title: job.title,
        company: job.company,
        kind: 'posting_deadline',
        label: job.deadlineVerified ? 'Verified posting deadline' : 'Unverified posting deadline',
        verified: job.deadlineVerified,
        state: getEventState(job.deadline, today),
      });
    }
    if (application.personalReminder && isDateOnly(application.personalReminder)) {
      events.push({
        id: `careerforge-${application.id}-personal-reminder`,
        applicationId: application.id,
        date: application.personalReminder,
        title: job.title,
        company: job.company,
        kind: 'personal_reminder',
        label: 'Personal application reminder',
        verified: false,
        state: getEventState(application.personalReminder, today),
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function icsDate(date: string): string {
  return date.replaceAll('-', '');
}

export function toIcs(event: CalendarEvent): string {
  const summary = `${event.label}: ${event.title} — ${event.company}`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Career Forge//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(event.id)}@careerforge`,
    `DTSTART;VALUE=DATE:${icsDate(event.date)}`,
    `DTEND;VALUE=DATE:${icsDate(addDays(event.date, 1))}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(event.label)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.label}: ${event.title}`,
    dates: `${icsDate(event.date)}/${icsDate(addDays(event.date, 1))}`,
    details: event.label,
    location: event.company,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
