export const site = {
  name: 'Geocardinal Engineering Services Limited',
  shortName: 'Geocardinal',
  url: 'https://www.geocardinalengineering.com',
  founded: 2010,
  tagline: 'Geotechnical, mining and energy engineering — from first sample to steady-state production.',
  description:
    'Geocardinal Engineering Services is an Abuja-based engineering consultancy solving geotechnical, mining and energy challenges across Oil & Gas, Solid Minerals, Civil Engineering and Mining.',
  email: 'info@geocardinalengineering.com',
  careersEmail: 'info@geocardinalengineering.com',
  phones: ['+234 809 594 0025', '+234 806 333 3336', '+234 805 640 3751'],
  hours: 'Mon – Fri, 8:00 – 17:00 WAT',
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/geocardinalengineering/', icon: 'instagram' },
  ],
  /**
   * Optional form backend (e.g. Formspree, Basin, a serverless function).
   * When empty, forms fall back to composing an email in the visitor's mail app.
   */
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
} as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export type NavItem = { label: string; href: string; children?: { label: string; href: string; description?: string }[] };

export const primaryNav: NavItem[] = [
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Team', href: '/team' },
  { label: 'Insights', href: '/insights' },
  { label: 'Careers', href: '/careers' },
];

export const sectors = [
  {
    id: 'mining',
    name: 'Mining',
    icon: 'pickaxe',
    summary: 'Open pit and underground mine design, planning, grade control and operational support.',
  },
  {
    id: 'solid-minerals',
    name: 'Solid Minerals',
    icon: 'gem',
    summary: 'Exploration, resource definition and testwork for Nigeria’s strategic minerals.',
  },
  {
    id: 'oil-gas',
    name: 'Oil & Gas',
    icon: 'drop',
    summary: 'Upstream exploration expertise and consultancy from licensed engineers and geologists.',
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    icon: 'building',
    summary: 'Ground investigation and geotechnical design for infrastructure and foundations.',
  },
] as const;

export type SectorId = (typeof sectors)[number]['id'];

export const commodities = [
  'Gold',
  'Lithium',
  'Rare earth elements',
  'Uranium',
  'Lead–zinc',
  'Iron ore',
  'Barytes',
  'Bitumen',
  'Coal',
];

export const offices = [
  {
    city: 'Abuja',
    country: 'Nigeria',
    role: 'Head office',
    address: ['No. 48 Abidjan Street, Ground Floor', 'Zone 3, Wuse', 'Federal Capital Territory, Abuja'],
    coords: '9.0579° N, 7.4951° E',
    primary: true,
  },
  { city: 'Ilorin', country: 'Nigeria', role: 'Branch office', coords: '8.4966° N, 4.5421° E' },
  { city: 'Ibadan', country: 'Nigeria', role: 'Branch office', coords: '7.3775° N, 3.9470° E' },
  { city: 'Calabar', country: 'Nigeria', role: 'Branch office', coords: '4.9757° N, 8.3417° E' },
  { city: 'Johannesburg', country: 'South Africa', role: 'International office', coords: '26.2041° S, 28.0473° E' },
  { city: 'Canada', country: 'North America', role: 'International office', coords: '—' },
] as const;

export const values = [
  {
    title: 'Integrity, without exception',
    body: 'We hold ourselves to high ethical standards of corporate governance and professionalism — in the field, in the data and in the boardroom.',
    icon: 'shield',
  },
  {
    title: 'Partnerships that last',
    body: 'Our work is built on mutually beneficial, long-term relationships with operators, investors, regulators and host communities.',
    icon: 'handshake',
  },
  {
    title: 'Data before opinion',
    body: 'Every recommendation is traceable to measured ground conditions, tested samples and transparent assumptions.',
    icon: 'chart',
  },
  {
    title: 'Talent and innovation',
    body: 'We invest in people, encourage creative problem-solving and build local technical capacity on every project.',
    icon: 'spark',
  },
] as const;
