export interface ProfilItem {
  id: string | number;
  provinsi: string;
  tahun: string | number;
  nama_paket: string;
  jenis_profil: 'Reguler' | 'IBM' | string;
  target_iemon: number;
  status_upload: 'Sudah Upload' | 'Belum Upload' | string;
  status_verifikasi: 'Disetujui' | 'Perlu Perbaikan' | 'Belum Diverifikasi' | string;
  tanggal_upload?: string;
  keterangan?: string;
  sheet_origin?: string;
}

export interface SummaryMatrixRow {
  id: string;
  provinsi: string;
  tahun: string;
  regTarget: number;
  regUploaded: number;
  regApproved: number;
  regRevision: number;
  regUnuploaded: number;
  regKeterisian?: number;
  ibmTarget: number;
  ibmUploaded: number;
  ibmApproved: number;
  ibmRevision: number;
  ibmUnuploaded: number;
  ibmKeterisian?: number;
  sheet_origin?: string;
}

export interface FilterState {
  provinsi: string; // 'Semua Provinsi' or specific
  tahun: string; // 'Semua Tahun' or specific numeric string
  jenis_profil: string; // 'Semua Jenis Profil' or 'Reguler' or 'IBM'
}

export interface DrillDownFilter {
  field: 'status_upload' | 'status_verifikasi' | 'all' | null;
  value: string | null;
  label: string | null;
}

export interface KPIStats {
  targetIEmon: number;
  targetReguler: number;
  targetIBM: number;

  sudahUpload: number;
  sudahUploadReguler: number;
  sudahUploadIBM: number;

  disetujui: number;
  disetujuiReguler: number;
  disetujuiIBM: number;

  perluPerbaikan: number;
  perluPerbaikanReguler: number;
  perluPerbaikanIBM: number;

  belumUpload: number;
  belumUploadReguler: number;
  belumUploadIBM: number;

  belumDiverifikasi: number;
  persentaseKeterisian: number;
  persentaseKeterisianReguler: number;
  persentaseKeterisianIBM: number;
}
