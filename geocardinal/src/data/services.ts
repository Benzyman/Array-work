import type { SectorId } from './site';

export type Stage = 'explore' | 'investigate' | 'evaluate' | 'design' | 'operate' | 'sustain';

export const stages: { id: Stage; label: string; summary: string }[] = [
  { id: 'explore', label: 'Explore', summary: 'Find and define the opportunity.' },
  { id: 'investigate', label: 'Investigate', summary: 'Characterise ground and ore.' },
  { id: 'evaluate', label: 'Evaluate', summary: 'Prove technical and economic viability.' },
  { id: 'design', label: 'Design', summary: 'Engineer the mine and its schedule.' },
  { id: 'operate', label: 'Operate', summary: 'Control grade, cost and risk.' },
  { id: 'sustain', label: 'Sustain', summary: 'Protect people, land and licence.' },
];

export type Service = {
  slug: string;
  title: string;
  short: string;
  icon: string;
  stage: Stage;
  sectors: SectorId[];
  intro: string;
  overview: string[];
  capabilities: string[];
  deliverables: string[];
  outcomes: { label: string; body: string }[];
};

export const services: Service[] = [
  {
    slug: 'mineral-exploration',
    title: 'Mineral Exploration',
    short: 'Geophysics, geochemistry and precision drilling to discover and define mineral resources.',
    icon: 'compass',
    stage: 'explore',
    sectors: ['solid-minerals', 'mining'],
    intro:
      'Strategic exploration programmes that combine geophysical surveys, geochemical analysis and precision drilling to turn prospective ground into defined, investable resources.',
    overview: [
      'Exploration capital is finite and the ground is unforgiving. We design programmes that reduce uncertainty at each step — so every metre drilled earns its place in the resource model.',
      'Our geologists have explored for uranium and rare earth elements and have supported the development of lithium, bitumen, gold, lead–zinc, barytes, iron ore and coal across Nigeria and the wider continent.',
    ],
    capabilities: [
      'Desktop studies, target generation and licence-area prioritisation',
      'Ground and airborne geophysical survey design and interpretation',
      'Soil, stream-sediment and rock-chip geochemistry',
      'Diamond, RC and auger drilling programme design and supervision',
      'Core logging, sampling protocols and QA/QC',
      'Geological and structural mapping',
    ],
    deliverables: ['Exploration strategy & budget', 'Drill-hole database', 'Geological model', 'Exploration results report'],
    outcomes: [
      { label: 'Focused spend', body: 'Programmes staged on decision gates, not fixed metres.' },
      { label: 'Defensible data', body: 'QA/QC and chain-of-custody built in from the first sample.' },
    ],
  },
  {
    slug: 'mining-geotechnical-investigations',
    title: 'Mining Geotechnical Investigations',
    short: 'Field investigation, rock mass characterisation and 3D geotechnical models for safe, efficient mines.',
    icon: 'layers',
    stage: 'investigate',
    sectors: ['mining', 'civil'],
    intro:
      'An efficient, effective geotechnical study is an integral component of any proposed mine. We design, supervise and interpret investigations that give engineers confidence in the ground they are building in.',
    overview: [
      'We bring significant experience in the design, implementation, supervision and interpretation of geotechnical investigations — with a clear understanding of the lithological, structural, alteration and hydrogeological controls on rock behaviour.',
      'The result is a geotechnical model that slope designers, underground engineers and planners can rely on, from scoping through to operations.',
    ],
    capabilities: [
      'Design and management of geotechnical investigation programmes',
      'Geotechnical core logging, mapping and databasing',
      'Structural geology interpretation',
      'Rock mass classification and characterisation',
      'Preparation of 3D geotechnical models',
      'Pit slope and underground stability analysis',
    ],
    deliverables: ['Investigation plan & specification', 'Geotechnical database', '3D geotechnical model', 'Design recommendations report'],
    outcomes: [
      { label: 'Safer excavations', body: 'Stability designs grounded in measured rock mass properties.' },
      { label: 'Steeper, smarter slopes', body: 'Optimised angles reduce strip ratio without adding risk.' },
    ],
  },
  {
    slug: 'laboratory-plant-testwork',
    title: 'Laboratory & Plant Testwork',
    short: 'Mineralogical and metallurgical testwork programmes, from bench scale to pilot plant.',
    icon: 'flask',
    stage: 'investigate',
    sectors: ['solid-minerals', 'mining'],
    intro:
      'We design, manage and evaluate every stage of a testwork programme — from laboratory characterisation through to pilot plant operation — to establish how an orebody will actually behave in processing.',
    overview: [
      'Recovery assumptions drive project value. Our team examines the mineralogical and metallurgical characteristics of each deposit and translates the results into process design criteria that hold up under scrutiny.',
    ],
    capabilities: [
      'Sample selection and representativity reviews',
      'Mineralogical characterisation',
      'Comminution, beneficiation and recovery testwork',
      'Programme management with accredited laboratories',
      'Pilot plant design, supervision and evaluation',
      'Process design criteria and flowsheet input',
    ],
    deliverables: ['Testwork programme design', 'Interpreted results report', 'Process design criteria'],
    outcomes: [
      { label: 'Realistic recoveries', body: 'Assumptions tested at the right scale before capital is committed.' },
      { label: 'Fewer surprises', body: 'Variability understood across ore types, not just a composite.' },
    ],
  },
  {
    slug: 'mining-feasibility-studies',
    title: 'Mining Feasibility Studies',
    short: 'Scoping, pre-feasibility and feasibility studies for open pit and underground projects.',
    icon: 'chart',
    stage: 'evaluate',
    sectors: ['mining', 'solid-minerals'],
    intro:
      'Independent, bankable studies that tell owners and investors what a project is really worth — and what it will take to build.',
    overview: [
      'We prepare scoping, pre-feasibility and feasibility studies for both underground and open pit mines, integrating geology, geotechnics, mining, processing, infrastructure, environment and economics into one coherent case.',
      'Our studies are structured to support investment decisions and engagement with regulators and financiers.',
    ],
    capabilities: [
      'Scoping studies and preliminary economic assessments',
      'Pre-feasibility and definitive feasibility studies',
      'Mining method and trade-off studies',
      'Capital and operating cost estimation',
      'Financial modelling and sensitivity analysis',
      'Risk registers and mitigation plans',
    ],
    deliverables: ['Study report', 'Financial model', 'Risk register', 'Implementation plan'],
    outcomes: [
      { label: 'Investor confidence', body: 'Transparent assumptions that withstand due diligence.' },
      { label: 'Clear decisions', body: 'Trade-offs quantified so owners can choose with conviction.' },
    ],
  },
  {
    slug: 'open-pit-mine-design',
    title: 'Open Pit Mine Design, Planning & Engineering',
    short: 'Pit optimisation, detailed design, production scheduling and equipment selection.',
    icon: 'mountain',
    stage: 'design',
    sectors: ['mining'],
    intro:
      'From economic pit shells to detailed haul-road layouts, we engineer open pit mines that are safe to operate and resilient to price cycles.',
    overview: [
      'Our engineers deliver open pit design across scoping, pre-feasibility and feasibility studies as well as for operating mines — covering economic evaluation, detailed design and layouts, production scheduling and equipment selection.',
    ],
    capabilities: [
      'Pit optimisation and economic evaluation',
      'Detailed pit, ramp and waste-dump design',
      'Life-of-mine and short-term production scheduling',
      'Drill-and-blast design',
      'Mining fleet and equipment selection',
      'Operating cost modelling',
    ],
    deliverables: ['Pit designs & layouts', 'Production schedule', 'Equipment list', 'Mining cost model'],
    outcomes: [
      { label: 'Higher NPV', body: 'Sequencing that brings value forward and defers waste.' },
      { label: 'Operable plans', body: 'Designs that respect real equipment, geotechnics and people.' },
    ],
  },
  {
    slug: 'underground-mine-design',
    title: 'Underground Mine Design, Planning & Engineering',
    short: 'Mining method selection, development layouts and stability analysis for underground operations.',
    icon: 'tunnel',
    stage: 'design',
    sectors: ['mining'],
    intro:
      'Underground design drawn from years of first-hand underground engineering and operating experience — not just software outputs.',
    overview: [
      'We select mining methods to suit the orebody and ground conditions, then design development, stoping, ventilation and support systems that can be built and operated safely.',
    ],
    capabilities: [
      'Mining method selection',
      'Development and stope layout design',
      'Underground stability analysis and ground support design',
      'Ventilation and services planning',
      'Production scheduling',
      'Operational reviews and audits',
    ],
    deliverables: ['Mine design & layouts', 'Ground support standards', 'Schedule & cost model'],
    outcomes: [
      { label: 'Safer workings', body: 'Support designed to the ground, not to habit.' },
      { label: 'Reliable ramp-up', body: 'Development rates that the crews can actually achieve.' },
    ],
  },
  {
    slug: 'grade-control',
    title: 'Grade Control',
    short: 'Ore–waste delineation, sampling and reconciliation to protect head grade and margin.',
    icon: 'target',
    stage: 'operate',
    sectors: ['mining'],
    intro:
      'Grade control is where the resource model meets the excavator. We help operations send the right material to the right place, every shift.',
    overview: [
      'Small misallocations compound into large losses. We implement grade control systems — sampling, modelling, mark-out and reconciliation — that improve head grade and make performance measurable.',
    ],
    capabilities: [
      'Grade control drilling and sampling design',
      'Short-range modelling and ore-block definition',
      'Dig-line mark-out and dilution control',
      'Mine-to-mill reconciliation',
      'Stockpile management',
      'Training of site geology teams',
    ],
    deliverables: ['Grade control procedures', 'Reconciliation reports', 'Site team training'],
    outcomes: [
      { label: 'Protected margin', body: 'Less dilution, less ore loss, more metal to the plant.' },
      { label: 'Measured performance', body: 'Reconciliation that shows where value is gained or lost.' },
    ],
  },
  {
    slug: 'oil-gas-exploration',
    title: 'Oil & Gas Exploration Consultancy',
    short: 'Upstream exploration expertise and technical consultancy from licensed engineers and geologists.',
    icon: 'drop',
    stage: 'explore',
    sectors: ['oil-gas'],
    intro:
      'Licensed engineers and geologists providing advanced exploration expertise and technical consultancy for upstream oil and gas projects.',
    overview: [
      'Our principal geoscientists bring decades of combined experience across the oil and gas and solid minerals sectors, supporting operators from basin evaluation to drilling decisions.',
    ],
    capabilities: [
      'Basin and play evaluation',
      'Subsurface data review and interpretation',
      'Well planning support and wellsite geology',
      'Geomechanics and wellbore stability input',
      'Technical due diligence',
      'Regulatory and reporting support',
    ],
    deliverables: ['Technical evaluation report', 'Prospect inventory', 'Due-diligence findings'],
    outcomes: [
      { label: 'Sharper prospects', body: 'Independent interpretation that challenges assumptions.' },
      { label: 'Local insight', body: 'Experience of regional geology and operating realities.' },
    ],
  },
  {
    slug: 'environment-compliance',
    title: 'Environment, Safety & Compliance',
    short: 'Proactive compliance, environmental responsibility and capacity development for profitable mining.',
    icon: 'leaf',
    stage: 'sustain',
    sectors: ['mining', 'solid-minerals', 'oil-gas', 'civil'],
    intro:
      'Safe environments and profitable mining are not in conflict. We help operators protect people and land while keeping their licence — and their margins — secure.',
    overview: [
      'Through proactive compliance management, robust technical support, environmental responsibility and capacity development, we deliver reliable, data-driven and sustainable solutions that support the growth of Nigeria’s solid minerals sector.',
    ],
    capabilities: [
      'Regulatory compliance management',
      'Environmental and social impact support',
      'Mine closure and rehabilitation planning',
      'Health and safety systems and audits',
      'Community engagement support',
      'Training and capacity development',
    ],
    deliverables: ['Compliance roadmap', 'Audit findings & actions', 'Training programmes'],
    outcomes: [
      { label: 'Licence to operate', body: 'Obligations tracked and met before they become issues.' },
      { label: 'Stronger teams', body: 'Local capability that stays when consultants leave.' },
    ],
  },
  {
    slug: 'mining-data-risk',
    title: 'Mining Data & Risk Management',
    short: 'Databases, technical audits and risk frameworks that de-risk projects for investors.',
    icon: 'database',
    stage: 'evaluate',
    sectors: ['mining', 'solid-minerals'],
    intro:
      'Investors fund certainty. We organise technical data, audit its quality and frame project risk in terms decision-makers can act on.',
    overview: [
      'De-risking Nigeria’s mining sector is essential to improving investment flow. We build the data foundations and risk frameworks that let owners demonstrate a project’s quality — and let financiers believe it.',
    ],
    capabilities: [
      'Geological and geotechnical database design',
      'Data validation, QA/QC audits and migration',
      'Independent technical reviews',
      'Project risk identification and quantification',
      'Investor and lender technical due diligence',
      'Reporting aligned to international codes',
    ],
    deliverables: ['Validated database', 'Technical audit report', 'Risk register'],
    outcomes: [
      { label: 'Bankable data', body: 'One source of truth that survives due diligence.' },
      { label: 'Priced risk', body: 'Uncertainty quantified rather than discounted away.' },
    ],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
