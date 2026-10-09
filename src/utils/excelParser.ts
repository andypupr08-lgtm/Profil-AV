import * as XLSX from 'xlsx';
import { ProfilItem, SummaryMatrixRow } from '../types';
import { normalizeProvinceName } from './provinces';

/**
 * Checks if a sheet name is a valid numeric year sheet (e.g., "2025", "2026", "2027")
 * Ignores sheet names like "Raw Data 2025", "Raw Data 2026", "Template", etc.
 */
export function isYearSheet(sheetName: string): boolean {
  const trimmed = sheetName.trim();
  return /^\d+$/.test(trimmed) || /raw\s*data/i.test(trimmed) || /\b(19|20)\d{2}\b/.test(trimmed);
}

/**
 * Helper to normalize key names for flexible object field lookups
 */
function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Flexible provinsi extractor for Excel rows (supports BPBPK, BPPW, Balai, and Provinsi columns)
 */
function extractProvinsiVal(row: Record<string, any>): string {
  if (row['bpbpk'] !== undefined && row['bpbpk'] !== '') return normalizeProvinceName(String(row['bpbpk']));
  if (row['bppw'] !== undefined && row['bppw'] !== '') return normalizeProvinceName(String(row['bppw']));
  if (row['provinsi'] !== undefined && row['provinsi'] !== '') return normalizeProvinceName(String(row['provinsi']));
  if (row['nama_provinsi'] !== undefined && row['nama_provinsi'] !== '') return normalizeProvinceName(String(row['nama_provinsi']));
  if (row['prov'] !== undefined && row['prov'] !== '') return normalizeProvinceName(String(row['prov']));

  const keys = Object.keys(row);
  for (const k of keys) {
    const kNorm = k.toLowerCase().replace(/_/g, ' ');
    if (
      kNorm.includes('bpbpk') ||
      kNorm.includes('bppw') ||
      kNorm.includes('provinsi') ||
      kNorm === 'prov' ||
      kNorm.includes('balai')
    ) {
      const val = String(row[k] || '').trim();
      if (val && val.toLowerCase() !== 'undefined' && val.toLowerCase() !== 'null') {
        return normalizeProvinceName(val);
      }
    }
  }
  return '';
}

function parseCleanNum(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  const s = String(val).trim().replace(/,/g, '.');
  const num = Number(s);
  if (!isNaN(num)) return num;
  const match = s.match(/-?\d+(\.\d+)?/);
  if (match) {
    const parsed = parseFloat(match[0]);
    if (!isNaN(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Flexible numeric extractor for matrix sheet columns
 */
function getFlexibleNumVal(
  row: Record<string, any>,
  candidateKeys: string[],
  requiredKeywords: string[],
  isIbm: boolean = false
): number {
  // 1. Check exact candidate keys in row
  for (const key of candidateKeys) {
    const num = parseCleanNum(row[key]);
    if (num !== undefined) {
      return num;
    }
  }

  // 2. Check keyword match across all object keys
  const keys = Object.keys(row);
  for (const k of keys) {
    const kNorm = k.toLowerCase().replace(/_/g, ' ');
    if (requiredKeywords.every((kw) => kNorm.includes(kw))) {
      // If searching for target, do NOT match % keterisian or persen columns
      if (
        requiredKeywords.includes('target') &&
        (kNorm.includes('%') || kNorm.includes('persen') || (kNorm.includes('keterisian') && !kNorm.includes('target')))
      ) {
        continue;
      }
      const num = parseCleanNum(row[k]);
      if (num !== undefined) return num;
    }
  }

  // 3. Fallback for XLSX merged column suffixes (_1, .1, _2)
  if (isIbm) {
    for (const k of keys) {
      if (k.endsWith('_1') || k.endsWith('.1') || k.endsWith('_2') || k.endsWith('.2')) {
        const kNorm = k.toLowerCase().replace(/_/g, ' ');
        const checkKeywords = requiredKeywords.filter((kw) => kw !== 'ibm');
        if (checkKeywords.length > 0 && checkKeywords.every((kw) => kNorm.includes(kw))) {
          if (requiredKeywords.includes('target') && (kNorm.includes('%') || kNorm.includes('persen'))) {
            continue;
          }
          const num = parseCleanNum(row[k]);
          if (num !== undefined) return num;
        }
      }
    }
  }

  return 0;
}

/**
 * Flexible percentage extractor for matrix sheet % Keterisian columns
 */
function parsePercentValue(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') {
    return val <= 1 && val > 0 ? val * 100 : val;
  }
  const s = String(val).trim().replace('%', '').replace(',', '.');
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  return num <= 1 && num > 0 && !String(val).includes('%') ? num * 100 : num;
}

function getFlexiblePercentVal(
  row: Record<string, any>,
  candidateKeys: string[],
  requiredKeywords: string[],
  isIbm: boolean = false
): number | undefined {
  // 1. Direct candidate keys lookup
  for (const key of candidateKeys) {
    if (row[key] !== undefined && row[key] !== '' && row[key] !== null) {
      return parsePercentValue(row[key]);
    }
  }

  // 2. Keyword check across all row keys
  // CRITICAL: Exclude non-percentage columns (target, disetujui, perbaikan, belum, sudah)
  // to avoid matching columns like 'keterisian_ibm_target_sesuai_iemon'
  const excludedKeywords = ['target', 'disetujui', 'perbaikan', 'revisi', 'belum', 'sudah'];
  const keys = Object.keys(row);
  for (const k of keys) {
    const kNorm = k.toLowerCase().replace(/_/g, ' ');
    const hasRequired = requiredKeywords.every((kw) => kNorm.includes(kw));
    const hasExcluded = excludedKeywords.some((ew) => kNorm.includes(ew));
    if (hasRequired && !hasExcluded) {
      const val = row[k];
      if (val !== undefined && val !== '' && val !== null) {
        return parsePercentValue(val);
      }
    }
  }

  // 3. Fallback for columns with suffixes (e.g. .1, _1, _2)
  if (isIbm) {
    for (const k of keys) {
      if (k.endsWith('_1') || k.endsWith('.1') || k.endsWith('_2') || k.endsWith('.2')) {
        const kNorm = k.toLowerCase().replace(/_/g, ' ');
        const hasExcluded = excludedKeywords.some((ew) => kNorm.includes(ew));
        if (!hasExcluded && (kNorm.includes('keterisian') || kNorm.includes('%') || kNorm.includes('persen'))) {
          const val = row[k];
          if (val !== undefined && val !== '' && val !== null) {
            return parsePercentValue(val);
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Helper to determine if a value represents boolean true / approved / filled
 */
/**
 * Helper to determine if a value represents boolean true / approved / filled
 */
export function isValTrue(val: any): boolean {
  if (val === true) return true;
  if (val === false || val === null || val === undefined) return false;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return (
      s === 'true' ||
      s === 'ya' ||
      s === '1' ||
      s === 'disetujui' ||
      s === 'sudah diverifikasi' ||
      s === 'y'
    );
  }
  return false;
}

/**
 * Helper to determine if a value represents boolean false / not filled / not approved
 */
export function isValFalse(val: any): boolean {
  if (val === false) return true;
  if (val === true) return false;
  if (val === null || val === undefined) return true;
  if (typeof val === 'number') return val === 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return (
      s === 'false' ||
      s === 'tidak' ||
      s === '0' ||
      s === 'n' ||
      s === 'belum diverifikasi' ||
      s === 'belum upload' ||
      s === 'belum diupload' ||
      s === '-' ||
      s === ''
    );
  }
  return false;
}

/**
 * Logika Penentuan Status Verifikasi berdasarkan aturan pimpinan:
 * 1. Disetujui / Sudah Diverifikasi:
 *    Jika seluruh item kelengkapan terpenuhi (tidak ada yang bernilai false) 
 *    DAN kolom disetujui bernilai true (ya / 1 / disetujui), maka status verifikasi ditetapkan menjadi Disetujui.
 * 2. Perlu Perbaikan:
 *    Jika kolom disetujui bernilai false ATAU kolom perlu_perbaikan bernilai true, maka status verifikasi ditetapkan menjadi Perlu Perbaikan.
 *    Dan jika salah satu dari item kelengkapan yang tidak terpenuhi (ada yang bernilai false), maka yang false akan muncul di keterangan.
 * 3. Belum Upload:
 *    a. Jika kolom belum_diupload bernilai true (atau status upload belum dilakukan), maka status verifikasi ditetapkan menjadi Belum Upload.
 *    b. Jika kolom belum_diupload bernilai false dan seluruh kolom kelengkapan bernilai false (tidak / 0), 
 *       maka status verifikasi secara otomatis ditetapkan menjadi Belum Upload.
 */
export function determineStatusVerifikasi(params: {
  belumDiuploadVal?: any;
  statusUploadRaw?: string;
  disetujuiVal?: any;
  perluPerbaikanVal?: any;
  detailColumns: Array<{ label: string; val: any }>;
}): { status_verifikasi: string; status_upload: string; falseItems: string[]; falseCount: number } {
  const { belumDiuploadVal, statusUploadRaw, disetujuiVal, perluPerbaikanVal, detailColumns } = params;

  const falseItems: string[] = [];
  let falseCount = 0;

  // Check if detail columns were actually present in the Excel row
  const hasDetailColumnsInSheet = detailColumns.some(
    (col) => col.val !== undefined && col.val !== '' && col.val !== null
  );

  if (hasDetailColumnsInSheet) {
    detailColumns.forEach((col) => {
      if (isValFalse(col.val)) {
        falseCount++;
        falseItems.push(col.label);
      }
    });
  }

  const isBelumDiuploadTrue =
    isValTrue(belumDiuploadVal) ||
    (statusUploadRaw ? (statusUploadRaw.includes('belum') || statusUploadRaw.includes('unupload')) : false);

  // Rule 3a: Jika kolom belum_diupload bernilai true (atau status upload belum dilakukan)
  if (isBelumDiuploadTrue) {
    return {
      status_verifikasi: 'Belum Upload',
      status_upload: 'Belum Upload',
      falseItems,
      falseCount,
    };
  }

  const isBelumDiuploadFalse = !isBelumDiuploadTrue;

  // Rule 3b: Jika kolom belum_diupload bernilai false DAN seluruh kolom kelengkapan bernilai false,
  // maka status verifikasi secara otomatis ditetapkan menjadi Belum Upload
  if (hasDetailColumnsInSheet && isBelumDiuploadFalse && falseCount === detailColumns.length && detailColumns.length > 0) {
    return {
      status_verifikasi: 'Belum Upload',
      status_upload: 'Belum Upload',
      falseItems,
      falseCount,
    };
  }

  if (hasDetailColumnsInSheet) {
    // Rule 2: Jika kolom disetujui bernilai false ATAU kolom perlu_perbaikan bernilai true -> Perlu Perbaikan
    if (isValFalse(disetujuiVal) || isValTrue(perluPerbaikanVal)) {
      return {
        status_verifikasi: 'Perlu Perbaikan',
        status_upload: 'Sudah Upload',
        falseItems,
        falseCount,
      };
    }

    // Rule 1: Jika seluruh item kelengkapan terpenuhi (falseCount === 0) DAN kolom disetujui bernilai true -> Disetujui
    if (falseCount === 0 && isValTrue(disetujuiVal)) {
      return {
        status_verifikasi: 'Disetujui',
        status_upload: 'Sudah Upload',
        falseItems,
        falseCount,
      };
    }
  } else {
    // If the sheet does not have detail columns, directly read disetujui / perlu_perbaikan
    if (isValTrue(disetujuiVal)) {
      return {
        status_verifikasi: 'Disetujui',
        status_upload: 'Sudah Upload',
        falseItems: [],
        falseCount: 0,
      };
    }
    if (isValTrue(perluPerbaikanVal)) {
      return {
        status_verifikasi: 'Perlu Perbaikan',
        status_upload: 'Sudah Upload',
        falseItems: [],
        falseCount: 0,
      };
    }
  }

  // Default: Belum Diverifikasi
  return {
    status_verifikasi: 'Belum Diverifikasi',
    status_upload: 'Sudah Upload',
    falseItems,
    falseCount,
  };
}

/**
 * Reads worksheet rows with smart multi-tier header detection.
 * Handles Excel files where Row 1 has merged parent groups ("Profil Reguler", "Profil IBM")
 * and Row 2 has column labels ("Target Sesuai iEmon", "Sudah Diupload", "Disetujui", "Perlu Perbaikan", "Belum Diupload", "% Keterisian").
 * Automatically produces combined keys like "Profil IBM Disetujui", "Profil Reguler Disetujui", etc.
 */
export function getSheetRowsWithSmartHeaders(worksheet: XLSX.WorkSheet): Record<string, any>[] {
  const rawAoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (rawAoa.length === 0) return [];

  // Find header row(s) within the first 12 rows
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(12, rawAoa.length); r++) {
    const row = rawAoa[r];
    if (!row || !Array.isArray(row)) continue;
    const rowStr = row.map((c: any) => String(c || '').toLowerCase()).join(' ');
    if (
      rowStr.includes('provinsi') ||
      rowStr.includes('prov') ||
      rowStr.includes('reguler') ||
      rowStr.includes('ibm') ||
      rowStr.includes('paket') ||
      rowStr.includes('disetujui') ||
      rowStr.includes('pekerjaan')
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  }

  const row1 = rawAoa[headerRowIndex] || [];
  const row2 = rawAoa[headerRowIndex + 1] || [];
  const row2Str = row2.map((c: any) => String(c || '').toLowerCase()).join(' ');

  const hasSubHeader =
    row2.length > 0 &&
    (row2Str.includes('disetujui') ||
      row2Str.includes('target') ||
      row2Str.includes('upload') ||
      row2Str.includes('keterisian') ||
      row2Str.includes('perbaikan') ||
      row2Str.includes('belum')) &&
    !row2.some((c: any) => typeof c === 'number' || (/^\d+$/.test(String(c || '').trim()) && !row2Str.includes('target')));

  if (hasSubHeader) {
    let currentMainGroup = '';
    const combinedHeaders: string[] = [];
    const maxCols = Math.max(row1.length, row2.length);

    for (let c = 0; c < maxCols; c++) {
      const topCell = String(row1[c] || '').trim();
      const subCell = String(row2[c] || '').trim();
      const topLower = topCell.toLowerCase();

      if (topLower.includes('reguler')) {
        currentMainGroup = 'Profil Reguler';
      } else if (topLower.includes('keterisian ibm') || topLower.includes('keterisian_ibm') || (topLower.includes('keterisian') && !topLower.includes('reguler'))) {
        currentMainGroup = 'Keterisian IBM';
      } else if (topLower.includes('ibm')) {
        currentMainGroup = 'Profil IBM';
      } else if (
        topLower.includes('provinsi') ||
        topLower === 'no' ||
        topLower.includes('paket') ||
        topLower.includes('pekerjaan') ||
        topLower.includes('tahun')
      ) {
        currentMainGroup = '';
      }

      let headerName = '';
      if (currentMainGroup && subCell) {
        if (subCell.toLowerCase().includes(currentMainGroup.toLowerCase())) {
          headerName = subCell;
        } else {
          headerName = `${currentMainGroup} ${subCell}`;
        }
      } else if (topCell && subCell && topCell !== subCell) {
        headerName = `${topCell} ${subCell}`;
      } else {
        headerName = subCell || topCell || `COL_${c}`;
      }
      combinedHeaders.push(headerName);
    }

    const dataRows: Record<string, any>[] = [];
    for (let r = headerRowIndex + 2; r < rawAoa.length; r++) {
      const row = rawAoa[r];
      if (!row || !Array.isArray(row) || row.every((cell: any) => cell === '' || cell === null || cell === undefined)) {
        continue;
      }
      const rowObj: Record<string, any> = {};
      combinedHeaders.forEach((h, idx) => {
        rowObj[h] = row[idx] !== undefined ? row[idx] : '';
      });
      dataRows.push(rowObj);
    }
    return dataRows;
  }

  return XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
}

/**
 * Parses an Excel ArrayBuffer and extracts:
 * 1. summaryItems: From numeric year sheets (e.g. "2025", "2026") containing matrix summary rows (used for KPI calculation).
 * 2. rawItems: From Raw Data sheets (e.g. "Raw Data 2025", "Raw Data 2026") containing package rows (used for Detail Table).
 */
export function parseExcelWorkbook(data: ArrayBuffer): {
  summaryMatrixRows: SummaryMatrixRow[];
  summaryItems: ProfilItem[];
  rawItems: ProfilItem[];
  items: ProfilItem[];
  yearsFound: string[];
  ignoredSheets: string[];
} {
  const workbook = XLSX.read(data, { type: 'array' });
  const summaryMatrixRows: SummaryMatrixRow[] = [];
  const summaryItems: ProfilItem[] = [];
  const rawItems: ProfilItem[] = [];
  const yearsFound: string[] = [];
  const ignoredSheets: string[] = [];

  // Pass 1: Parse Raw Data sheets (e.g. "Raw Data 2025", "Raw Data 2026", or sheets with "paket pekerjaan")
  workbook.SheetNames.forEach((sheetName) => {
    const trimmed = sheetName.trim();
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;
    const jsonRows = getSheetRowsWithSmartHeaders(worksheet);

    if (jsonRows.length === 0) return;

    const firstRowKeys = Object.keys(jsonRows[0]).map(normalizeKey);
    const hasPaketCol = firstRowKeys.some(
      (k) => k.includes('paket') || k.includes('pekerjaan')
    );
    const isRawSheetName = /raw\s*data/i.test(trimmed);

    if (isRawSheetName || hasPaketCol) {
      const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
      const sheetYear = yearMatch ? yearMatch[0] : '';

      jsonRows.forEach((row, idx) => {
        const normalizedRow: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          normalizedRow[normalizeKey(key)] = row[key];
        });

        const provinsi = extractProvinsiVal(normalizedRow);

        if (!provinsi || provinsi.toLowerCase() === 'total' || provinsi.toLowerCase() === 'jumlah') {
          return;
        }

        const tahun = String(normalizedRow['tahun'] || sheetYear || '2025').trim();

        if (tahun && !yearsFound.includes(tahun)) {
          yearsFound.push(tahun);
        }

        // Get nama_paket from "paket pekerjaan" column
        const nama_paket = String(
          normalizedRow['paket_pekerjaan'] ||
            normalizedRow['nama_paket'] ||
            normalizedRow['paket'] ||
            normalizedRow['nama_paket_pekerjaan'] ||
            normalizedRow['pekerjaan'] ||
            `Paket Pekerjaan ${idx + 1}`
        ).trim();

        let jenis_profil = String(
          normalizedRow['jenis_profil'] || normalizedRow['jenis'] || 'Reguler'
        ).trim();

        if (jenis_profil.toLowerCase().includes('ibm')) {
          jenis_profil = 'IBM';
        } else {
          jenis_profil = 'Reguler';
        }

        let target_iemon = Number(
          normalizedRow['target_iemon'] || normalizedRow['target'] || 1
        );
        if (isNaN(target_iemon) || target_iemon <= 0) target_iemon = 1;

        const status_upload_raw = String(
          normalizedRow['status_upload'] || normalizedRow['upload'] || ''
        ).trim().toLowerCase();

        const disetujuiRaw =
          normalizedRow['profil_ibm_disetujui'] ??
          normalizedRow['disetujui_ibm'] ??
          normalizedRow['profil_reguler_disetujui'] ??
          normalizedRow['disetujui_reguler'] ??
          normalizedRow['disetujui'] ??
          normalizedRow['status_disetujui'] ??
          normalizedRow['sudah_disetujui'];

        const perluPerbaikanRaw =
          normalizedRow['profil_ibm_perlu_perbaikan'] ??
          normalizedRow['perlu_perbaikan_ibm'] ??
          normalizedRow['profil_reguler_perlu_perbaikan'] ??
          normalizedRow['perlu_perbaikan_reguler'] ??
          normalizedRow['perlu_perbaikan'] ??
          normalizedRow['revisi'];

        // Detail columns check (10 kelengkapan columns)
        const detailColumnsList = [
          { label: 'Layout', val: normalizedRow['layout'] },
          { label: 'Lokasi', val: normalizedRow['lokasi'] },
          { label: 'Deskripsi Singkat', val: normalizedRow['deskripsi_singkat'] ?? normalizedRow['deskripsi'] },
          { label: 'Lingkup Kegiatan', val: normalizedRow['lingkup_kegiatan'] ?? normalizedRow['lingkup'] },
          { label: 'Waktu Pelaksanaan', val: normalizedRow['waktu_pelaksanaan'] ?? normalizedRow['waktu'] },
          { label: 'Pelaksanaan', val: normalizedRow['pelaksanaan'] },
          { label: 'Kemajuan Pelaksanaan', val: normalizedRow['kemajuan_pelaksanaan'] ?? normalizedRow['pembiayaan'] ?? normalizedRow['kemajuan'] },
          { label: 'Titik Koordinat', val: normalizedRow['titik_koordinat'] ?? normalizedRow['koordinat'] },
          { label: 'Manfaat', val: normalizedRow['manfaat'] },
          { label: 'Akses ke Lokasi', val: normalizedRow['akses_ke_lokasi'] ?? normalizedRow['akses'] ?? normalizedRow['akses_lokasi'] }
        ];

        const belumDiuploadRaw =
          normalizedRow['profil_ibm_belum_diupload'] ??
          normalizedRow['profil_reguler_belum_diupload'] ??
          normalizedRow['belum_diupload'] ??
          normalizedRow['belum_upload'];

        // Apply rules via determineStatusVerifikasi
        const resStatus = determineStatusVerifikasi({
          belumDiuploadVal: belumDiuploadRaw,
          statusUploadRaw: status_upload_raw,
          disetujuiVal: disetujuiRaw,
          perluPerbaikanVal: perluPerbaikanRaw,
          detailColumns: detailColumnsList
        });

        let status_verifikasi = resStatus.status_verifikasi;
        let status_upload = resStatus.status_upload;
        const falseItems = resStatus.falseItems;

        const tanggal_upload = String(
          normalizedRow['tanggal_upload'] || normalizedRow['waktu_pelaksanaan'] || '-'
        ).trim();

        let keterangan = String(normalizedRow['keterangan'] || '').trim();

        // Jika salah satu dari 10 item kelengkapan ada yang bernilai false, tampilkan item yang false di keterangan
        if (falseItems.length > 0 && status_verifikasi !== 'Belum Upload') {
          keterangan = falseItems.join(', ');
        } else if (!keterangan) {
          keterangan = String(
            normalizedRow['deskripsi_singkat'] ||
              normalizedRow['lingkup_kegiatan'] ||
              '-'
          ).trim();
        }

        rawItems.push({
          id: `${tahun}-RAW-${idx + 1}-${provinsi.replace(/\s+/g, '_')}`,
          provinsi,
          tahun,
          nama_paket,
          jenis_profil,
          target_iemon,
          status_upload,
          status_verifikasi,
          tanggal_upload,
          keterangan,
          sheet_origin: sheetName
        });
      });
    }
  });

  // Pass 2: Parse Matrix Summary sheets (e.g. "2025", "2026", "Rekap 2025", "Rekapitulasi", or any sheet with matrix summary columns)
  workbook.SheetNames.forEach((sheetName) => {
    const trimmed = sheetName.trim();
    if (/raw\s*data/i.test(trimmed)) return;

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const jsonRows = getSheetRowsWithSmartHeaders(worksheet);
    if (jsonRows.length === 0) return;

    const firstFewRows = jsonRows.slice(0, 5);
    const hasMatrixColumns = firstFewRows.some((row) => {
      const keys = Object.keys(row).map(normalizeKey);
      return (
        keys.some((k) => k.includes('ibm') || k.includes('reguler') || k.includes('keterisian')) &&
        keys.some((k) => k.includes('target') || k.includes('upload') || k.includes('disetujui'))
      );
    });

    const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/) || trimmed.match(/^\d+$/);
    const isLikelyMatrix = /^\d+$/.test(trimmed) || /rekap/i.test(trimmed) || /summary/i.test(trimmed) || /matriks/i.test(trimmed) || hasMatrixColumns;

    if (isLikelyMatrix && (hasMatrixColumns || /^\d+$/.test(trimmed))) {
      const yearStr = yearMatch ? yearMatch[0] : (yearsFound[0] || '2025');
      if (!yearsFound.includes(yearStr)) {
        yearsFound.push(yearStr);
      }

      jsonRows.forEach((row, idx) => {
        const normalizedRow: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          normalizedRow[normalizeKey(key)] = row[key];
        });

        // Ensure cross-aliases for IBM % Keterisian and Reguler % Keterisian
        const ibmPctVal =
          normalizedRow['keterisian_ibm___keterisian'] ??
          normalizedRow['keterisian_ibm_keterisian'] ??
          normalizedRow['keterisian_ibm____keterisian'] ??
          normalizedRow['profil_ibm___keterisian'] ??
          normalizedRow['profil_ibm_persentase_keterisian'] ??
          normalizedRow['profil_ibm_keterisian'] ??
          normalizedRow['ibm___keterisian'] ??
          normalizedRow['ibm_keterisian'];
        if (ibmPctVal !== undefined) {
          normalizedRow['keterisian_ibm___keterisian'] = ibmPctVal;
          normalizedRow['profil_ibm___keterisian'] = ibmPctVal;
          normalizedRow['ibm___keterisian'] = ibmPctVal;
        }

        const regPctVal =
          normalizedRow['profil_reguler___keterisian'] ??
          normalizedRow['profil_reguler_persentase_keterisian'] ??
          normalizedRow['profil_reguler_keterisian'] ??
          normalizedRow['profil_reguler____keterisian'] ??
          normalizedRow['reguler___keterisian'] ??
          normalizedRow['reguler_keterisian'] ??
          normalizedRow['keterisian_reguler'];
        if (regPctVal !== undefined) {
          normalizedRow['profil_reguler___keterisian'] = regPctVal;
          normalizedRow['reguler___keterisian'] = regPctVal;
        }

        // Ensure cross-aliases for Target columns
        const ibmTargetVal =
          normalizedRow['keterisian_ibm_target_sesuai_iemon'] ??
          normalizedRow['keterisian_ibm___target_sesuai_iemon'] ??
          normalizedRow['keterisian_ibm_target'] ??
          normalizedRow['keterisian_ibm___target'] ??
          normalizedRow['keterisian_ibm_target_iemon'] ??
          normalizedRow['profil_ibm_target_sesuai_iemon'] ??
          normalizedRow['profil_ibm_target_iemon'] ??
          normalizedRow['profil_ibm___target_sesuai_iemon'] ??
          normalizedRow['profil_ibm_target'] ??
          normalizedRow['target_sesuai_iemon_ibm'] ??
          normalizedRow['target_sesuai_iemon_profil_ibm'] ??
          normalizedRow['target_ibm'] ??
          normalizedRow['ibm_target'];
        if (ibmTargetVal !== undefined) {
          normalizedRow['keterisian_ibm_target_sesuai_iemon'] = ibmTargetVal;
          normalizedRow['profil_ibm_target_sesuai_iemon'] = ibmTargetVal;
          normalizedRow['ibm_target'] = ibmTargetVal;
        }

        const regTargetVal =
          normalizedRow['profil_reguler_target_sesuai_iemon'] ??
          normalizedRow['profil_reguler_target_iemon'] ??
          normalizedRow['profil_reguler___target_sesuai_iemon'] ??
          normalizedRow['profil_reguler_target'] ??
          normalizedRow['target_sesuai_iemon_reguler'] ??
          normalizedRow['target_sesuai_iemon_profil_reguler'] ??
          normalizedRow['target_reguler'] ??
          normalizedRow['reguler_target'];
        if (regTargetVal !== undefined) {
          normalizedRow['profil_reguler_target_sesuai_iemon'] = regTargetVal;
          normalizedRow['reguler_target'] = regTargetVal;
        }

        const provinsi = extractProvinsiVal(normalizedRow);

        if (!provinsi || provinsi.toLowerCase() === 'total' || provinsi.toLowerCase() === 'jumlah') {
          return;
        }

        const regTarget = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_reguler_target_sesuai_iemon',
            'profil_reguler_target_iemon',
            'profil_reguler___target_sesuai_iemon',
            'profil_reguler_target',
            'target_sesuai_iemon_profil_reguler',
            'target_sesuai_iemon_reguler',
            'target_sesuai_iemon',
            'target_reguler',
            'reguler_target',
            'reguler_target_sesuai_iemon',
            'target_iemon',
            'target_sesuai_iemon_0',
            'target_0',
            'target'
          ],
          ['reguler', 'target']
        );
        const regUploaded = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_reguler_sudah_diupload',
            'profil_reguler_sudah_upload',
            'sudah_diupload_reguler',
            'sudah_diupload',
            'sudah_upload'
          ],
          ['reguler', 'sudah']
        );
        const regApproved = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_reguler_disetujui',
            'profil_reguler___disetujui',
            'profil_reguler_status_disetujui',
            'profil_reguler_jumlah_disetujui',
            'disetujui_reguler',
            'disetujui_profil_reguler',
            'reguler_disetujui',
            'reguler_approved',
            'disetujui'
          ],
          ['reguler', 'disetujui']
        );
        const regRevision = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_reguler_perlu_perbaikan',
            'perlu_perbaikan_reguler',
            'revisi_reguler',
            'perlu_perbaikan',
            'revisi'
          ],
          ['reguler', 'perbaikan']
        );
        const regUnuploaded = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_reguler_belum_diupload',
            'profil_reguler_belum_upload',
            'belum_diupload_reguler',
            'belum_diupload',
            'belum_upload'
          ],
          ['reguler', 'belum']
        ) || Math.max(0, regTarget - regUploaded);

        const regKeterisianRaw = getFlexiblePercentVal(
          normalizedRow,
          [
            'profil_reguler___keterisian',
            'profil_reguler_persentase_keterisian',
            'profil_reguler_keterisian',
            'profil_reguler____keterisian',
            'reguler___keterisian',
            'reguler_keterisian',
            'keterisian_profil_reguler',
            'keterisian_reguler',
            'keterisian_reguler___keterisian',
            'persentase_keterisian_reguler',
            'persentase_reguler',
            'profil_reguler_persen',
            'reguler_persen'
          ],
          ['reguler', 'keterisian']
        );
        const regKeterisian = regKeterisianRaw !== undefined ? regKeterisianRaw : (regTarget > 0 ? (regUploaded / regTarget) * 100 : 0);

        let unverifiedReg = Math.max(0, regUploaded - (regApproved + regRevision));

        let currentUploaded = regUploaded;
        let currentApproved = regApproved;
        let currentRevision = regRevision;
        let currentUnverified = unverifiedReg;
        let currentUnuploaded = regUnuploaded;

        const totalRegPackages = regTarget > 0 ? regTarget : regUploaded + regUnuploaded;

        for (let i = 0; i < totalRegPackages; i++) {
          let status_upload = 'Belum Upload';
          let status_verifikasi = 'Belum Diverifikasi';

          if (currentUploaded > 0) {
            status_upload = 'Sudah Upload';
            currentUploaded--;

            if (currentApproved > 0) {
              status_verifikasi = 'Disetujui';
              currentApproved--;
            } else if (currentRevision > 0) {
              status_verifikasi = 'Perlu Perbaikan';
              currentRevision--;
            } else if (currentUnverified > 0) {
              status_verifikasi = 'Belum Diverifikasi';
              currentUnverified--;
            }
          } else if (currentUnuploaded > 0) {
            status_upload = 'Belum Upload';
            currentUnuploaded--;
          }

          summaryItems.push({
            id: `${yearStr}-REG-${provinsi.replace(/\s+/g, '_')}-${i + 1}`,
            provinsi,
            tahun: yearStr,
            nama_paket: `Profil Reguler ${provinsi} Paket ${i + 1}`,
            jenis_profil: 'Reguler',
            target_iemon: 1,
            status_upload,
            status_verifikasi,
            tanggal_upload: status_upload === 'Sudah Upload' ? '15/01/' + yearStr : '-',
            keterangan: `Profil Reguler ${provinsi}`,
            sheet_origin: sheetName
          });
        }

        const ibmTarget = getFlexibleNumVal(
          normalizedRow,
          [
            'keterisian_ibm_target_sesuai_iemon',
            'keterisian_ibm___target_sesuai_iemon',
            'keterisian_ibm_target',
            'keterisian_ibm___target',
            'keterisian_ibm_target_iemon',
            'keterisian_target_sesuai_iemon',
            'profil_ibm_target_sesuai_iemon',
            'profil_ibm_target_iemon',
            'profil_ibm___target_sesuai_iemon',
            'profil_ibm_target',
            'target_sesuai_iemon_keterisian_ibm',
            'target_sesuai_iemon_profil_ibm',
            'target_sesuai_iemon_ibm',
            'target_ibm',
            'ibm_target',
            'ibm_target_sesuai_iemon',
            'target_sesuai_iemon_1',
            'target_sesuai_iemon.1',
            'target_iemon_1',
            'target_1',
            'target_sesuai_iemon_2',
            'target_2'
          ],
          ['ibm', 'target'],
          true
        );
        const ibmUploaded = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_ibm_sudah_diupload',
            'profil_ibm_sudah_upload',
            'sudah_diupload_ibm',
            'sudah_diupload_1',
            'sudah_upload_1',
            'sudah_diupload.1',
            'sudah_diupload_2'
          ],
          ['ibm', 'sudah'],
          true
        );
        const ibmApproved = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_ibm_disetujui',
            'profil_ibm___disetujui',
            'profil_ibm_status_disetujui',
            'profil_ibm_jumlah_disetujui',
            'profil_ibm_disetujui_',
            'profil_ibm__disetujui',
            'disetujui_profil_ibm',
            'disetujui_ibm',
            'ibm_disetujui',
            'ibm_approved',
            'disetujui_1',
            'disetujui_2',
            'disetujui.1',
            'disetujui.2',
            'profil_ibm_sudah_disetujui',
            'ibm_sudah_disetujui'
          ],
          ['ibm', 'disetujui'],
          true
        );
        const ibmRevision = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_ibm_perlu_perbaikan',
            'perlu_perbaikan_ibm',
            'revisi_ibm',
            'perlu_perbaikan_1',
            'perlu_perbaikan.1',
            'perlu_perbaikan_2'
          ],
          ['ibm', 'perbaikan'],
          true
        );
        const ibmUnuploaded = getFlexibleNumVal(
          normalizedRow,
          [
            'profil_ibm_belum_diupload',
            'profil_ibm_belum_upload',
            'belum_diupload_ibm',
            'belum_diupload_1',
            'belum_upload_1',
            'belum_diupload.1',
            'belum_diupload_2'
          ],
          ['ibm', 'belum'],
          true
        ) || Math.max(0, ibmTarget - ibmUploaded);

        const ibmKeterisianRaw = getFlexiblePercentVal(
          normalizedRow,
          [
            'keterisian_ibm___keterisian',
            'keterisian_ibm_keterisian',
            'keterisian_ibm____keterisian',
            'keterisian_ibm',
            'profil_ibm___keterisian',
            'profil_ibm_persentase_keterisian',
            'profil_ibm_keterisian',
            'profil_ibm____keterisian',
            'ibm___keterisian',
            'ibm_keterisian',
            'persentase_keterisian_ibm',
            'persentase_ibm',
            'keterisian_ibm_persen',
            'ibm_persen'
          ],
          ['ibm', 'keterisian'],
          true
        );
        const ibmKeterisian = ibmKeterisianRaw !== undefined ? ibmKeterisianRaw : (ibmTarget > 0 ? (ibmUploaded / ibmTarget) * 100 : 0);

        summaryMatrixRows.push({
          id: `${yearStr}-${provinsi.replace(/\s+/g, '_')}-${idx}`,
          provinsi,
          tahun: yearStr,
          regTarget,
          regUploaded,
          regApproved,
          regRevision,
          regUnuploaded,
          regKeterisian,
          ibmTarget,
          ibmUploaded,
          ibmApproved,
          ibmRevision,
          ibmUnuploaded,
          ibmKeterisian,
          sheet_origin: sheetName
        });

        let unverifiedIbm = Math.max(0, ibmUploaded - (ibmApproved + ibmRevision));

        let curIbmUploaded = ibmUploaded;
        let curIbmApproved = ibmApproved;
        let curIbmRevision = ibmRevision;
        let curIbmUnverified = unverifiedIbm;
        let curIbmUnuploaded = ibmUnuploaded;

        const totalIbmPackages = ibmTarget > 0 ? ibmTarget : ibmUploaded + ibmUnuploaded;

        for (let i = 0; i < totalIbmPackages; i++) {
          let status_upload = 'Belum Upload';
          let status_verifikasi = 'Belum Diverifikasi';

          if (curIbmUploaded > 0) {
            status_upload = 'Sudah Upload';
            curIbmUploaded--;

            if (curIbmApproved > 0) {
              status_verifikasi = 'Disetujui';
              curIbmApproved--;
            } else if (curIbmRevision > 0) {
              status_verifikasi = 'Perlu Perbaikan';
              curIbmRevision--;
            } else if (curIbmUnverified > 0) {
              status_verifikasi = 'Belum Diverifikasi';
              curIbmUnverified--;
            }
          } else if (curIbmUnuploaded > 0) {
            status_upload = 'Belum Upload';
            curIbmUnuploaded--;
          }

          summaryItems.push({
            id: `${yearStr}-IBM-${provinsi.replace(/\s+/g, '_')}-${i + 1}`,
            provinsi,
            tahun: yearStr,
            nama_paket: `Profil IBM ${provinsi} Paket ${i + 1}`,
            jenis_profil: 'IBM',
            target_iemon: 1,
            status_upload,
            status_verifikasi,
            tanggal_upload: status_upload === 'Sudah Upload' ? '20/01/' + yearStr : '-',
            keterangan: `Profil IBM ${provinsi}`,
            sheet_origin: sheetName
          });
        }
      });
    } else {
      if (!isYearSheet(trimmed)) {
        ignoredSheets.push(sheetName);
      }
    }
  });

  yearsFound.sort((a, b) => Number(a) - Number(b));

  // Fallback: If no matrix summary sheets were present, build matrix rows from raw items
  if (summaryMatrixRows.length === 0 && rawItems.length > 0) {
    const matrixMap: Record<string, SummaryMatrixRow> = {};
    rawItems.forEach((item) => {
      const key = `${item.tahun}-${item.provinsi}`;
      if (!matrixMap[key]) {
        matrixMap[key] = {
          id: key,
          provinsi: item.provinsi,
          tahun: String(item.tahun),
          regTarget: 0,
          regUploaded: 0,
          regApproved: 0,
          regRevision: 0,
          regUnuploaded: 0,
          ibmTarget: 0,
          ibmUploaded: 0,
          ibmApproved: 0,
          ibmRevision: 0,
          ibmUnuploaded: 0,
          sheet_origin: item.sheet_origin
        };
      }
      const m = matrixMap[key];
      const isIbm = String(item.jenis_profil).toLowerCase() === 'ibm';
      if (isIbm) {
        m.ibmTarget += (item.target_iemon || 1);
        if (item.status_upload === 'Sudah Upload') m.ibmUploaded += 1;
        if (item.status_verifikasi === 'Disetujui') m.ibmApproved += 1;
        if (item.status_verifikasi === 'Perlu Perbaikan') m.ibmRevision += 1;
        if (item.status_upload === 'Belum Upload') m.ibmUnuploaded += 1;
      } else {
        m.regTarget += (item.target_iemon || 1);
        if (item.status_upload === 'Sudah Upload') m.regUploaded += 1;
        if (item.status_verifikasi === 'Disetujui') m.regApproved += 1;
        if (item.status_verifikasi === 'Perlu Perbaikan') m.regRevision += 1;
        if (item.status_upload === 'Belum Upload') m.regUnuploaded += 1;
      }
      m.regKeterisian = m.regTarget > 0 ? (m.regUploaded / m.regTarget) * 100 : 0;
      m.ibmKeterisian = m.ibmTarget > 0 ? (m.ibmUploaded / m.ibmTarget) * 100 : 0;
    });
    summaryMatrixRows.push(...Object.values(matrixMap));
  }

  const items = rawItems.length > 0 ? rawItems : summaryItems;

  return { summaryMatrixRows, summaryItems, rawItems, items, yearsFound, ignoredSheets };
}

/**
 * Sample dataset generator matching the requested template specifications:
 * 1. Sheet 2025 & Sheet 2026:
 *    no | provinsi | Profil Reguler Target Sesuai iEmon | Profil Reguler Sudah Diupload | Profil Reguler Disetujui | Profil Reguler Perlu Perbaikan | Profil Reguler Belum Diupload | Profil Reguler % Keterisian | Profil IBM Target Sesuai iEmon | Profil IBM Sudah Diupload | Profil IBM Disetujui | Profil IBM Perlu Perbaikan | Profil IBM % Keterisian
 * 
 * 2. Sheet Raw Data 2025 & Sheet Raw Data 2026:
 *    no | provinsi | paket pekerjaan | jenis profil | perlu perbaikan | disetujui | layout | lokasi | deskripsi singkat | lingkup kegiatan | waktu pelaksanaan | pembiayaan | titik koordinat | manfaat | akses ke lokasi
 */
export function downloadSampleExcelFile() {
  const wb = XLSX.utils.book_new();

  // --- SHEET 2025 Matrix Table ---
  const sheet2025Data = [
    {
      'no': 1,
      'provinsi': 'DKI Jakarta',
      'Profil Reguler Target Sesuai iEmon': 3,
      'Profil Reguler Sudah Diupload': 3,
      'Profil Reguler Disetujui': 2,
      'Profil Reguler Perlu Perbaikan': 1,
      'Profil Reguler Belum Diupload': 0,
      'Profil Reguler % Keterisian': '100.00%',
      'Profil IBM Target Sesuai iEmon': 2,
      'Profil IBM Sudah Diupload': 2,
      'Profil IBM Disetujui': 1,
      'Profil IBM Perlu Perbaikan': 1,
      'Profil IBM % Keterisian': '100.00%'
    },
    {
      'no': 2,
      'provinsi': 'Jawa Barat',
      'Profil Reguler Target Sesuai iEmon': 4,
      'Profil Reguler Sudah Diupload': 3,
      'Profil Reguler Disetujui': 2,
      'Profil Reguler Perlu Perbaikan': 1,
      'Profil Reguler Belum Diupload': 1,
      'Profil Reguler % Keterisian': '75.00%',
      'Profil IBM Target Sesuai iEmon': 3,
      'Profil IBM Sudah Diupload': 2,
      'Profil IBM Disetujui': 2,
      'Profil IBM Perlu Perbaikan': 0,
      'Profil IBM % Keterisian': '66.67%'
    },
    {
      'no': 3,
      'provinsi': 'Jawa Tengah',
      'Profil Reguler Target Sesuai iEmon': 3,
      'Profil Reguler Sudah Diupload': 3,
      'Profil Reguler Disetujui': 3,
      'Profil Reguler Perlu Perbaikan': 0,
      'Profil Reguler Belum Diupload': 0,
      'Profil Reguler % Keterisian': '100.00%',
      'Profil IBM Target Sesuai iEmon': 2,
      'Profil IBM Sudah Diupload': 1,
      'Profil IBM Disetujui': 1,
      'Profil IBM Perlu Perbaikan': 0,
      'Profil IBM % Keterisian': '50.00%'
    },
    {
      'no': 4,
      'provinsi': 'Jawa Timur',
      'Profil Reguler Target Sesuai iEmon': 5,
      'Profil Reguler Sudah Diupload': 4,
      'Profil Reguler Disetujui': 3,
      'Profil Reguler Perlu Perbaikan': 1,
      'Profil Reguler Belum Diupload': 1,
      'Profil Reguler % Keterisian': '80.00%',
      'Profil IBM Target Sesuai iEmon': 3,
      'Profil IBM Sudah Diupload': 3,
      'Profil IBM Disetujui': 2,
      'Profil IBM Perlu Perbaikan': 1,
      'Profil IBM % Keterisian': '100.00%'
    },
    {
      'no': 5,
      'provinsi': 'Bali',
      'Profil Reguler Target Sesuai iEmon': 2,
      'Profil Reguler Sudah Diupload': 2,
      'Profil Reguler Disetujui': 2,
      'Profil Reguler Perlu Perbaikan': 0,
      'Profil Reguler Belum Diupload': 0,
      'Profil Reguler % Keterisian': '100.00%',
      'Profil IBM Target Sesuai iEmon': 1,
      'Profil IBM Sudah Diupload': 1,
      'Profil IBM Disetujui': 1,
      'Profil IBM Perlu Perbaikan': 0,
      'Profil IBM % Keterisian': '100.00%'
    }
  ];

  // --- SHEET 2026 Matrix Table ---
  const sheet2026Data = [
    {
      'no': 1,
      'provinsi': 'DKI Jakarta',
      'Profil Reguler Target Sesuai iEmon': 4,
      'Profil Reguler Sudah Diupload': 4,
      'Profil Reguler Disetujui': 3,
      'Profil Reguler Perlu Perbaikan': 1,
      'Profil Reguler Belum Diupload': 0,
      'Profil Reguler % Keterisian': '100.00%',
      'Profil IBM Target Sesuai iEmon': 3,
      'Profil IBM Sudah Diupload': 2,
      'Profil IBM Disetujui': 1,
      'Profil IBM Perlu Perbaikan': 1,
      'Profil IBM % Keterisian': '66.67%'
    },
    {
      'no': 2,
      'provinsi': 'Jawa Barat',
      'Profil Reguler Target Sesuai iEmon': 5,
      'Profil Reguler Sudah Diupload': 4,
      'Profil Reguler Disetujui': 3,
      'Profil Reguler Perlu Perbaikan': 1,
      'Profil Reguler Belum Diupload': 1,
      'Profil Reguler % Keterisian': '80.00%',
      'Profil IBM Target Sesuai iEmon': 4,
      'Profil IBM Sudah Diupload': 3,
      'Profil IBM Disetujui': 2,
      'Profil IBM Perlu Perbaikan': 1,
      'Profil IBM % Keterisian': '75.00%'
    },
    {
      'no': 3,
      'provinsi': 'Jawa Tengah',
      'Profil Reguler Target Sesuai iEmon': 4,
      'Profil Reguler Sudah Diupload': 4,
      'Profil Reguler Disetujui': 4,
      'Profil Reguler Perlu Perbaikan': 0,
      'Profil Reguler Belum Diupload': 0,
      'Profil Reguler % Keterisian': '100.00%',
      'Profil IBM Target Sesuai iEmon': 3,
      'Profil IBM Sudah Diupload': 2,
      'Profil IBM Disetujui': 1,
      'Profil IBM Perlu Perbaikan': 1,
      'Profil IBM % Keterisian': '66.67%'
    },
    {
      'no': 4,
      'provinsi': 'Jawa Timur',
      'Profil Reguler Target Sesuai iEmon': 6,
      'Profil Reguler Sudah Diupload': 5,
      'Profil Reguler Disetujui': 4,
      'Profil Reguler Perlu Perbaikan': 1,
      'Profil Reguler Belum Diupload': 1,
      'Profil Reguler % Keterisian': '83.33%',
      'Profil IBM Target Sesuai iEmon': 4,
      'Profil IBM Sudah Diupload': 3,
      'Profil IBM Disetujui': 2,
      'Profil IBM Perlu Perbaikan': 1,
      'Profil IBM % Keterisian': '75.00%'
    },
    {
      'no': 5,
      'provinsi': 'Sumatera Utara',
      'Profil Reguler Target Sesuai iEmon': 3,
      'Profil Reguler Sudah Diupload': 3,
      'Profil Reguler Disetujui': 3,
      'Profil Reguler Perlu Perbaikan': 0,
      'Profil Reguler Belum Diupload': 0,
      'Profil Reguler % Keterisian': '100.00%',
      'Profil IBM Target Sesuai iEmon': 2,
      'Profil IBM Sudah Diupload': 2,
      'Profil IBM Disetujui': 2,
      'Profil IBM Perlu Perbaikan': 0,
      'Profil IBM % Keterisian': '100.00%'
    },
    {
      'no': 6,
      'provinsi': 'Sulawesi Selatan',
      'Profil Reguler Target Sesuai iEmon': 3,
      'Profil Reguler Sudah Diupload': 2,
      'Profil Reguler Disetujui': 2,
      'Profil Reguler Perlu Perbaikan': 0,
      'Profil Reguler Belum Diupload': 1,
      'Profil Reguler % Keterisian': '66.67%',
      'Profil IBM Target Sesuai iEmon': 2,
      'Profil IBM Sudah Diupload': 1,
      'Profil IBM Disetujui': 1,
      'Profil IBM Perlu Perbaikan': 0,
      'Profil IBM % Keterisian': '50.00%'
    }
  ];

  // --- SHEET RAW DATA 2025 ---
  const rawData2025 = [
    {
      'no': 1,
      'provinsi': 'DKI Jakarta',
      'paket pekerjaan': 'SPAM Kalideres Phase 1',
      'jenis profil': 'Reguler',
      'perlu perbaikan': 'Tidak',
      'disetujui': 'Ya',
      'layout': 'Sesuai Pedoman',
      'lokasi': 'Kec. Kalideres, Jakarta Barat',
      'deskripsi singkat': 'Pembangunan Sistem Penyediaan Air Minum Kapasitas 500 L/detik',
      'lingkup kegiatan': 'Pemasangan Pipa Transmisi & Reservoir Utama',
      'waktu pelaksanaan': '12 Bulan (Jan - Des 2025)',
      'pembiayaan': 'APBN 2025 - Rp 45.000.000.000',
      'titik koordinat': '-6.1524, 106.7011',
      'manfaat': 'Pelayanan Air Minum untuk 40.000 SR',
      'akses ke lokasi': 'Jalan Angkutan Utama Kalideres, Akses Aspal Mulus'
    },
    {
      'no': 2,
      'provinsi': 'DKI Jakarta',
      'paket pekerjaan': 'IBM Kalideres Pemberdayaan',
      'jenis profil': 'IBM',
      'perlu perbaikan': 'Ya (Revisi Foto & Video Drone)',
      'disetujui': 'Perlu Perbaikan',
      'layout': 'Perlu Penyesuaian Format Video',
      'lokasi': 'Kel. Semanan, Kalideres',
      'deskripsi singkat': 'Program Sanitasi Berbasis Masyarakat (Sanimas)',
      'lingkup kegiatan': 'Pembangunan IPAL Komunal & Jaringan Perpipaan',
      'waktu pelaksanaan': '6 Bulan (Mei - Okt 2025)',
      'pembiayaan': 'APBN Swakelola - Rp 600.000.000',
      'titik koordinat': '-6.1590, 106.6950',
      'manfaat': 'Pengolahan Air Limbah untuk 100 KK',
      'akses ke lokasi': 'Jalan Lingkungan Gang 3 Meter'
    },
    {
      'no': 3,
      'provinsi': 'Jawa Barat',
      'paket pekerjaan': 'SPAM Regional Jatigede',
      'jenis profil': 'Reguler',
      'perlu perbaikan': 'Tidak',
      'disetujui': 'Belum Diverifikasi',
      'layout': 'Draft Final',
      'lokasi': 'Kab. Sumedang & Kab. Indramayu',
      'deskripsi singkat': 'Pembangunan Jaringan Perpipaan Air Minum Regional',
      'lingkup kegiatan': 'Intake, IPA, Pipa Transmisi',
      'waktu pelaksanaan': '18 Bulan (2025 - 2026)',
      'pembiayaan': 'APBN - Rp 120.000.000.000',
      'titik koordinat': '-6.8583, 108.0982',
      'manfaat': 'Air Minum Kawasan Jawa Barat Selatan',
      'akses ke lokasi': 'Jalan Raya Jatigede'
    },
    {
      'no': 4,
      'provinsi': 'Jawa Barat',
      'paket pekerjaan': 'IBM Sanimas Kota Bekasi',
      'jenis profil': 'IBM',
      'perlu perbaikan': 'Tidak',
      'disetujui': 'Ya',
      'layout': 'Sesuai Pedoman',
      'lokasi': 'Kec. Bekasi Timur, Kota Bekasi',
      'deskripsi singkat': 'Pembangunan IPAL Komunal Berbasis Masyarakat',
      'lingkup kegiatan': 'Konstruksi IPAL & Sambungan Rumah',
      'waktu pelaksanaan': '5 Bulan (Jul - Nov 2025)',
      'pembiayaan': 'APBN Swakelola - Rp 500.000.000',
      'titik koordinat': '-6.2411, 107.0005',
      'manfaat': 'Penanganan Sanitasi Kumuh 75 KK',
      'akses ke lokasi': 'Jalan Pemukiman Warga'
    },
    {
      'no': 5,
      'provinsi': 'Jawa Tengah',
      'paket pekerjaan': 'Penataan Kawasan Keraton Surakarta',
      'jenis profil': 'Reguler',
      'perlu perbaikan': 'Tidak',
      'disetujui': 'Ya',
      'layout': 'Sesuai Pedoman HD',
      'lokasi': 'Kota Surakarta, Jawa Tengah',
      'deskripsi singkat': 'Revitalisasi Lanskap & Pedestrian Kawasan Keraton',
      'lingkup kegiatan': 'Pekerjaan Drainase, Pedestrian, Pencahayaan',
      'waktu pelaksanaan': '10 Bulan (Feb - Nov 2025)',
      'pembiayaan': 'APBN - Rp 35.000.000.000',
      'titik koordinat': '-7.5756, 110.8267',
      'manfaat': 'Dukungan Destinasi Wisata Cagar Budaya',
      'akses ke lokasi': 'Pusat Kota Surakarta'
    }
  ];

  // --- SHEET RAW DATA 2026 ---
  const rawData2026 = [
    {
      'no': 1,
      'provinsi': 'DKI Jakarta',
      'paket pekerjaan': 'SPAM Jatiluhur I Distribusi Jakarta',
      'jenis profil': 'Reguler',
      'perlu perbaikan': 'Tidak',
      'disetujui': 'Ya',
      'layout': 'Sesuai Pedoman',
      'lokasi': 'Kec. Cipayung, Jakarta Timur',
      'deskripsi singkat': 'Pemasangan Pipa Distribusi Utama Air Minum',
      'lingkup kegiatan': 'Pemasangan Pipa HDPE 600mm & Meter Induk',
      'waktu pelaksanaan': '12 Bulan (Jan - Des 2026)',
      'pembiayaan': 'APBN 2026 - Rp 65.000.000.000',
      'titik koordinat': '-6.3120, 106.9015',
      'manfaat': 'Suplai Air Minum 50.000 SR Jakarta Timur',
      'akses ke lokasi': 'Jalan Utama Cipayung'
    },
    {
      'no': 2,
      'provinsi': 'DKI Jakarta',
      'paket pekerjaan': 'IBM KOTAKU Jakarta Utara',
      'jenis profil': 'IBM',
      'perlu perbaikan': 'Ya (Lengkapi Subtitle Video)',
      'disetujui': 'Perlu Perbaikan',
      'layout': 'Revisi Minor',
      'lokasi': 'Kec. Cilincing, Jakarta Utara',
      'deskripsi singkat': 'Penataan Pemukiman Kumuh Pesisir',
      'lingkup kegiatan': 'Jalan Beton Lingkungan & Drainase U-Ditch',
      'waktu pelaksanaan': '6 Bulan (Apr - Sep 2026)',
      'pembiayaan': 'APBN Swakelola - Rp 750.000.000',
      'titik koordinat': '-6.1105, 106.9201',
      'manfaat': 'Peningkatan Kualitas Lingkungan 120 KK',
      'akses ke lokasi': 'Jalan Nelayan Cilincing'
    },
    {
      'no': 3,
      'provinsi': 'Jawa Tengah',
      'paket pekerjaan': 'SPAM Regional Semarang Barat',
      'jenis profil': 'Reguler',
      'perlu perbaikan': 'Tidak',
      'disetujui': 'Ya',
      'layout': 'Sesuai Pedoman 4K',
      'lokasi': 'Kota Semarang & Kab. Kendal',
      'deskripsi singkat': 'Operasionalisasi IPA Semarang Barat',
      'lingkup kegiatan': 'Pentaatan Bangunan IPA & SCADA System',
      'waktu pelaksanaan': '8 Bulan (Jan - Ags 2026)',
      'pembiayaan': 'APBN - Rp 55.000.000.000',
      'titik koordinat': '-6.9801, 110.3550',
      'manfaat': 'Keandalan Air Minum Wilayah Semarang Barat',
      'akses ke lokasi': 'Jalan Pantura Semarang'
    },
    {
      'no': 4,
      'provinsi': 'Sumatera Utara',
      'paket pekerjaan': 'Penataan Kawasan Danau Toba Parapat',
      'jenis profil': 'Reguler',
      'perlu perbaikan': 'Tidak',
      'disetujui': 'Ya',
      'layout': 'Sesuai Pedoman 360-Degree',
      'lokasi': 'Parapat, Kab. Simalungun',
      'deskripsi singkat': 'Penataan Ruang Terbuka Publik & Waterfront',
      'lingkup kegiatan': 'Plaza Wisata, Pedestrian, Penerangan Taman',
      'waktu pelaksanaan': '10 Bulan (Feb - Nov 2026)',
      'pembiayaan': 'APBN - Rp 40.000.000.000',
      'titik koordinat': '2.6612, 98.9320',
      'manfaat': 'Dukungan KSPN Danau Toba Super Prioritas',
      'akses ke lokasi': 'Jalan Lintas Sumatera Parapat'
    }
  ];

  // Convert arrays to worksheets
  const ws2025 = XLSX.utils.json_to_sheet(sheet2025Data);
  const ws2026 = XLSX.utils.json_to_sheet(sheet2026Data);
  const wsRaw2025 = XLSX.utils.json_to_sheet(rawData2025);
  const wsRaw2026 = XLSX.utils.json_to_sheet(rawData2026);

  // Auto column widths for clean readability
  const setColWidths = (ws: XLSX.WorkSheet) => {
    ws['!cols'] = [
      { wch: 6 },  // no
      { wch: 20 }, // provinsi
      { wch: 25 }, // paket / col 3
      { wch: 18 }, // col 4
      { wch: 18 }, // col 5
      { wch: 20 }, // col 6
      { wch: 20 }, // col 7
      { wch: 18 }, // col 8
      { wch: 25 }, // col 9
      { wch: 20 }, // col 10
      { wch: 18 }, // col 11
      { wch: 20 }, // col 12
      { wch: 18 }, // col 13
      { wch: 25 }, // col 14
      { wch: 25 }  // col 15
    ];
  };

  setColWidths(ws2025);
  setColWidths(ws2026);
  setColWidths(wsRaw2025);
  setColWidths(wsRaw2026);

  // Append worksheets in requested order
  XLSX.utils.book_append_sheet(wb, ws2025, '2025');
  XLSX.utils.book_append_sheet(wb, ws2026, '2026');
  XLSX.utils.book_append_sheet(wb, wsRaw2025, 'Raw Data 2025');
  XLSX.utils.book_append_sheet(wb, wsRaw2026, 'Raw Data 2026');

  // Trigger download
  XLSX.writeFile(wb, 'Template_Profil_Audiovisual_CiptaKarya.xlsx');
}
