/**
 * Photography slots.
 *
 * Drop image files into `public/images/` and set `src` below (e.g. '/images/drill-rig.jpg').
 * Any slot without a `src` renders a branded fallback panel, so the site
 * always looks finished. Recommended: JPG/WebP, at least 1600px wide.
 */
export type Media = {
  src?: string;
  alt: string;
  caption: string;
  /** Fallback tint when no photo is set */
  tint?: 'red' | 'green' | 'yellow' | 'ink';
};

export const heroImage: Media = {
  src: undefined,
  alt: 'Geocardinal engineers on a mine site',
  caption: 'Field operations',
  tint: 'ink',
};

export const fieldGallery: Media[] = [
  { alt: 'Drilling rig on an exploration site', caption: 'Exploration drilling', tint: 'red' },
  { alt: 'Geologist logging drill core', caption: 'Core logging', tint: 'yellow' },
  { alt: 'Open pit mine benches', caption: 'Open pit design', tint: 'green' },
  { alt: 'Samples being prepared in the laboratory', caption: 'Laboratory testwork', tint: 'ink' },
  { alt: 'Geocardinal team on site', caption: 'Our team on site', tint: 'red' },
];

export const aboutImage: Media = {
  alt: 'Geocardinal head office team in Abuja',
  caption: 'Head office, Abuja',
  tint: 'green',
};

/** Optional per-service banner images, keyed by service slug. */
export const serviceImages: Record<string, Media> = {
  'mineral-exploration': { alt: 'Exploration drilling programme', caption: 'Exploration drilling', tint: 'red' },
  'mining-geotechnical-investigations': { alt: 'Geotechnical core logging', caption: 'Geotechnical logging', tint: 'yellow' },
  'laboratory-plant-testwork': { alt: 'Metallurgical testwork in the laboratory', caption: 'Laboratory testwork', tint: 'ink' },
  'mining-feasibility-studies': { alt: 'Engineers reviewing a feasibility study', caption: 'Feasibility study', tint: 'green' },
  'open-pit-mine-design': { alt: 'Open pit mine benches and haul road', caption: 'Open pit operations', tint: 'green' },
  'underground-mine-design': { alt: 'Underground mine development drive', caption: 'Underground development', tint: 'ink' },
  'grade-control': { alt: 'Grade control sampling on the pit floor', caption: 'Grade control', tint: 'yellow' },
  'oil-gas-exploration': { alt: 'Upstream oil and gas exploration site', caption: 'Upstream exploration', tint: 'ink' },
  'environment-compliance': { alt: 'Rehabilitated land around a mine site', caption: 'Environmental compliance', tint: 'green' },
  'mining-data-risk': { alt: 'Geological data on screen', caption: 'Data & risk', tint: 'red' },
};
