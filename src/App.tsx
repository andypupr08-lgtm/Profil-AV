import { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { KPICards } from './components/KPICards';
import { ChartsGrid } from './components/ChartsGrid';
import { DataTable } from './components/DataTable';
import { RecapPanel, sortProvincesByBPBPK } from './components/RecapPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { LoginModal } from './components/LoginModal';
import { CodeGeneratedModal } from './components/CodeGeneratedModal';
import { PresentationModal } from './components/PresentationModal';
import { INITIAL_SUMMARY_DATA, INITIAL_RAW_DATA, INITIAL_SUMMARY_MATRIX_DATA } from './utils/sampleData';
import { parseExcelWorkbook } from './utils/excelParser';
import { generateSampleDataTsCode } from './utils/codeGenerator';
import { ProfilItem, SummaryMatrixRow, FilterState, DrillDownFilter, KPIStats } from './types';
import { Presentation, Sparkles, Sliders, FileText, Table, FileSpreadsheet, BarChart3, ChevronRight, ChevronLeft, Layers, ArrowRight, ArrowLeft } from 'lucide-react';

const formatTimestamp = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${d} ${m} ${y}, ${hh}:${mm} WIB`;
};

export default function App() {
  const [summaryMatrixRows, setSummaryMatrixRows] = useState<SummaryMatrixRow[]>(INITIAL_SUMMARY_MATRIX_DATA);
  const [summaryItems, setSummaryItems] = useState<ProfilItem[]>(INITIAL_SUMMARY_DATA);
  const [rawItems, setRawItems] = useState<ProfilItem[]>(INITIAL_RAW_DATA);
  const [scannedYears, setScannedYears] = useState<string[]>(['2025', '2026']);
  const [ignoredSheetsCount, setIgnoredSheetsCount] = useState<number>(0);
  const [activeFileName, setActiveFileName] = useState<string>('Profil_Audiovisual_Sample.xlsx');
  const [uploadTimestamp, setUploadTimestamp] = useState<string>(() => formatTimestamp(new Date()));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Code Generator Modal State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>(() =>
    generateSampleDataTsCode(INITIAL_SUMMARY_MATRIX_DATA, INITIAL_RAW_DATA)
  );

  // Presentation Modal State
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState<boolean>(false);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const handleLoginSuccess = useCallback((userData: { name: string; email: string; role: string }) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userData', JSON.stringify(userData));
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
  }, []);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    provinsi: 'Semua Provinsi',
    tahun: '2026',
    jenis_profil: 'Reguler'
  });

  // Drill-down State from KPI Card Clicks
  const [activeDrillDown, setActiveDrillDown] = useState<DrillDownFilter>({
    field: null,
    value: null,
    label: null
  });

  // Active Page State: 'detail' (Halaman 1) or 'rekap' (Halaman 2)
  const [currentPage, setCurrentPage] = useState<'detail' | 'rekap'>('detail');

  // Handle Excel File Upload
  const handleFileUpload = useCallback((file: File) => {
    setIsLoading(true);
    setActiveFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          const { summaryMatrixRows: parsedMatrix, summaryItems: parsedSummary, rawItems: parsedRaw, yearsFound, ignoredSheets } = parseExcelWorkbook(buffer);
          
          if (parsedMatrix.length > 0 || parsedSummary.length > 0 || parsedRaw.length > 0) {
            const finalRaw = parsedRaw.length > 0 ? parsedRaw : parsedSummary;
            setSummaryMatrixRows(parsedMatrix);
            setSummaryItems(parsedSummary.length > 0 ? parsedSummary : parsedRaw);
            setRawItems(finalRaw);
            setScannedYears(yearsFound);
            setIgnoredSheetsCount(ignoredSheets.length);
            setUploadTimestamp(formatTimestamp(new Date()));
            
            // Generate TS code for sampleData.ts / code-utils-sampleData.ts
            const tsCode = generateSampleDataTsCode(parsedMatrix, finalRaw);
            setGeneratedCode(tsCode);
            setIsCodeModalOpen(true);

            // Reset filters to default
            setFilters({
              provinsi: 'Semua Provinsi',
              tahun: 'Semua Tahun',
              jenis_profil: 'Semua Jenis Profil'
            });
            setActiveDrillDown({ field: null, value: null, label: null });
          } else {
            alert('File Excel tidak memiliki sheet bernomor tahun (misal: 2025, 2026) atau sheet Raw Data yang valid.');
          }
        }
      } catch (err) {
        console.error('Gagal membaca file Excel:', err);
        alert('Gagal membaca file Excel. Pastikan format file .xlsx valid.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      alert('Terjadi kesalahan saat membaca file.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  // Reset to default sample dataset
  const handleResetToSample = useCallback(() => {
    setSummaryMatrixRows(INITIAL_SUMMARY_MATRIX_DATA);
    setSummaryItems(INITIAL_SUMMARY_DATA);
    setRawItems(INITIAL_RAW_DATA);
    setGeneratedCode(generateSampleDataTsCode(INITIAL_SUMMARY_MATRIX_DATA, INITIAL_RAW_DATA));
    setScannedYears(['2025', '2026']);
    setIgnoredSheetsCount(0);
    setActiveFileName('Profil_Audiovisual_Sample.xlsx');
    setFilters({
      provinsi: 'Semua Provinsi',
      tahun: 'Semua Tahun',
      jenis_profil: 'Semua Jenis Profil'
    });
    setActiveDrillDown({ field: null, value: null, label: null });
  }, []);

  // Combined dataset for extracting available filter options
  const combinedItems = useMemo(() => {
    return [...summaryItems, ...rawItems];
  }, [summaryItems, rawItems]);

  // Compute available filter dropdown options dynamically
  const availableProvinces = useMemo(() => {
    const allSources = [
      ...summaryMatrixRows.map((m) => m.provinsi),
      ...summaryItems.map((i) => i.provinsi),
      ...rawItems.map((r) => r.provinsi)
    ];
    const list: string[] = Array.from(
      new Set(
        allSources
          .map((p) => String(p || '').trim())
          .filter((p) => p.length > 0 && p.toLowerCase() !== 'undefined' && p.toLowerCase() !== 'null')
      )
    );
    return sortProvincesByBPBPK(list);
  }, [summaryMatrixRows, summaryItems, rawItems]);

  const availableYears = useMemo(() => {
    const list: string[] = Array.from(new Set([...scannedYears, ...combinedItems.map((i) => String(i.tahun)).filter(Boolean)]));
    return list.sort((a: string, b: string) => Number(a) - Number(b));
  }, [combinedItems, scannedYears]);

  const availableProfileTypes = useMemo(() => {
    const list: string[] = Array.from(
      new Set(
        combinedItems
          .map((i) => String(i.jenis_profil || '').trim())
          .filter((p) => p.length > 0 && p !== 'undefined' && p !== 'null')
      )
    );
    const filtered = list.filter((p) => p === 'Reguler' || p === 'IBM');
    return filtered.length > 0 ? filtered : ['Reguler', 'IBM'];
  }, [combinedItems]);

  // Filtered items for KPI Calculation (Sourced from Sheet 2025, Sheet 2026 matrix)
  const filteredSummaryItems = useMemo(() => {
    const source = summaryItems.length > 0 ? summaryItems : rawItems;
    return source.filter((item) => {
      if (
        filters.provinsi !== 'Semua Provinsi' &&
        String(item.provinsi || '').trim().toLowerCase() !== filters.provinsi.trim().toLowerCase()
      ) {
        return false;
      }
      if (
        filters.tahun !== 'Semua Tahun' &&
        String(item.tahun || '').trim() !== String(filters.tahun || '').trim()
      ) {
        return false;
      }
      if (
        filters.jenis_profil !== 'Semua Jenis Profil' &&
        String(item.jenis_profil || '').trim().toLowerCase() !== filters.jenis_profil.trim().toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [summaryItems, rawItems, filters]);

  // Filtered items for Detail Table (Sourced from Sheet Raw Data 2025, Sheet Raw Data 2026)
  const filteredRawItems = useMemo(() => {
    const source = rawItems.length > 0 ? rawItems : summaryItems;
    return source.filter((item) => {
      if (
        filters.provinsi !== 'Semua Provinsi' &&
        String(item.provinsi || '').trim().toLowerCase() !== filters.provinsi.trim().toLowerCase()
      ) {
        return false;
      }
      if (
        filters.tahun !== 'Semua Tahun' &&
        String(item.tahun || '').trim() !== String(filters.tahun || '').trim()
      ) {
        return false;
      }
      if (
        filters.jenis_profil !== 'Semua Jenis Profil' &&
        String(item.jenis_profil || '').trim().toLowerCase() !== filters.jenis_profil.trim().toLowerCase()
      ) {
        return false;
      }
      if (activeDrillDown.field && activeDrillDown.value && activeDrillDown.field !== 'all') {
        const itemVal = item[activeDrillDown.field];
        if (itemVal !== activeDrillDown.value) {
          return false;
        }
      }
      return true;
    });
  }, [rawItems, summaryItems, filters, activeDrillDown]);

  // Filter summary matrix rows (Sheet 2025 & Sheet 2026 matrix) by Provinsi & Tahun
  const filteredMatrixRows = useMemo(() => {
    return summaryMatrixRows.filter((row) => {
      if (
        filters.provinsi !== 'Semua Provinsi' &&
        String(row.provinsi || '').trim().toLowerCase() !== filters.provinsi.trim().toLowerCase()
      ) {
        return false;
      }
      if (
        filters.tahun !== 'Semua Tahun' &&
        String(row.tahun || '').trim() !== String(filters.tahun || '').trim()
      ) {
        return false;
      }
      return true;
    });
  }, [summaryMatrixRows, filters.provinsi, filters.tahun]);

  // Compute KPI Stats directly from summary matrix rows (Sheet 2025 & Sheet 2026)
  const kpiStats: KPIStats = useMemo(() => {
    const isRegulerOnly = filters.jenis_profil === 'Reguler';
    const isIbmOnly = filters.jenis_profil === 'IBM';

    let targetReguler = 0;
    let targetIBM = 0;

    let sudahUploadReguler = 0;
    let sudahUploadIBM = 0;

    let disetujuiReguler = 0;
    let disetujuiIBM = 0;

    let perluPerbaikanReguler = 0;
    let perluPerbaikanIBM = 0;

    let belumUploadReguler = 0;
    let belumUploadIBM = 0;

    filteredMatrixRows.forEach((row) => {
      targetReguler += Number(row.regTarget || 0);
      sudahUploadReguler += Number(row.regUploaded || 0);
      disetujuiReguler += Number(row.regApproved || 0);
      perluPerbaikanReguler += Number(row.regRevision || 0);
      belumUploadReguler += Number(row.regUnuploaded || 0);

      targetIBM += Number(row.ibmTarget || 0);
      sudahUploadIBM += Number(row.ibmUploaded || 0);
      disetujuiIBM += Number(row.ibmApproved || 0);
      perluPerbaikanIBM += Number(row.ibmRevision || 0);
      belumUploadIBM += Number(row.ibmUnuploaded || 0);
    });

    // Data mengacu kepada kolom Profil Reguler Target Sesuai iEmon dan Profil Reguler Sudah Diupload
    // Jika filter IBM dipilih, maka mengacu ke kolom Profil IBM
    const targetIEmon = isIbmOnly
      ? targetIBM
      : targetReguler;

    const sudahUpload = isIbmOnly
      ? sudahUploadIBM
      : sudahUploadReguler;

    // Disetujui diisi dari kolom Profil Reguler Disetujui / Profil IBM Disetujui
    const disetujui = isIbmOnly
      ? disetujuiIBM
      : disetujuiReguler;

    // Perlu Perbaikan diisi dari kolom Profil Reguler Perlu Perbaikan / Profil IBM Perlu Perbaikan
    const perluPerbaikan = isIbmOnly
      ? perluPerbaikanIBM
      : perluPerbaikanReguler;

    const belumUpload = isIbmOnly
      ? belumUploadIBM
      : belumUploadReguler;

    const belumDiverifikasi = Math.max(0, sudahUpload - (disetujui + perluPerbaikan));

    // Persentase Keterisian diisi dari kolom Profil Reguler % Keterisian / Profil IBM % Keterisian
    const persentaseKeterisianReguler =
      targetReguler > 0 ? (sudahUploadReguler / targetReguler) * 100 : 0;
    const persentaseKeterisianIBM =
      targetIBM > 0 ? (sudahUploadIBM / targetIBM) * 100 : 0;

    const persentaseKeterisian = isIbmOnly
      ? persentaseKeterisianIBM
      : persentaseKeterisianReguler;

    return {
      targetIEmon,
      targetReguler,
      targetIBM,

      sudahUpload,
      sudahUploadReguler,
      sudahUploadIBM,

      disetujui,
      disetujuiReguler,
      disetujuiIBM,

      perluPerbaikan,
      perluPerbaikanReguler,
      perluPerbaikanIBM,

      belumUpload,
      belumUploadReguler,
      belumUploadIBM,

      belumDiverifikasi,
      persentaseKeterisian,
      persentaseKeterisianReguler,
      persentaseKeterisianIBM
    };
  }, [filteredMatrixRows, filters.jenis_profil]);

  // Clear Drill Down Filter
  const handleClearDrillDown = () => {
    setActiveDrillDown({ field: null, value: null, label: null });
  };

  const handleResetAllFilters = () => {
    setFilters({
      provinsi: 'Semua Provinsi',
      tahun: 'Semua Tahun',
      jenis_profil: 'Semua Jenis Profil'
    });
    setActiveDrillDown({ field: null, value: null, label: null });
  };

  return (
    <div className="min-h-screen bg-white text-[#132324] flex flex-col font-sans antialiased selection:bg-[#D3853E] selection:text-white">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="Loading Dashboard..." />}

      {/* Header */}
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onFileUpload={handleFileUpload}
        onResetToSample={handleResetToSample}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenPresentation={() => setIsPresentationModalOpen(true)}
        activeFileName={activeFileName}
        totalRecords={rawItems.length}
        scannedYears={availableYears}
        ignoredSheetsCount={ignoredSheetsCount}
        isLoading={isLoading}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Code Generated Modal */}
      <CodeGeneratedModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        generatedCode={generatedCode}
        activeFileName={activeFileName}
      />

      {/* Presentation Deck Modal */}
      <PresentationModal
        isOpen={isPresentationModalOpen}
        onClose={() => setIsPresentationModalOpen(false)}
        rawItems={rawItems}
        matrixRows={summaryMatrixRows}
        kpiStats={kpiStats}
        currentFilters={filters}
        availableProvinces={availableProvinces}
        availableYears={availableYears}
        availableProfileTypes={availableProfileTypes}
        uploadTimestamp={uploadTimestamp}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Page Switcher Navigation Bar */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#1F3E47]/20 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-[#1F3E47]/5 rounded-xl border border-[#1F3E47]/10">
            <button
              onClick={() => {
                setCurrentPage('detail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentPage === 'detail'
                  ? 'bg-[#1F3E47] text-white shadow-xs'
                  : 'text-[#132324]/70 hover:bg-[#1F3E47]/10 hover:text-[#132324]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                currentPage === 'detail' ? 'bg-white/25 text-white' : 'bg-[#1F3E47]/15 text-[#132324]'
              }`}>
                1
              </span>
              <Table className="w-4 h-4" />
              <span>Detail Profil & KPI</span>
            </button>
            <button
              onClick={() => {
                setCurrentPage('rekap');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentPage === 'rekap'
                  ? 'bg-[#D3853E] text-white shadow-xs'
                  : 'text-[#132324]/70 hover:bg-[#D3853E]/10 hover:text-[#132324]'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                currentPage === 'rekap' ? 'bg-white/25 text-white' : 'bg-[#D3853E]/20 text-[#132324]'
              }`}>
                2
              </span>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Rekapitulasi & Grafik</span>
            </button>
          </div>

          {/* Quick Page Jump Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-semibold text-[#132324]/60 hidden md:inline">
              Halaman Aktif: <strong className="text-[#132324]">{currentPage === 'detail' ? '1 / 2 (Detail Data)' : '2 / 2 (Rekapitulasi & Grafik)'}</strong>
            </span>
            {currentPage === 'detail' ? (
              <button
                onClick={() => {
                  setCurrentPage('rekap');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 bg-[#D3853E] hover:bg-[#be7331] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Halaman Selanjutnya (Rekapitulasi)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentPage('detail');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 bg-[#1F3E47] hover:bg-[#284e5a] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Halaman Sebelumnya (Detail Data)</span>
              </button>
            )}
          </div>
        </div>

        {/* HALAMAN 1: DETAIL DATA & KPI */}
        {currentPage === 'detail' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter Section */}
            <Filters
              filters={filters}
              availableProvinces={availableProvinces}
              availableYears={availableYears}
              availableProfileTypes={availableProfileTypes}
              onFilterChange={setFilters}
              onResetFilters={handleResetAllFilters}
              activeDrillDownLabel={activeDrillDown.label}
              onClearDrillDown={handleClearDrillDown}
              filteredCount={filteredRawItems.length}
              totalCount={rawItems.length}
            />

            {/* 6 Interactive KPI Cards */}
            <section>
              <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-[#132324] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D3853E] inline-block"></span>
                  <span>Indikator Kinerja Utama (KPI)</span>
                </h2>
                <span className="text-xs bg-[#1F3E47]/10 text-[#1F3E47] font-semibold px-2.5 py-1 rounded-md border border-[#1F3E47]/20 shadow-2xs">
                  Status : <strong className="font-bold">{uploadTimestamp}</strong>
                </span>
              </div>
              <KPICards
                stats={kpiStats}
                selectedProfileType={filters.jenis_profil}
                selectedYear={filters.tahun}
                selectedProvince={filters.provinsi}
              />
            </section>

            {/* Interactive Data Table */}
            <section>
              <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-[#132324] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5B7161] inline-block"></span>
                  <span>Detail Profil Audiovisual</span>
                </h2>
                <span className="text-xs bg-[#5B7161]/15 text-[#132324] font-semibold px-2.5 py-1 rounded-md border border-[#5B7161]/30 shadow-2xs">
                  Status : <strong className="font-bold">{uploadTimestamp}</strong>
                </span>
              </div>
              <DataTable
                items={filteredRawItems}
                activeDrillDown={activeDrillDown}
                onClearDrillDown={handleClearDrillDown}
              />
            </section>

            {/* Next Page Banner */}
            <div className="mt-8 pt-4 border-t border-[#1F3E47]/15 flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl p-5 border border-[#1F3E47]/15 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-[#D3853E]/15 text-[#D3853E] rounded-xl shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#132324]">Panel Rekapitulasi & Visualisasi Grafik Ada di Halaman Selanjutnya</h3>
                  <p className="text-xs text-[#132324]/60">Buka halaman 2 untuk melihat tabel matriks rekapitulasi per provinsi serta diagram dan perbandingan grafis.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentPage('rekap');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 bg-[#D3853E] hover:bg-[#be7331] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span>Buka Halaman 2 (Rekapitulasi & Grafik)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* HALAMAN 2: PANEL REKAPITULASI & VISUALISASI GRAFIK */}
        {currentPage === 'rekap' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Navigation Banner on Page 2 */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-[#1F3E47]/5 p-3.5 rounded-2xl border border-[#1F3E47]/15">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage('detail');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#132324] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#1F3E47]/20 shadow-2xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#1F3E47]" />
                  <span>Kembali ke Halaman 1 (Detail Data & KPI)</span>
                </button>
                <span className="text-xs text-[#132324]/60 hidden sm:inline">&bull; Halaman 2: Panel Rekapitulasi & Visualisasi</span>
              </div>
              <span className="text-xs bg-[#1F3E47]/10 text-[#1F3E47] font-semibold px-2.5 py-1 rounded-md border border-[#1F3E47]/20">
                Status : <strong className="font-bold">{uploadTimestamp}</strong>
              </span>
            </div>

            {/* Panel Rekapitulasi */}
            <section id="panel-rekapitulasi">
              <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-[#132324] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1F3E47] inline-block"></span>
                  <span>Panel Rekapitulasi Profil Audiovisual</span>
                </h2>
                <span className="text-xs bg-[#1F3E47]/10 text-[#1F3E47] font-semibold px-2.5 py-1 rounded-md border border-[#1F3E47]/20 shadow-2xs">
                  Matriks Per Provinsi
                </span>
              </div>
              <RecapPanel matrixRows={summaryMatrixRows} availableYears={availableYears} />
            </section>

            {/* Visualizations (2x2 Grid) */}
            <section>
              <div className="mb-2.5 flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-[#132324] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D3853E] inline-block"></span>
                  <span>Visualisasi Data & Grafik Interaktif</span>
                </h2>
              </div>
              <ChartsGrid
                filteredItems={filteredSummaryItems}
                stats={kpiStats}
                matrixRows={filteredMatrixRows.length > 0 ? filteredMatrixRows : summaryMatrixRows}
                rawItems={filteredRawItems}
                availableProvinces={availableProvinces}
              />
            </section>

            {/* Bottom Return Button */}
            <div className="pt-4 border-t border-[#1F3E47]/15 flex items-center justify-between flex-wrap gap-4 bg-white rounded-2xl p-5 border border-[#1F3E47]/15 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#132324]">Ingin melihat rincian tabel per paket pekerjaan?</h3>
                <p className="text-xs text-[#132324]/60">Kembali ke Halaman 1 untuk melihat data individual, filter mendalam, dan status kelengkapan dokumen.</p>
              </div>
              <button
                onClick={() => {
                  setCurrentPage('detail');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 bg-[#1F3E47] hover:bg-[#284e5a] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Halaman 1 (Detail Profil & KPI)</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#132324] text-[#E3D5B0] border-t border-[#1F3E47] py-5 mt-8 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs font-medium tracking-wide">
          Dashboard Profil Audiovisual &bull; Direktorat Cipta Karya &bull; Kementerian PUPR &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

