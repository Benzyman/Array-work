export type Leader = {
  id: string;
  name: string;
  role: string;
  initials: string;
  summary: string;
  bio: string[];
  focus: string[];
};

export const leadership: Leader[] = [
  {
    id: 'akande-jide',
    name: 'Engr. Prof. Akande Jide',
    role: 'Chairman',
    initials: 'AJ',
    summary: 'Over 30 years of engineering, academic and leadership experience.',
    bio: [
      'Engr. Prof. Akande Jide chairs Geocardinal Engineering worldwide, bringing more than three decades of experience across engineering practice, research and leadership.',
      'He sets the firm’s strategic direction and champions its commitment to technical rigour, ethical governance and the development of the next generation of African engineers.',
    ],
    focus: ['Strategy & governance', 'Mining engineering', 'Capacity development'],
  },
  {
    id: 'jacob-adeyemo',
    name: 'Engr. Jacob Titilope Adeyemo',
    role: 'Technical Director & Chief Executive Officer',
    initials: 'JA',
    summary: 'Leads Geocardinal’s technical delivery and day-to-day operations.',
    bio: [
      'Engr. Jacob Titilope Adeyemo leads Geocardinal as Technical Director and Chief Executive Officer, overseeing technical quality across every engagement.',
      'He works closely with clients from early exploration through to operations, ensuring that recommendations are practical, data-driven and aligned with each project’s commercial objectives.',
    ],
    focus: ['Technical direction', 'Client delivery', 'Mine design & planning'],
  },
];

export const disciplines = [
  { title: 'Geotechnical engineers', body: 'Rock mechanics, slope and underground stability, ground support design.', icon: 'layers' },
  { title: 'Mining engineers', body: 'Open pit and underground design, scheduling, equipment and cost modelling.', icon: 'pickaxe' },
  { title: 'Geologists', body: 'Exploration, structural interpretation, resource definition and grade control — including principal geologists with around 25 years in oil & gas and solid minerals.', icon: 'compass' },
  { title: 'Metallurgists', body: 'Mineralogical and metallurgical testwork, process design criteria.', icon: 'flask' },
  { title: 'Environmental & safety specialists', body: 'Compliance, impact assessment, closure and HSE systems.', icon: 'leaf' },
  { title: 'Data & risk analysts', body: 'Databases, QA/QC, financial models and project risk frameworks.', icon: 'database' },
] as const;
