export type EtsyCsvRow = {
  listingId: string;
  title: string;
  url: string;
  productName: string;
};

// Guard exported CSV against spreadsheet formula injection in seller-controlled text fields.
export const csvCell = (value: string): string => {
  const text = String(value ?? '');
  const safe = /^[\u0000-\u0020]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const makeEtsyCatalogCsv = (rows: EtsyCsvRow[]): string => {
  const headers = ['Etsy Listing ID', 'Etsy Title', 'Etsy URL', 'mybabyshire.com Product'];
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push([row.listingId, row.title, row.url, row.productName].map(csvCell).join(','));
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
};
