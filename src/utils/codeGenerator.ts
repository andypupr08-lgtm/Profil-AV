import { ProfilItem, SummaryMatrixRow } from '../types';

/**
 * Generates the TypeScript code string for sampleData.ts / code-utils-sampleData.ts
 * based on the matrix rows and raw items parsed from an Excel file.
 */
export function generateSampleDataTsCode(
  matrixRows: SummaryMatrixRow[],
  rawItems: ProfilItem[]
): string {
  const formattedMatrix = JSON.stringify(matrixRows, null, 2);
  const formattedRaw = JSON.stringify(rawItems, null, 2);

  return `import { ProfilItem, SummaryMatrixRow } from '../types';

// Data ringkasan per provinsi, dihasilkan secara otomatis berdasarkan data Excel
export const INITIAL_SUMMARY_MATRIX_DATA: SummaryMatrixRow[] = ${formattedMatrix};

// Data detail per paket pekerjaan, dihasilkan secara otomatis berdasarkan data Excel
export const INITIAL_RAW_DATA: ProfilItem[] = ${formattedRaw};

// Alias untuk kompatibilitas kode
export const INITIAL_SAMPLE_DATA = INITIAL_RAW_DATA;
export const INITIAL_SUMMARY_DATA = INITIAL_RAW_DATA;
`;
}

/**
 * Helper to download a string as a text file in the browser
 */
export function downloadTsFile(content: string, filename: string = 'code-utils-sampleData.ts'): void {
  const blob = new Blob([content], { type: 'text/typescript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
