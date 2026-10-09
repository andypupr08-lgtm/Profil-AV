/**
 * Master list of 34 Indonesian Provinces in official BPBPK / BPPW sequence (Aceh to Papua Barat)
 */
export const MASTER_34_PROVINCES: string[] = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Riau',
  'Jambi',
  'Kepulauan Riau',
  'Kepulauan Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'Banten',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Gorontalo',
  'Sulawesi Selatan',
  'Sulawesi Tengah',
  'Sulawesi Tenggara',
  'Sulawesi Barat',
  'Sulawesi Utara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat'
];

/**
 * Normalizes and cleans province name (e.g. "BPPW ACEH", "BPBPK SUMATERA UTARA" -> "Aceh", "Sumatera Utara")
 */
export function normalizeProvinceName(raw: string): string {
  if (!raw) return '';
  let trimmed = String(raw).trim();
  // Strip common balai / agency prefixes
  trimmed = trimmed
    .replace(/^(BPPW|BPBPK|BP2JK|Balai|Provinsi|Prov\.)\s+/i, '')
    .trim();

  // Find exact case-insensitive match in MASTER_34_PROVINCES
  const lower = trimmed.toLowerCase();
  for (const master of MASTER_34_PROVINCES) {
    const mLower = master.toLowerCase();
    if (mLower === lower) return master;
  }

  // Find partial match
  for (const master of MASTER_34_PROVINCES) {
    const mLower = master.toLowerCase();
    if (lower.includes(mLower) || mLower.includes(lower)) {
      return master;
    }
  }

  return trimmed;
}

/**
 * Get index of province in BPBPK sequence (0 = Aceh ... 33 = Papua Barat)
 */
export function getProvinceBPBPKIndex(provName: string): number {
  if (!provName) return 999;
  const normalized = normalizeProvinceName(provName);
  const idx = MASTER_34_PROVINCES.findIndex(
    (p) => p.toLowerCase() === normalized.toLowerCase()
  );
  return idx !== -1 ? idx : 999;
}

/**
 * Sorts an array of province names according to the BPBPK sequence (Aceh to Papua Barat)
 */
export function sortProvincesByBPBPK(provList: string[]): string[] {
  return [...provList].sort((a, b) => {
    const idxA = getProvinceBPBPKIndex(a);
    const idxB = getProvinceBPBPKIndex(b);
    if (idxA !== idxB) return idxA - idxB;
    return a.localeCompare(b, 'id');
  });
}
