export type Role = {
  id: string;
  title: string;
  team: string;
  location: string;
  type: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
};

export const roles: Role[] = [
  {
    id: 'mining-engineer-site',
    title: 'Mining Engineer (On-site)',
    team: 'Mining',
    location: 'Project site, Nigeria',
    type: 'Full-time',
    summary: 'Support safe, efficient day-to-day mining operations and translate plans into production on the ground.',
    responsibilities: [
      'Implement mine plans, short-term schedules and drill-and-blast designs',
      'Supervise contractors and monitor safety and production performance',
      'Prepare survey reconciliations and production reports',
      'Work with geology and geotechnical teams on grade control and ground conditions',
    ],
    requirements: [
      'B.Eng / B.Tech in Mining Engineering; COREN registration is an advantage',
      'Site experience in open pit or underground operations',
      'Working knowledge of mine planning software',
      'Willingness to work on rotation at remote sites',
    ],
  },
  {
    id: 'principal-geologist',
    title: 'Principal Geologist',
    team: 'Geology',
    location: 'Abuja, Nigeria',
    type: 'Full-time',
    summary: 'Lead exploration and resource programmes and mentor a growing team of geoscientists.',
    responsibilities: [
      'Design and lead exploration and drilling programmes',
      'Oversee geological modelling, QA/QC and technical reporting',
      'Act as technical lead on client engagements',
      'Mentor and develop geologists across the firm',
    ],
    requirements: [
      'Degree in Geology; postgraduate qualification preferred',
      'Significant experience in exploration and resource definition',
      'Membership of a recognised professional body (e.g. COMEG, NMGS)',
      'Strong report writing and client communication skills',
    ],
  },
];

export const benefits = [
  { title: 'Real responsibility', body: 'Work on live projects across exploration, design and operations from day one.', icon: 'target' },
  { title: 'Mentorship', body: 'Learn directly from senior engineers and geologists with decades of field experience.', icon: 'users' },
  { title: 'Professional growth', body: 'Support for COREN, COMEG and other professional registrations and training.', icon: 'spark' },
  { title: 'Diverse projects', body: 'Mining, solid minerals, oil & gas and civil work across Nigeria and abroad.', icon: 'compass' },
] as const;
