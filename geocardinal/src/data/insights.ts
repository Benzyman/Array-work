/**
 * Insight articles. Bodies are authored HTML (trusted, in-repo content).
 * Titles and themes mirror articles published on the original website;
 * replace bodies with the full original text where it is available.
 */
export type Insight = {
  slug: string;
  title: string;
  category: 'Report' | 'Perspective' | 'In the press';
  excerpt: string;
  readingTime: string;
  body: string;
};

export const insights: Insight[] = [
  {
    slug: 'operational-challenges-nigerian-mining',
    title: 'Key operational challenges in Nigerian mining projects — and how to manage them',
    category: 'Report',
    excerpt:
      'Infrastructure, data quality, security, regulation and skills: a practitioner’s view of what slows Nigerian mining projects down, and the strategies that keep them moving.',
    readingTime: '6 min read',
    body: `
<p>Nigeria’s solid minerals endowment is broad and largely under-developed. Yet the gap between a promising licence and a productive mine is wide — and it is usually operational, not geological. Drawing on our project work, this report sets out the challenges we encounter most often and the strategies we use to manage them.</p>
<h2>1. Limited and inconsistent geological data</h2>
<p>Many projects begin with historical data of uncertain quality: unvalidated assays, missing collar surveys, or logging that cannot be reconciled with core. Decisions made on that foundation carry hidden risk.</p>
<ul>
  <li>Audit and validate legacy data before relying on it.</li>
  <li>Establish QA/QC and chain-of-custody protocols from the first new sample.</li>
  <li>Centralise data in a single, controlled database.</li>
</ul>
<h2>2. Infrastructure and logistics</h2>
<p>Access roads, power and water are frequently inadequate at remote sites, inflating both capital and operating costs. Logistics should be designed into studies early rather than treated as an afterthought, and staged development can match infrastructure investment to proven production.</p>
<h2>3. Regulatory compliance</h2>
<p>Licence obligations, environmental requirements and community development agreements are increasingly enforced. Proactive compliance management — tracking obligations, reporting on time and engaging regulators early — protects the licence to operate.</p>
<h2>4. Skills and capacity</h2>
<p>Experienced mining professionals are scarce. Sustainable projects invest in training local teams, pairing them with senior specialists so that capability remains on site long after consultants leave.</p>
<h2>5. Ground conditions and safety</h2>
<p>Weathered profiles, structural complexity and groundwater can turn an apparently simple excavation into a hazard. Targeted geotechnical investigation and stability analysis — scaled to the project stage — are among the most cost-effective risk controls available.</p>
<blockquote>Operational risk in Nigerian mining is manageable. What it demands is discipline: good data, honest studies and teams equipped to act on them.</blockquote>
<h2>Our perspective</h2>
<p>Through compliance management, robust technical support, environmental responsibility and capacity development, Geocardinal helps operators move from licence to production with fewer surprises — supporting the growth of Nigeria’s solid minerals sector.</p>
`,
  },
  {
    slug: 'de-risking-mining-investment',
    title: '“We need to de-risk the mining sector for improved investment flow”',
    category: 'In the press',
    excerpt:
      'Why credible technical data, transparent studies and stable regulation are the fastest route to unlocking capital for Nigeria’s mining sector.',
    readingTime: '4 min read',
    body: `
<p>Capital flows to certainty. For Nigeria’s mining sector to attract the investment it needs, projects must be able to demonstrate — with evidence — that their geology, engineering and economics are sound.</p>
<h2>Where the risk sits</h2>
<p>Investors consistently point to the same concerns: insufficient exploration data, studies that would not withstand due diligence, uncertainty around permitting, and the practical challenges of operating at remote sites. Each of these is a reason to discount a project’s value — or to walk away.</p>
<h2>What de-risking looks like</h2>
<ul>
  <li><strong>Better data.</strong> Systematic exploration, rigorous QA/QC and validated databases give investors something they can test.</li>
  <li><strong>Credible studies.</strong> Scoping, pre-feasibility and feasibility work prepared to recognised standards, with assumptions stated openly.</li>
  <li><strong>Engineering certainty.</strong> Geotechnical and metallurgical testwork that removes the largest unknowns before capital is committed.</li>
  <li><strong>Regulatory clarity.</strong> Proactive compliance and early engagement with regulators and host communities.</li>
</ul>
<blockquote>When a project’s risks are measured rather than guessed, they can be priced — and priced risk is investable risk.</blockquote>
<p>Geocardinal works with owners and financiers to build exactly that foundation: independent technical reviews, risk registers and studies that make the case for investment clearly and honestly.</p>
`,
  },
  {
    slug: 'safe-environment-profitable-mining',
    title: 'Safe environment, profitable mining',
    category: 'Perspective',
    excerpt:
      'Environmental responsibility and strong margins are not a trade-off. Well-run mines are safer, cleaner and more profitable — and they keep their licence to operate.',
    readingTime: '3 min read',
    body: `
<p>It is still common to hear environmental and safety obligations described as a cost of doing business. In our experience the opposite is true: the best-performing operations treat them as part of how the business makes money.</p>
<h2>Safety is productivity</h2>
<p>Unstable ground, poorly designed haul roads and inadequate ground support do not only injure people — they stop production. Investing in geotechnical understanding and sound design reduces incidents and downtime together.</p>
<h2>Environment is licence</h2>
<p>Water management, waste handling and progressive rehabilitation protect the land and the communities around a mine. They also protect the operator’s licence, its reputation and its access to finance.</p>
<h2>Capacity is continuity</h2>
<p>Trained local teams who understand why procedures exist follow them. Capacity development is the most durable compliance investment an operator can make.</p>
<blockquote>A safe environment and a profitable mine are the same objective, measured in different units.</blockquote>
<p>We support operators with compliance management, HSE systems and audits, closure planning and training — delivering practical, data-driven solutions that keep projects safe and sustainable.</p>
`,
  },
];

export const getInsight = (slug: string) => insights.find((i) => i.slug === slug);
