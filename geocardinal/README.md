# Geocardinal Engineering: website redesign

A redesign and rebuild of [geocardinalengineering.com](https://www.geocardinalengineering.com/), the website of Geocardinal Engineering Services Limited, an Abuja-based geotechnical, mining and energy engineering consultancy.

Built with [Astro](https://astro.build): static HTML, scoped CSS per component and a small amount of vanilla TypeScript. There is no client framework, and pages ship almost no JavaScript.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve the production build
npm run check     # type and template diagnostics
```

---

## 1. What the original site does

**Purpose and audience.** The site presents a technical consultancy to mining operators, investors, oil & gas companies, government bodies and job seekers. Its job is to show credibility, explain the services and turn visitors into enquiries or applications.

**Information architecture (original):** Home · About Us · Services (one page per service: mining geotechnical investigations, mining feasibility studies, open pit and underground mine design, laboratory & plant testwork, grade control, and safe environment & profitable mining) · Team · Careers (individual "We are hiring" posts) · Contact, plus news/report posts.

**What works:** the content is substantial and specific. The four sectors (Oil & Gas, Solid Minerals, Civil Engineering, Mining), the named commodities, the regional offices and the senior leadership are real proof points.

**What holds it back:**

- Services are a flat list of posts with no structure showing how they relate.
- Hiring and news are blog posts, so open roles are hard to scan and apply for.
- Trust signals (founding year, offices, sectors, commodities) are buried in prose.
- The calls to action are generic, and nothing guides a visitor from reading to enquiring.
- The visual identity is template-like and doesn't reflect the geotechnical domain.

## 2. Design direction

**"Engineering certainty beneath the surface."** The visual language comes from the firm's own domain, not from stock imagery:

- **Topographic contours.** They are generated deterministically at build time (`src/lib/topo.ts`), drawn in on load, and used throughout as a quiet signature.
- **The borehole log.** The hero's centrepiece is a stratigraphic log (depth, strata, RQD, rock mass rating), so the site shows the work instead of describing it.
- **Official brand.** The real Geocardinal logo (`public/brand/`), with the palette sampled from it: red `#C41026`, green `#2E9E6A`, yellow `#F5EC80` and black. A thin red–yellow–green rule runs along the top of the header and through the section labels.
- **Mono data labels** (IBM Plex Mono) for coordinates, stages and metadata. They give the site the feel of a technical instrument.

**Key structural improvements**

| Original | Redesign |
|---|---|
| Flat list of service posts | Services mapped to a **6-stage project lifecycle** (Explore → Investigate → Evaluate → Design → Operate → Sustain), with a mega-menu grouped by stage |
| No way to narrow down services | **Sector filters and search** with a live result count, URL state (`?sector=`) and an empty state |
| Thin service pages | Each service page has an overview, capabilities, a deliverables table, outcomes, its position in the lifecycle, related services, previous/next links and a sticky enquiry card |
| Jobs as blog posts | **Careers page** with expandable role cards and an application form; choosing "Apply for this role" pre-selects the role |
| Basic contact page | Validated enquiry form (pre-fills the service when you arrive from a service page), "what happens next" steps and an office directory |
| Trust signals buried in prose | Stats, commodity chips, office cards and leadership profiles shown up front |

## 3. Design system

All values are tokens in `src/styles/tokens.css`. The shared primitives are in `src/styles/global.css`.

| Area | Tokens / primitives |
|---|---|
| **Colour** | `cardinal` (brand accent; `cardinal-600` is the AA-safe text and hover colour), `laterite` (secondary earth tone for data and strata), `ink` (dark surfaces), `stone` (warm neutrals), plus success, warning, danger and info. Semantic roles such as `--bg`, `--surface`, `--text-muted`, `--border` and `--accent` sit on top. |
| **Type** | Inter Tight for display, Inter for body and IBM Plex Mono for labels. Fluid scale `--fs-xs` to `--fs-5xl` using `clamp()`. Weights 400/500/600/700. Tight negative tracking on headings. |
| **Space** | A 4px base scale (`--space-1` to `--space-32`), fluid `--section-y` and `--gutter`, and a 76rem container. |
| **Radius** | `xs 4` · `sm 6` (buttons, inputs) · `md 10` · `lg 14` (cards) · `xl 20` (feature panels) · `full` (chips) |
| **Depth** | `--shadow-xs` to `--shadow-lg`, plus a focus ring |
| **Motion** | `--ease-out`, durations of 140, 240 and 520ms. Everything respects `prefers-reduced-motion`. |
| **Components** | `.btn` (primary, secondary, ghost-dark; sm and lg sizes; loading and disabled states), `.badge` and `.chip`, `.card` (interactive variant with a stretched link), `.field`, `.input`, `.select`, `.textarea` and `.checkbox` (with hint, error and invalid states), `.alert` (success, error, info), `.table`, `.icon-tile`, `.eyebrow`, `.prose`, and a modal (`<dialog>`) |

## 4. Interaction and states

- **Page transitions.** Native cross-document View Transitions, with no JavaScript router.
- **Header.** Transparent over dark heroes. It turns into a frosted bar on scroll. The Services mega-menu opens on hover or click and closes with Esc.
- **Mobile drawer.** Staggered entrance, focus trap, Esc to close and body scroll lock.
- **Scroll reveal.** A one-off fade-up driven by IntersectionObserver. Content is visible without JavaScript.
- **Forms.** Validation on blur and live re-validation once a field has been touched, a summary of errors with focus moved to the first invalid field, a loading spinner on submit, a success panel, an error alert, a honeypot field and a character counter.
- **Empty states.** No matching services; no articles; no open roles.
- **Team profiles.** Open in an animated `<dialog>`, which closes on the backdrop or Esc and returns focus to the trigger.
- **Feedback.** Hover and press feedback on every interactive element and visible `:focus-visible` rings.

## 5. Accessibility, SEO and performance

- A skip link, landmarks, a breadcrumb `nav`, `aria-current`, `aria-expanded`, and `aria-invalid`/`aria-describedby` on fields. Status messages are announced with `aria-live`. Colour contrast is checked against WCAG AA.
- A unique title, meta description, canonical URL and Open Graph tags on every page.
- JSON-LD: `ProfessionalService` (the company), `BreadcrumbList`, `Service`, `Article` and `JobPosting`.
- `sitemap-index.xml` is generated by `@astrojs/sitemap`, and `robots.txt` is included.
- Pages are static HTML. Critical CSS is inlined. There are no image downloads: every graphic is SVG or CSS.

## 6. Adding photos

Every photo slot is listed in `src/data/media.ts`: the hero background, the five-image "In the field" gallery on the homepage, the About page banner and one banner per service. To add a photo:

1. Put the image in `public/images/`, for example `public/images/drill-rig.jpg`. JPG or WebP, at least 1600px wide.
2. In `src/data/media.ts`, set that slot's `src` to `'/images/drill-rig.jpg'`, and update the `alt` text and `caption` if needed.

Any slot without a photo shows a branded red, green, yellow or black panel, so the site never shows a broken image.

## 7. Forms backend

Set `PUBLIC_FORM_ENDPOINT` (in `.env` or the hosting environment) to any endpoint that accepts a JSON POST, such as Formspree, Basin or a serverless function. When it is not set, the forms still validate fully and then open the visitor's email app with the enquiry already written and addressed to `info@geocardinalengineering.com`. The success message says which of the two happened.

## 8. Project structure

```
src/
  data/         # content: site facts, services, team, careers, insights
  components/   # Header, Footer, Logo, Icon, Topo, BoreholeLog, PageHero,
                # SectionHeader, ServiceCard, InsightCard, CtaBand, FormField
  layouts/      # Base.astro (SEO, fonts, JSON-LD, reveal script)
  lib/topo.ts   # deterministic contour generator
  scripts/      # forms.ts (validation and submission states)
  styles/       # tokens.css, global.css
  pages/        # index, about, team, careers, contact, 404,
                # services/[slug], insights/[slug]
```

To edit content, change the files in `src/data/`. Pages and navigation update automatically.

## 9. Content notes for the client

The original site could not be fetched from the build environment, so the content was rebuilt from its publicly indexed pages. Before launch:

- **Check the facts:** phone numbers, address, office list and leadership titles in `src/data/site.ts` and `src/data/team.ts`.
- **Replace the article bodies** in `src/data/insights.ts` with the full original text. The titles and themes match the original articles, but the bodies are condensed rewrites.
- **Replace the illustrative figures:** the borehole log values in the hero are labelled "Illustrative data". Swap in a real (anonymised) log if you have one.
- **Add real photos:** see section 6. Leadership portraits currently use initials.
- **Logo file:** the current logo is a 378×102 PNG. An SVG or a larger PNG (at least 1000px wide) would look sharper on high-resolution screens.
