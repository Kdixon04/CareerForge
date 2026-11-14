import type { CalendarApplication } from './index';

export const calendarFixtures: CalendarApplication[] = [
  {
    id: 'app-north-star',
    status: 'applied',
    personalReminder: '2026-11-15',
    job: { id: 'job-north-star', title: 'Frontend Engineering Intern', company: 'North Star Labs', deadline: '2026-11-14', deadlineVerified: true },
  },
  {
    id: 'app-canyon',
    status: 'saved',
    personalReminder: '2026-11-20',
    job: { id: 'job-canyon', title: 'Product Design Co-op', company: 'Canyon Works', deadline: '2026-11-18', deadlineVerified: false },
  },
  {
    id: 'app-summit',
    status: 'interviewing',
    personalReminder: null,
    job: { id: 'job-summit', title: 'Data Analyst Intern', company: 'Summit Analytics', deadline: null, deadlineVerified: false },
  },
];

