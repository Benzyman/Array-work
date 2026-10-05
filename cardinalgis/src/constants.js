// Pick-lists shown in the app. Edit these to suit your team.
// Shared by the server and the offline demo.
(function (root, data) {
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.CardinalConstants = data;
})(typeof self !== 'undefined' ? self : this, {
  MINERALS: [
    'Gold', 'Lead/Zinc', 'Tin (Cassiterite)', 'Columbite', 'Tantalite', 'Lithium',
    'Barite', 'Limestone', 'Iron Ore', 'Coal', 'Bitumen', 'Gemstones', 'Kaolin',
    'Gypsum', 'Granite', 'Marble', 'Bentonite', 'Feldspar', 'Mica', 'Talc',
    'Silica Sand', 'Laterite', 'Other',
  ],
  FEATURE_TYPES: [
    'Mine site', 'Pit / Shaft', 'Sample point', 'Borehole', 'Outcrop',
    'Beacon / Pillar', 'Camp / Office', 'Processing site', 'Access point', 'Other',
  ],
  STATUSES: ['Exploration', 'Active', 'Suspended', 'Abandoned', 'Artisanal', 'Proposed'],
  // Who holds the land. "Not yet known" is the default until it has been checked.
  OWNERSHIP: ['Government-owned', 'Privately owned', 'Untouched / unclaimed', 'Not yet known'],
  // Mineral title types issued by the Nigerian Mining Cadastre Office (MCO).
  LICENCE_TYPES: [
    'Reconnaissance Permit (RP)',
    'Exploration Licence (EL)',
    'Small Scale Mining Lease (SSML)',
    'Mining Lease (ML)',
    'Quarry Lease (QL)',
    'Water Use Permit (WUP)',
    'Field block / Survey area',
  ],
});
