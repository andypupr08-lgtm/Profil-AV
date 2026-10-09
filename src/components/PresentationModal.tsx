import React, { useState } from 'react';
import { 
  X, Presentation, Sliders, CheckSquare, Maximize2, Minimize2, 
  ChevronLeft, ChevronRight, Printer, Copy, Check, Filter, ArrowDownUp,
  Sparkles, FileText, Building2, Calendar, 
  User, PieChart, Table, Edit3, Target, ArrowRight, ShieldAlert, Award,
  Plus, Trash2, Layout, Type, Palette, Clock,
  BarChart3, CheckCircle2, FileCode, SlidersHorizontal, ArrowUpRight, ArrowDownRight,
  GitCompare, Layers, Tag, Bookmark
} from 'lucide-react';
import { ProfilItem, SummaryMatrixRow, KPIStats, FilterState } from '../types';
import { getProvinceBPBPKIndex } from '../utils/provinces';
import { PuLogoSvg } from './PuLogoSvg';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawItems: ProfilItem[];
  matrixRows: SummaryMatrixRow[];
  kpiStats: KPIStats;
  currentFilters: FilterState;
  availableProvinces: string[];
  availableYears: string[];
  availableProfileTypes: string[];
  uploadTimestamp: string;
}

interface CustomSlideItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  metricLabel?: string;
  metricValue?: string;
  statusBadge?: string;
  enabled: boolean;
}

export interface SlideManualConfig {
  customTitle?: string;
  customSubtitle?: string;
  narrativeNotes?: string;
  metricLabel?: string;
  metricValue?: string;
  statusBadge?: string;
  leadershipFocus?: string;
  enabledCustomBlock?: boolean;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  rawItems,
  matrixRows,
  currentFilters,
  availableProvinces,
  availableYears,
  availableProfileTypes,
  uploadTimestamp
}) => {
  if (!isOpen) return null;

  // ------------------- IDENTITAS & HEADER PAPARAN -------------------
  const [judulPaparan, setJudulPaparan] = useState('LAPORAN EVALUASI PROFIL AUDIOVISUAL');
  const [pemapar, setPemapar] = useState('Tim Pembina Profil Audiovisual');
  const [instansi, setInstansi] = useState('Direktorat Jenderal Cipta Karya - Kementerian Pekerjaan Umum');
  const [tanggalPaparan, setTanggalPaparan] = useState(() => new Date().toISOString().split('T')[0]);
  const [audiens, setAudiens] = useState('Rapat Koordinasi & Evaluasi Pimpinan');

  // ------------------- FILTER SCOPE DATA -------------------
  const [filterTahun, setFilterTahun] = useState(currentFilters.tahun || 'Semua Tahun');
  const [filterProvinsi, setFilterProvinsi] = useState(currentFilters.provinsi || 'Semua Provinsi');
  const [filterJenisProfil, setFilterJenisProfil] = useState(currentFilters.jenis_profil || 'Semua Jenis Profil');

  // ------------------- FILTER PARAMETER OLAHAN DATA SLIDE -------------------
  const [filterStatusVerifikasi, setFilterStatusVerifikasi] = useState<string>('Semua Status');
  const [filterSortMatriks, setFilterSortMatriks] = useState<'default' | 'keterisian_asc' | 'keterisian_desc' | 'target_desc' | 'nama_asc'>('default');
  const [filterAmbangProgress, setFilterAmbangProgress] = useState<'semua' | 'kritis' | 'sedang' | 'optimal'>('semua');
  const [filterMaxRowDisplay, setFilterMaxRowDisplay] = useState<number>(12);
  const [filterMinTarget, setFilterMinTarget] = useState<number>(0);

  // ------------------- FILTER KOMPARASI DATA -------------------
  const [compareType, setCompareType] = useState<'tahun' | 'provinsi' | 'jenis_profil'>('tahun');
  const [compareBase, setCompareBase] = useState<string>(() => availableYears[0] || '2025');
  const [compareTarget, setCompareTarget] = useState<string>(() => availableYears[1] || availableYears[0] || '2026');

  // ------------------- DESAIN & DESAIN LAYOUT PPT -------------------
  const [layoutTemplate, setLayoutTemplate] = useState<'corporate-pu' | 'clean-light' | 'high-contrast' | 'emerald' | 'gold-luxury'>('corporate-pu');
  const [slideRatio, setSlideRatio] = useState<'16:9' | '4:3' | '16:10'>('16:9');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [bgPattern, setBgPattern] = useState<'gradient-blur' | 'flat' | 'grid-dots' | 'glass'>('gradient-blur');

  // ------------------- MODUL SLIDE BUILT-IN CHECKLIST -------------------
  const [enabledSlides, setEnabledSlides] = useState({
    cover: true,
    executiveSummary: true,
    comparisonAnalytics: true, // Slide Olah Data Komparasi Analytic
    recapMatrix: true,
    charts: true,
    sectorComparison: true,
    trendAnalysis: true,
    criticalPackages: true,
    recommendations: true,
    nextSteps: true
  });

  // ------------------- MODUL SLIDE CUSTOM / KEBUTUHAN KHUSUS -------------------
  const [customSlides, setCustomSlides] = useState<CustomSlideItem[]>([
    {
      id: 'custom-1',
      title: 'Kebutuhan Khusus: Kendala Aksesibilitas Lapangan',
      subtitle: 'Catatan Khusus Satker & Balai',
      content: "• Beberapa lokasi pekerjaan di wilayah terpencil memerlukan koneksi satelit tambahan untuk mempercepat pengunggahan media video 4K.\n• Tim verifikator balai menjadwalkan pendampingan langsung pada minggu kedua.\n• Penyesuaian format kompresi video disepakati maksimal 500MB per berkas.",
      metricLabel: 'Atensi Balai Lapangan',
      metricValue: '12 Lokasi Satker',
      statusBadge: 'PRIORITAS TINGGI',
      enabled: true
    }
  ]);

  // State untuk form penambahan & pengeditan slide custom
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('');
  const [newSlideContent, setNewSlideContent] = useState('');
  const [newMetricLabel, setNewMetricLabel] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newStatusBadge, setNewStatusBadge] = useState('CATATAN KHUSUS');
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);

  // ------------------- ISIAN KEBUTUHAN MANUAL PER SLIDE -------------------
  const [slideManualConfigs, setSlideManualConfigs] = useState<Record<string, SlideManualConfig>>({
    cover: {
      customTitle: '',
      customSubtitle: '',
      narrativeNotes: '• Dokumen Paparan Resmi Eksekutif Profil Audiovisual iEmon Cipta Karya.\n• Disajikan untuk evaluasi pimpinan Kementerian Pekerjaan Umum Ditjen Cipta Karya.',
      enabledCustomBlock: true
    },
    summary: {
      customTitle: '',
      narrativeNotes: "• Capaian keterisian nasional melampaui target triwulan berjalan.\n• 3 Provinsi teratas (Jawa Barat, DKI Jakarta, Jawa Tengah) telah mencapai 100% verifikasi disetujui.\n• Diharapkan pemantauan ekstra untuk paket berstatus Perlu Perbaikan.",
      leadershipFocus: "Instruksi Pimpinan: Tuntaskan perbaikan berkas audiovisual sebelum Rapat Evaluasi Bulanan Ditjen Cipta Karya.",
      statusBadge: "ANALISIS EKSEKUTIF",
      metricLabel: "Status Capaian KPI",
      metricValue: "Memenuhi Target",
      enabledCustomBlock: true
    },
    recapMatrix: {
      narrativeNotes: "• Rekapitulasi disajikan sesuai pengurutan matriks dan filter ambang batas yang aktif.\n• Provinsi dengan progress < 50% mendapatkan asistensi teknis verifikasi langsung dari Balai.",
      leadershipFocus: "Balai Prasarana Permukiman Wilayah agar berkoordinasi langsung dengan Satker terkait.",
      statusBadge: "CATATAN REKAP",
      enabledCustomBlock: true
    },
    criticalPackages: {
      narrativeNotes: "• Kebanyakan kendala berada pada resolusi video kurang dari 1080p dan dokumen pendukung yang belum ditandatangani.\n• Tim IT Balai telah memfasilitasi pendampingan teknis re-upload.",
      leadershipFocus: "Target Perbaikan: Maksimal 3x24 jam setelah catatan verifikasi diterbitkan.",
      statusBadge: "PRIORITAS TINGGI",
      metricLabel: "Batas Tindak Lanjut",
      metricValue: "3 x 24 Jam",
      enabledCustomBlock: true
    }
  });

  const [selectedSlideForManualEdit, setSelectedSlideForManualEdit] = useState<string>('summary');
  const [showQuickManualModal, setShowQuickManualModal] = useState<boolean>(false);

  // Helper untuk update config manual per slide
  const updateSlideManualConfig = (slideId: string, updates: Partial<SlideManualConfig>) => {
    setSlideManualConfigs(prev => ({
      ...prev,
      [slideId]: {
        ...(prev[slideId] || { enabledCustomBlock: true }),
        ...updates
      }
    }));
  };

  // Helper renderer block manual per slide
  const renderSlideManualBlock = (slideId: string) => {
    const config = slideManualConfigs[slideId];
    if (!config || config.enabledCustomBlock === false) return null;

    const hasNotes = config.narrativeNotes && config.narrativeNotes.trim().length > 0;
    const hasMetric = config.metricLabel && config.metricValue;
    const hasLeadership = config.leadershipFocus && config.leadershipFocus.trim().length > 0;

    if (!hasNotes && !hasMetric && !hasLeadership) return null;

    const noteLines = hasNotes
      ? config.narrativeNotes!.split('\n').filter(l => l.trim().length > 0)
      : [];

    return (
      <div className="p-3.5 sm:p-4 rounded-xl bg-current/5 border border-current/15 space-y-2.5 mt-3 text-left">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-[#D3853E]" /> Catatan &amp; Isian Manual Slide
          </h4>
          {config.statusBadge && (
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#D3853E]/20 text-[#D3853E] border border-[#D3853E]/40">
              {config.statusBadge}
            </span>
          )}
        </div>

        {/* Metric Highlight Box */}
        {hasMetric && (
          <div className="p-2.5 rounded-lg bg-[#5B7161]/15 border border-[#5B7161]/40 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-[#5B7161]">{config.metricLabel}</p>
              <p className="text-base font-black text-current mt-0.5">{config.metricValue}</p>
            </div>
            <Bookmark className="w-5 h-5 text-[#5B7161]" />
          </div>
        )}

        {/* Narrative Lines */}
        {hasNotes && (
          <div className="space-y-1 text-xs opacity-95">
            {noteLines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#D3853E] font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{line.replace(/^[•\-\*]\s*/, '')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Leadership Focus Note */}
        {hasLeadership && (
          <div className="p-2 rounded-lg bg-[#D3853E]/15 border border-[#D3853E]/30 text-xs text-[#D3853E] font-medium flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#D3853E] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase block text-[10px]">Atensi Pimpinan:</span>
              <span>{config.leadershipFocus}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ------------------- CATATAN STRATEGIS & REKOMENDASI -------------------
  const [catatanRekomendasi, setCatatanRekomendasi] = useState(
    "1. Perlunya percepatan pengunggahan materi audiovisual untuk provinsi yang masih berstatus Belum Upload.\n" +
    "2. Paket dengan status Perlu Perbaikan agar segera ditindaklanjuti oleh Balai/Satker terkait.\n" +
    "3. Pemantauan berkala akan dilaksanakan secara real-time melalui Dashboard Profil Audiovisual."
  );

  // ------------------- STATE UI & NAVIGATION -------------------
  const [activeTab, setActiveTab] = useState<'config' | 'presentation'>('presentation');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // ------------------- CALCULATION DATA BASED ON SCOPE & OLAHAN DATA FILTERS -------------------
  const filteredRaw = rawItems.filter(item => {
    if (filterTahun !== 'Semua Tahun' && String(item.tahun) !== String(filterTahun)) return false;
    if (filterProvinsi !== 'Semua Provinsi' && item.provinsi !== filterProvinsi) return false;
    if (filterJenisProfil !== 'Semua Jenis Profil' && item.jenis_profil !== filterJenisProfil) return false;

    // Filter Status Verifikasi / Upload Olahan Data
    if (filterStatusVerifikasi === 'Disetujui' && item.status_verifikasi !== 'Disetujui') return false;
    if (filterStatusVerifikasi === 'Perlu Perbaikan' && item.status_verifikasi !== 'Perlu Perbaikan') return false;
    if (filterStatusVerifikasi === 'Belum Upload' && item.status_upload !== 'Belum Upload') return false;
    if (filterStatusVerifikasi === 'Sudah Upload' && item.status_upload !== 'Sudah Upload') return false;

    return true;
  });

  let filteredMatrix = matrixRows.filter(row => {
    if (filterTahun !== 'Semua Tahun' && String(row.tahun) !== String(filterTahun)) return false;
    if (filterProvinsi !== 'Semua Provinsi' && row.provinsi !== filterProvinsi) return false;

    const rowTarget = (row.regTarget || 0) + (row.ibmTarget || 0);
    const rowApproved = (row.regApproved || 0) + (row.ibmApproved || 0);
    const rowPct = rowTarget > 0 ? (rowApproved / rowTarget) * 100 : 0;

    // Filter Ambang Target Paket Minimum
    if (filterMinTarget > 0 && rowTarget < filterMinTarget) return false;

    // Filter Ambang Progress Keterisian
    if (filterAmbangProgress === 'kritis' && rowPct >= 50) return false;
    if (filterAmbangProgress === 'sedang' && (rowPct < 50 || rowPct > 80)) return false;
    if (filterAmbangProgress === 'optimal' && rowPct <= 80) return false;

    return true;
  });

  // Apply Sorting to Matrix Data
  if (filterSortMatriks === 'keterisian_asc') {
    filteredMatrix = [...filteredMatrix].sort((a, b) => {
      const tgtA = (a.regTarget || 0) + (a.ibmTarget || 0);
      const appA = (a.regApproved || 0) + (a.ibmApproved || 0);
      const pctA = tgtA > 0 ? (appA / tgtA) : 0;

      const tgtB = (b.regTarget || 0) + (b.ibmTarget || 0);
      const appB = (b.regApproved || 0) + (b.ibmApproved || 0);
      const pctB = tgtB > 0 ? (appB / tgtB) : 0;

      return pctA - pctB;
    });
  } else if (filterSortMatriks === 'keterisian_desc') {
    filteredMatrix = [...filteredMatrix].sort((a, b) => {
      const tgtA = (a.regTarget || 0) + (a.ibmTarget || 0);
      const appA = (a.regApproved || 0) + (a.ibmApproved || 0);
      const pctA = tgtA > 0 ? (appA / tgtA) : 0;

      const tgtB = (b.regTarget || 0) + (b.ibmTarget || 0);
      const appB = (b.regApproved || 0) + (b.ibmApproved || 0);
      const pctB = tgtB > 0 ? (appB / tgtB) : 0;

      return pctB - pctA;
    });
  } else if (filterSortMatriks === 'target_desc') {
    filteredMatrix = [...filteredMatrix].sort((a, b) => {
      const tgtA = (a.regTarget || 0) + (a.ibmTarget || 0);
      const tgtB = (b.regTarget || 0) + (b.ibmTarget || 0);
      return tgtB - tgtA;
    });
  } else if (filterSortMatriks === 'nama_asc') {
    filteredMatrix = [...filteredMatrix].sort((a, b) => {
      const idxA = getProvinceBPBPKIndex(a.provinsi);
      const idxB = getProvinceBPBPKIndex(b.provinsi);
      if (idxA !== idxB) return idxA - idxB;
      return a.provinsi.localeCompare(b.provinsi);
    });
  }

  // Calculate Scope Slide Stats
  const targetReg = filteredMatrix.reduce((acc, r) => acc + (r.regTarget || 0), 0);
  const targetIBM = filteredMatrix.reduce((acc, r) => acc + (r.ibmTarget || 0), 0);
  const targetTotal = targetReg + targetIBM;

  const sudahUploadReg = filteredMatrix.reduce((acc, r) => acc + (r.regUploaded || 0), 0);
  const sudahUploadIBM = filteredMatrix.reduce((acc, r) => acc + (r.ibmUploaded || 0), 0);
  const sudahUploadTotal = sudahUploadReg + sudahUploadIBM;

  const disetujuiReg = filteredMatrix.reduce((acc, r) => acc + (r.regApproved || 0), 0);
  const disetujuiIBM = filteredMatrix.reduce((acc, r) => acc + (r.ibmApproved || 0), 0);
  const disetujuiTotal = disetujuiReg + disetujuiIBM;

  const perbaikanReg = filteredMatrix.reduce((acc, r) => acc + (r.regRevision || 0), 0);
  const perbaikanIBM = filteredMatrix.reduce((acc, r) => acc + (r.ibmRevision || 0), 0);
  const perbaikanTotal = perbaikanReg + perbaikanIBM;

  const belumUploadReg = filteredMatrix.reduce((acc, r) => acc + (r.regUnuploaded || 0), 0);
  const belumUploadIBM = filteredMatrix.reduce((acc, r) => acc + (r.ibmUnuploaded || 0), 0);
  const belumUploadTotal = belumUploadReg + belumUploadIBM;

  let keterisianPct = 0;
  if (filterJenisProfil === 'Reguler') {
    keterisianPct = targetReg > 0 ? (disetujuiReg / targetReg) * 100 : 0;
  } else if (filterJenisProfil === 'IBM') {
    keterisianPct = targetIBM > 0 ? (disetujuiIBM / targetIBM) * 100 : 0;
  } else {
    keterisianPct = targetTotal > 0 ? (disetujuiTotal / targetTotal) * 100 : 0;
  }

  // Critical packages list filtered with max row limit
  const criticalList = filteredRaw.filter(
    i => i.status_verifikasi === 'Perlu Perbaikan' || i.status_upload === 'Belum Upload'
  ).slice(0, filterMaxRowDisplay);

  // ------------------- OLAH DATA KOMPARASI ANALYTICS CALCULATIONS -------------------
  const getScopeStats = (cType: 'tahun' | 'provinsi' | 'jenis_profil', scopeVal: string) => {
    const scopeRaw = rawItems.filter(item => {
      if (cType === 'tahun') return String(item.tahun) === String(scopeVal);
      if (cType === 'provinsi') return item.provinsi === scopeVal;
      if (cType === 'jenis_profil') return item.jenis_profil === scopeVal;
      return true;
    });

    const scopeMatrix = matrixRows.filter(row => {
      if (cType === 'tahun') return String(row.tahun) === String(scopeVal);
      if (cType === 'provinsi') return row.provinsi === scopeVal;
      return true;
    });

    const tgtTotal = scopeMatrix.reduce((a, r) => a + (r.regTarget || 0) + (r.ibmTarget || 0), 0);
    const uplTotal = scopeMatrix.reduce((a, r) => a + (r.regUploaded || 0) + (r.ibmUploaded || 0), 0);
    const appTotal = scopeMatrix.reduce((a, r) => a + (r.regApproved || 0) + (r.ibmApproved || 0), 0);
    const revTotal = scopeMatrix.reduce((a, r) => a + (r.regRevision || 0) + (r.ibmRevision || 0), 0);
    const unuplTotal = scopeMatrix.reduce((a, r) => a + (r.regUnuploaded || 0) + (r.ibmUnuploaded || 0), 0);
    const ketPct = tgtTotal > 0 ? (appTotal / tgtTotal) * 100 : 0;

    return {
      count: scopeRaw.length,
      targetTotal: tgtTotal,
      uploadedTotal: uplTotal,
      approvedTotal: appTotal,
      revisionTotal: revTotal,
      unuploadedTotal: unuplTotal,
      keterisianPct: ketPct
    };
  };

  const baseStats = getScopeStats(compareType, compareBase);
  const targetStats = getScopeStats(compareType, compareTarget);

  const deltaTarget = targetStats.targetTotal - baseStats.targetTotal;
  const deltaUploaded = targetStats.uploadedTotal - baseStats.uploadedTotal;
  const deltaApproved = targetStats.approvedTotal - baseStats.approvedTotal;
  const deltaRevision = targetStats.revisionTotal - baseStats.revisionTotal;
  const deltaUnuploaded = targetStats.unuploadedTotal - baseStats.unuploadedTotal;
  const deltaKeterisian = targetStats.keterisianPct - baseStats.keterisianPct;

  // Function to Add / Edit Custom Slide
  const handleSaveCustomSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideTitle.trim()) return;

    if (editingSlideId) {
      // Edit existing
      setCustomSlides(prev => prev.map(s => {
        if (s.id === editingSlideId) {
          return {
            ...s,
            title: newSlideTitle.trim(),
            subtitle: newSlideSubtitle.trim() || 'Kebutuhan Slide Khusus',
            content: newSlideContent.trim(),
            metricLabel: newMetricLabel.trim() || undefined,
            metricValue: newMetricValue.trim() || undefined,
            statusBadge: newStatusBadge.trim() || undefined
          };
        }
        return s;
      }));
      setEditingSlideId(null);
    } else {
      // Add new
      const newSlide: CustomSlideItem = {
        id: `custom-${Date.now()}`,
        title: newSlideTitle.trim(),
        subtitle: newSlideSubtitle.trim() || 'Kebutuhan Slide Khusus',
        content: newSlideContent.trim() || 'Belum ada rincian poin.',
        metricLabel: newMetricLabel.trim() || undefined,
        metricValue: newMetricValue.trim() || undefined,
        statusBadge: newStatusBadge.trim() || undefined,
        enabled: true
      };
      setCustomSlides(prev => [...prev, newSlide]);
    }

    setNewSlideTitle('');
    setNewSlideSubtitle('');
    setNewSlideContent('');
    setNewMetricLabel('');
    setNewMetricValue('');
    setNewStatusBadge('CATATAN KHUSUS');
    setShowAddCustomForm(false);
  };

  const handleStartEditCustomSlide = (slide: CustomSlideItem) => {
    setEditingSlideId(slide.id);
    setNewSlideTitle(slide.title);
    setNewSlideSubtitle(slide.subtitle);
    setNewSlideContent(slide.content);
    setNewMetricLabel(slide.metricLabel || '');
    setNewMetricValue(slide.metricValue || '');
    setNewStatusBadge(slide.statusBadge || 'CATATAN KHUSUS');
    setShowAddCustomForm(true);
  };

  const handleRemoveCustomSlide = (id: string) => {
    setCustomSlides(prev => prev.filter(s => s.id !== id));
    if (editingSlideId === id) setEditingSlideId(null);
  };

  const handleToggleCustomSlide = (id: string) => {
    setCustomSlides(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  // ------------------- BUILD ACTIVE SLIDE LIST -------------------
  const slideList: { id: string; title: string; render: () => React.ReactNode }[] = [];

  // SLIDE 1: COVER
  if (enabledSlides.cover) {
    slideList.push({
      id: 'cover',
      title: 'Halaman Cover Utama',
      render: () => (
        <div className="h-full flex flex-col justify-between p-8 sm:p-12 text-center relative overflow-hidden">
          {bgPattern === 'gradient-blur' && (
            <>
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#D3853E]/15 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#5B7161]/15 rounded-full blur-3xl -z-10"></div>
            </>
          )}
          {bgPattern === 'grid-dots' && (
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 -z-10"></div>
          )}
          
          <div className="flex items-center justify-between w-full border-b border-current/15 pb-6">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-current/20 bg-[#002299] p-1 shadow-lg shrink-0">
                <PuLogoSvg className="w-full h-full" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase opacity-90">Kementerian Pekerjaan Umum</p>
                <p className="text-sm font-extrabold">Direktorat Jenderal Cipta Karya</p>
              </div>
            </div>
            <span className="text-xs bg-current/10 px-3 py-1.5 rounded-full border border-current/20 font-mono font-semibold">
              Status: {uploadTimestamp}
            </span>
          </div>

          <div className="my-auto py-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D3853E]/20 text-[#D3853E] border border-[#D3853E]/40 text-xs font-bold uppercase tracking-wider mb-4">
              <Presentation className="w-3.5 h-3.5" /> Slide Paparan Resmi Eksekutif
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
              {judulPaparan}
            </h1>
            <p className="text-sm sm:text-base opacity-80 mt-3 max-w-2xl mx-auto font-medium">
              Filter Scope: <span className="font-bold">{filterTahun}</span> &bull; <span className="font-bold">{filterProvinsi}</span> &bull; <span className="font-bold">{filterJenisProfil}</span>
            </p>
          </div>

          <div className="pt-6 border-t border-current/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs">
            <div className="p-3 bg-current/5 rounded-xl border border-current/10">
              <p className="text-xs opacity-60 flex items-center gap-1.5 font-medium"><User className="w-3.5 h-3.5 text-[#D3853E]" /> Pemapar / Penyusun</p>
              <p className="font-bold text-sm mt-0.5">{pemapar}</p>
            </div>
            <div className="p-3 bg-current/5 rounded-xl border border-current/10">
              <p className="text-xs opacity-60 flex items-center gap-1.5 font-medium"><Building2 className="w-3.5 h-3.5 text-[#5B7161]" /> Instansi / Unit</p>
              <p className="font-bold text-sm mt-0.5">{instansi}</p>
            </div>
            <div className="p-3 bg-current/5 rounded-xl border border-current/10">
              <p className="text-xs opacity-60 flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5 text-[#D3853E]" /> Tanggal &amp; Audiens</p>
              <p className="font-bold text-sm mt-0.5">{tanggalPaparan} &bull; {audiens}</p>
            </div>
          </div>

          {renderSlideManualBlock('cover')}
        </div>
      )
    });
  }

  // SLIDE 2: EXECUTIVE SUMMARY & KPI
  if (enabledSlides.executiveSummary) {
    slideList.push({
      id: 'summary',
      title: 'Executive Summary & KPI',
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-10 space-y-4">
          <div className="flex items-center justify-between border-b border-current/15 pb-4">
            <div>
              <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Executive Summary</span>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-[#D3853E]" />
                Ringkasan Capaian Indikator Kinerja Utama (KPI)
              </h2>
            </div>
            <span className="text-xs bg-[#5B7161]/30 text-[#5B7161] px-3.5 py-1.5 rounded-lg border border-[#5B7161]/50 font-bold">
              Keterisian: {keterisianPct.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 my-auto">
            <div className="p-4 rounded-xl bg-current/5 border border-current/10 flex flex-col justify-between">
              <p className="text-xs opacity-70 font-semibold">Total Target iEmon</p>
              <p className="text-2xl sm:text-3xl font-black text-[#D3853E] my-2">{targetTotal}</p>
              <p className="text-[11px] opacity-60 font-medium">Reg: {targetReg} &bull; IBM: {targetIBM}</p>
            </div>
            <div className="p-4 rounded-xl bg-current/5 border border-current/10 flex flex-col justify-between">
              <p className="text-xs opacity-70 font-semibold">Sudah Upload</p>
              <p className="text-2xl sm:text-3xl font-black text-[#5B7161] my-2">{sudahUploadTotal}</p>
              <p className="text-[11px] opacity-60 font-medium">Reg: {sudahUploadReg} &bull; IBM: {sudahUploadIBM}</p>
            </div>
            <div className="p-4 rounded-xl bg-current/5 border border-current/10 flex flex-col justify-between">
              <p className="text-xs opacity-70 font-semibold">Disetujui</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-500 my-2">{disetujuiTotal}</p>
              <p className="text-[11px] opacity-60 font-medium">Reg: {disetujuiReg} &bull; IBM: {disetujuiIBM}</p>
            </div>
            <div className="p-4 rounded-xl bg-current/5 border border-current/10 flex flex-col justify-between">
              <p className="text-xs opacity-70 font-semibold">Perlu Perbaikan</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-500 my-2">{perbaikanTotal}</p>
              <p className="text-[11px] opacity-60 font-medium">Reg: {perbaikanReg} &bull; IBM: {perbaikanIBM}</p>
            </div>
            <div className="p-4 rounded-xl bg-current/5 border border-current/10 flex flex-col justify-between">
              <p className="text-xs opacity-70 font-semibold">Belum Upload</p>
              <p className="text-2xl sm:text-3xl font-black text-rose-500 my-2">{belumUploadTotal}</p>
              <p className="text-[11px] opacity-60 font-medium">Reg: {belumUploadReg} &bull; IBM: {belumUploadIBM}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#D3853E]/20 border border-[#D3853E]/50 flex flex-col justify-between">
              <p className="text-xs font-bold text-[#D3853E]">Persentase Keterisian</p>
              <p className="text-2xl sm:text-3xl font-black text-current my-2">{keterisianPct.toFixed(2)}%</p>
              <p className="text-[10px] opacity-80">
                {filterJenisProfil === 'Reguler' ? 'Disetujui Reguler / Target Reguler' :
                 filterJenisProfil === 'IBM' ? 'Disetujui IBM / Target IBM' :
                 'Disetujui / Target iEmon'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-current/5 border border-current/10 text-xs leading-relaxed space-y-1">
            <p className="font-bold text-[#D3853E] uppercase tracking-wide">Ringkasan Status Nasional:</p>
            <p className="opacity-90">
              Dari total <strong>{targetTotal} paket target</strong> ({targetReg} Reguler &amp; {targetIBM} IBM) di scope <strong>{filterProvinsi}</strong>, sebanyak <strong>{sudahUploadTotal} paket ({targetTotal > 0 ? ((sudahUploadTotal/targetTotal)*100).toFixed(1) : 0}%)</strong> telah berhasil diunggah. Sebanyak <strong>{disetujuiTotal} paket</strong> telah disetujui penuh, sementara <strong>{perbaikanTotal} paket</strong> membutuhkan perbaikan dan <strong>{belumUploadTotal} paket</strong> belum diunggah.
            </p>
          </div>

          {renderSlideManualBlock('summary')}
        </div>
      )
    });
  }

  // SLIDE NEW: OLAH DATA KOMPARASI ANALYTICS
  if (enabledSlides.comparisonAnalytics) {
    slideList.push({
      id: 'comparison-analytics',
      title: 'Olah Data Komparasi Analytics',
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between border-b border-current/15 pb-3">
            <div>
              <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-[#D3853E]" /> Slide Analytics Olah Data Komparasi
              </span>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Analisis Variasi: <span className="text-[#D3853E]">{compareBase}</span> vs <span className="text-emerald-500">{compareTarget}</span> ({compareType.toUpperCase()})
              </h2>
            </div>
            <span className="text-xs bg-[#D3853E]/20 text-[#D3853E] px-2.5 py-1 rounded-md border border-[#D3853E]/40 font-bold">
              Delta Keterisian: {deltaKeterisian >= 0 ? '+' : ''}{deltaKeterisian.toFixed(2)}%
            </span>
          </div>

          {/* 3-Column Comparative Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto text-xs">
            {/* Base Scope Card */}
            <div className="p-4 rounded-xl bg-current/5 border border-current/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase opacity-70">BASELINE DATA</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D3853E]/20 text-[#D3853E]">{compareBase}</span>
              </div>
              <p className="text-2xl font-black text-[#D3853E]">{baseStats.keterisianPct.toFixed(2)}%</p>
              <div className="space-y-1 text-[11px] opacity-80 pt-1 border-t border-current/10">
                <div className="flex justify-between"><span>Target:</span> <span className="font-bold">{baseStats.targetTotal}</span></div>
                <div className="flex justify-between"><span>Disetujui:</span> <span className="font-bold text-emerald-500">{baseStats.approvedTotal}</span></div>
                <div className="flex justify-between"><span>Perlu Perbaikan:</span> <span className="font-bold text-amber-500">{baseStats.revisionTotal}</span></div>
                <div className="flex justify-between"><span>Belum Upload:</span> <span className="font-bold text-rose-500">{baseStats.unuploadedTotal}</span></div>
              </div>
            </div>

            {/* Delta / Growth Card */}
            <div className="p-4 rounded-xl bg-[#D3853E]/10 border border-[#D3853E]/30 space-y-2 text-center">
              <span className="text-[11px] font-bold uppercase text-[#D3853E] flex items-center justify-center gap-1">
                <GitCompare className="w-3.5 h-3.5" /> VARIANCE / DELTA
              </span>
              <div className="flex items-center justify-center gap-1 my-1">
                {deltaKeterisian >= 0 ? (
                  <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-6 h-6 text-rose-500" />
                )}
                <p className={`text-2xl font-black ${deltaKeterisian >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {deltaKeterisian >= 0 ? '+' : ''}{deltaKeterisian.toFixed(2)}%
                </p>
              </div>
              <div className="space-y-1 text-[11px] opacity-90 pt-1 border-t border-current/10 text-left">
                <div className="flex justify-between"><span>Selisih Target:</span> <span className="font-bold">{deltaTarget >= 0 ? '+' : ''}{deltaTarget}</span></div>
                <div className="flex justify-between"><span>Selisih Disetujui:</span> <span className="font-bold text-emerald-500">{deltaApproved >= 0 ? '+' : ''}{deltaApproved}</span></div>
                <div className="flex justify-between"><span>Selisih Revisi:</span> <span className="font-bold text-amber-500">{deltaRevision >= 0 ? '+' : ''}{deltaRevision}</span></div>
              </div>
            </div>

            {/* Target Scope Card */}
            <div className="p-4 rounded-xl bg-current/5 border border-current/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase opacity-70">TARGET DATA</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500">{compareTarget}</span>
              </div>
              <p className="text-2xl font-black text-emerald-500">{targetStats.keterisianPct.toFixed(2)}%</p>
              <div className="space-y-1 text-[11px] opacity-80 pt-1 border-t border-current/10">
                <div className="flex justify-between"><span>Target:</span> <span className="font-bold">{targetStats.targetTotal}</span></div>
                <div className="flex justify-between"><span>Disetujui:</span> <span className="font-bold text-emerald-500">{targetStats.approvedTotal}</span></div>
                <div className="flex justify-between"><span>Perlu Perbaikan:</span> <span className="font-bold text-amber-500">{targetStats.revisionTotal}</span></div>
                <div className="flex justify-between"><span>Belum Upload:</span> <span className="font-bold text-rose-500">{targetStats.unuploadedTotal}</span></div>
              </div>
            </div>
          </div>

          {/* Analytical Takeaway Box */}
          <div className="p-3.5 rounded-xl bg-current/5 border border-current/15 text-xs space-y-1">
            <p className="font-bold text-[#D3853E] uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Kesimpulan Olah Data Komparasi:
            </p>
            <p className="opacity-90 leading-relaxed">
              Hasil pengolahan data menunjukkan perbandingan antara <strong>{compareBase}</strong> (Keterisian {baseStats.keterisianPct.toFixed(1)}%) dan <strong>{compareTarget}</strong> (Keterisian {targetStats.keterisianPct.toFixed(1)}%). 
              Terdapat perubahan volume paket disetujui sebesar <strong>{deltaApproved >= 0 ? `+${deltaApproved}` : deltaApproved} paket</strong> dengan selisih tingkat keterisian nasional sebesar <strong>{deltaKeterisian >= 0 ? `+${deltaKeterisian.toFixed(2)}%` : `${deltaKeterisian.toFixed(2)}%`}</strong>.
            </p>
          </div>

          {renderSlideManualBlock('comparison-analytics')}
        </div>
      )
    });
  }

  // SLIDE 3: MATRIKS REKAPITULASI PROVINSI
  if (enabledSlides.recapMatrix) {
    slideList.push({
      id: 'matrix',
      title: 'Matriks Progress per Provinsi',
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between border-b border-current/15 pb-3">
            <div>
              <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Matriks Rekapitulasi</span>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Table className="w-5 h-5 text-[#5B7161]" />
                Rekapitulasi Capaian Per Provinsi ({filteredMatrix.length} Provinsi)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70 font-semibold">Tahun: {filterTahun}</span>
              <span className="text-[10px] bg-[#5B7161]/20 text-[#5B7161] px-2 py-0.5 rounded font-bold border border-[#5B7161]/30">
                Filtered Data
              </span>
            </div>
          </div>

          {/* Active Data Processing Filter Sub-bar */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] bg-current/5 border border-current/10 p-2 rounded-lg opacity-90">
            <span className="font-bold text-[#D3853E] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Olahan Status: <strong>{filterStatusVerifikasi}</strong>
            </span>
            <span>&bull;</span>
            <span>Urutan: <strong>{
              filterSortMatriks === 'keterisian_asc' ? 'Keterisian Terendah' :
              filterSortMatriks === 'keterisian_desc' ? 'Keterisian Tertinggi' :
              filterSortMatriks === 'target_desc' ? 'Target Terbanyak' :
              filterSortMatriks === 'nama_asc' ? 'Nama (A-Z)' : 'Default'
            }</strong></span>
            <span>&bull;</span>
            <span>Ambang: <strong>{filterAmbangProgress.toUpperCase()}</strong></span>
            {filterMinTarget > 0 && (
              <>
                <span>&bull;</span>
                <span>Min Target: <strong>&gt;={filterMinTarget} Paket</strong></span>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] rounded-xl border border-current/15 bg-current/5 text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-current/10 sticky top-0 font-bold border-b border-current/15">
                <tr>
                  <th className="py-2.5 px-3">Provinsi</th>
                  <th className="py-2.5 px-3 text-center">Tahun</th>
                  <th className="py-2.5 px-3 text-center">Target Reg</th>
                  <th className="py-2.5 px-3 text-center">Reg Disetujui</th>
                  <th className="py-2.5 px-3 text-center">Target IBM</th>
                  <th className="py-2.5 px-3 text-center">IBM Disetujui</th>
                  <th className="py-2.5 px-3 text-center font-bold text-[#D3853E]">% Keterisian Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/10">
                {filteredMatrix.slice(0, filterMaxRowDisplay).map((r, idx) => {
                  const totalTgt = (r.regTarget || 0) + (r.ibmTarget || 0);
                  const totalApp = (r.regApproved || 0) + (r.ibmApproved || 0);
                  const pct = totalTgt > 0 ? ((totalApp / totalTgt) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx} className="hover:bg-current/5 transition-colors">
                      <td className="py-2 px-3 font-semibold">{r.provinsi}</td>
                      <td className="py-2 px-3 text-center font-mono opacity-70">{r.tahun}</td>
                      <td className="py-2 px-3 text-center">{r.regTarget}</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-500">{r.regApproved}</td>
                      <td className="py-2 px-3 text-center">{r.ibmTarget}</td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-500">{r.ibmApproved}</td>
                      <td className="py-2 px-3 text-center font-bold text-[#D3853E]">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMatrix.length > filterMaxRowDisplay && (
            <p className="text-[11px] opacity-60 text-right italic">*Menampilkan {filterMaxRowDisplay} provinsi teratas dari total {filteredMatrix.length} provinsi (Filter Olahan Data Aktif).</p>
          )}

          {renderSlideManualBlock('recapMatrix')}
        </div>
      )
    });
  }

  // SLIDE 4: VISUALISASI GRAFIK PROGRESS
  if (enabledSlides.charts) {
    slideList.push({
      id: 'charts',
      title: 'Visualisasi Grafik Progress',
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-current/15 pb-3">
            <div>
              <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Visualisasi Data</span>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#D3853E]" />
                Visualisasi Proporsi &amp; Distribusi Status Upload
              </h2>
            </div>
            <span className="text-xs bg-current/10 px-2.5 py-1 rounded-md font-semibold">Chart Overview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
            <div className="p-4 rounded-xl bg-current/5 border border-current/10 space-y-3">
              <h3 className="text-sm font-bold text-[#D3853E]">Distribusi Realisasi vs Target</h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Target iEmon</span>
                    <span className="font-bold">{targetTotal} Paket</span>
                  </div>
                  <div className="w-full bg-current/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full w-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Sudah Upload ({targetTotal > 0 ? ((sudahUploadTotal/targetTotal)*100).toFixed(1) : 0}%)</span>
                    <span className="font-bold">{sudahUploadTotal} Paket</span>
                  </div>
                  <div className="w-full bg-current/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-[#5B7161] h-full" style={{ width: `${targetTotal > 0 ? (sudahUploadTotal/targetTotal)*100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Disetujui ({targetTotal > 0 ? ((disetujuiTotal/targetTotal)*100).toFixed(1) : 0}%)</span>
                    <span className="font-bold">{disetujuiTotal} Paket</span>
                  </div>
                  <div className="w-full bg-current/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${targetTotal > 0 ? (disetujuiTotal/targetTotal)*100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-current/5 border border-current/10 space-y-3">
              <h3 className="text-sm font-bold text-[#D3853E]">Status Kategori Verifikasi</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg">
                  <p className="text-[11px] opacity-80 font-medium">Disetujui</p>
                  <p className="text-xl font-black text-emerald-500 mt-1">{disetujuiTotal}</p>
                  <p className="text-[10px] opacity-60">Materi Lengkap</p>
                </div>
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg">
                  <p className="text-[11px] opacity-80 font-medium">Perlu Perbaikan</p>
                  <p className="text-xl font-black text-amber-500 mt-1">{perbaikanTotal}</p>
                  <p className="text-[10px] opacity-60">Revisi Satker</p>
                </div>
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg">
                  <p className="text-[11px] opacity-80 font-medium">Belum Upload</p>
                  <p className="text-xl font-black text-rose-500 mt-1">{belumUploadTotal}</p>
                  <p className="text-[10px] opacity-60">Belum Ada Media</p>
                </div>
                <div className="p-3 bg-sky-500/15 border border-sky-500/30 rounded-lg">
                  <p className="text-[11px] opacity-80 font-medium">Keterisian</p>
                  <p className="text-xl font-black text-sky-500 mt-1">{keterisianPct.toFixed(2)}%</p>
                  <p className="text-[10px] opacity-60">Realisasi KPI</p>
                </div>
              </div>
            </div>
          </div>

          {renderSlideManualBlock('charts')}
        </div>
      )
    });
  }

  // SLIDE 5: KOMPARASI SEKTOR REGULER VS IBM
  if (enabledSlides.sectorComparison) {
    slideList.push({
      id: 'sector',
      title: 'Komparasi Profil Reguler vs IBM',
      render: () => {
        const pctReg = targetReg > 0 ? ((disetujuiReg / targetReg) * 100).toFixed(1) : '0.0';
        const pctIBM = targetIBM > 0 ? ((disetujuiIBM / targetIBM) * 100).toFixed(1) : '0.0';

        return (
          <div className="h-full flex flex-col justify-between p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-current/15 pb-3">
              <div>
                <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Komparasi Sektor</span>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#D3853E]" />
                  Perbandingan Capaian Profil Reguler vs IBM
                </h2>
              </div>
              <span className="text-xs bg-current/10 px-2.5 py-1 rounded-md font-semibold">Reguler vs IBM</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-auto">
              {/* Card Reguler */}
              <div className="p-5 rounded-2xl bg-current/5 border border-current/15 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#D3853E] uppercase">PROFIL REGULER</h3>
                  <span className="text-xs font-bold bg-[#D3853E]/20 text-[#D3853E] px-2.5 py-1 rounded-full">
                    Keterisian: {pctReg}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Target Reguler</p>
                    <p className="text-lg font-black mt-0.5">{targetReg} Paket</p>
                  </div>
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Sudah Upload</p>
                    <p className="text-lg font-black text-[#5B7161] mt-0.5">{sudahUploadReg} Paket</p>
                  </div>
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Disetujui</p>
                    <p className="text-lg font-black text-emerald-500 mt-0.5">{disetujuiReg} Paket</p>
                  </div>
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Perlu Perbaikan</p>
                    <p className="text-lg font-black text-amber-500 mt-0.5">{perbaikanReg} Paket</p>
                  </div>
                </div>
              </div>

              {/* Card IBM */}
              <div className="p-5 rounded-2xl bg-current/5 border border-current/15 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#5B7161] uppercase">PROFIL IBM</h3>
                  <span className="text-xs font-bold bg-[#5B7161]/20 text-[#5B7161] px-2.5 py-1 rounded-full">
                    Keterisian: {pctIBM}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Target IBM</p>
                    <p className="text-lg font-black mt-0.5">{targetIBM} Paket</p>
                  </div>
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Sudah Upload</p>
                    <p className="text-lg font-black text-[#5B7161] mt-0.5">{sudahUploadIBM} Paket</p>
                  </div>
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Disetujui</p>
                    <p className="text-lg font-black text-emerald-500 mt-0.5">{disetujuiIBM} Paket</p>
                  </div>
                  <div className="p-2.5 bg-current/5 rounded-xl">
                    <p className="opacity-70 text-[11px]">Perlu Perbaikan</p>
                    <p className="text-lg font-black text-amber-500 mt-0.5">{perbaikanIBM} Paket</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    });
  }

  // SLIDE 6: ANALISIS TREN & RASIO VERIFIKASI
  if (enabledSlides.trendAnalysis) {
    slideList.push({
      id: 'trend',
      title: 'Analisis Kinerja Verifikasi & Tren',
      render: () => {
        const approvalSpeedRatio = sudahUploadTotal > 0 ? ((disetujuiTotal / sudahUploadTotal) * 100).toFixed(1) : '0.0';
        const revisionRatio = sudahUploadTotal > 0 ? ((perbaikanTotal / sudahUploadTotal) * 100).toFixed(1) : '0.0';

        return (
          <div className="h-full flex flex-col justify-between p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-current/15 pb-3">
              <div>
                <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Analisis Tren Kinerja</span>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D3853E]" />
                  Indikator Kecepatan Verifikasi &amp; Quality Control
                </h2>
              </div>
              <span className="text-xs bg-current/10 px-2.5 py-1 rounded-md font-semibold">QC Analytics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto">
              <div className="p-4 rounded-xl bg-current/5 border border-current/15 text-center">
                <p className="text-xs opacity-70 font-semibold">Tingkat Kelulusan Verifikasi</p>
                <p className="text-3xl font-black text-emerald-500 my-2">{approvalSpeedRatio}%</p>
                <p className="text-[11px] opacity-70">Rasio Paket Disetujui dari Total Upload ({disetujuiTotal}/{sudahUploadTotal})</p>
              </div>

              <div className="p-4 rounded-xl bg-current/5 border border-current/15 text-center">
                <p className="text-xs opacity-70 font-semibold">Tingkat Revisi / Catatan</p>
                <p className="text-3xl font-black text-amber-500 my-2">{revisionRatio}%</p>
                <p className="text-[11px] opacity-70">Rasio Perlu Perbaikan dari Total Upload ({perbaikanTotal}/{sudahUploadTotal})</p>
              </div>

              <div className="p-4 rounded-xl bg-current/5 border border-current/15 text-center">
                <p className="text-xs opacity-70 font-semibold">Sisa Belum Diunggah</p>
                <p className="text-3xl font-black text-rose-500 my-2">{belumUploadTotal} Pkt</p>
                <p className="text-[11px] opacity-70">Potensi Penambahan Materi Baru</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-current/5 border border-current/15 text-xs space-y-1">
              <p className="font-bold text-[#D3853E]">Catatan Evaluasi Verifikasi:</p>
              <p className="opacity-90 leading-relaxed">
                Tingkat persetujuan materi berada pada angka <strong>{approvalSpeedRatio}%</strong>. Penanganan catatan perbaikan (<strong>{perbaikanTotal} paket</strong>) disarankan menjadi fokus koordinasi mingguan bersama Balai/Satker untuk meningkatkan tingkat keterisian nasional.
              </p>
            </div>
          </div>
        );
      }
    });
  }

  // SLIDE 7: DAFTAR PAKET KRITIS
  if (enabledSlides.criticalPackages) {
    slideList.push({
      id: 'critical',
      title: 'Daftar Paket Kritis / Tindak Lanjut',
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between border-b border-current/15 pb-3">
            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Slide Prioritas Perhatian</span>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Daftar Paket Perlu Perbaikan &amp; Belum Upload ({criticalList.length} Paket)
              </h2>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-500 px-2.5 py-1 rounded-md border border-amber-500/40 font-semibold">
              Action Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] rounded-xl border border-current/15 bg-current/5 text-xs">
            {criticalList.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-current/10 sticky top-0 font-bold border-b border-current/15">
                  <tr>
                    <th className="py-2.5 px-3">Nama Paket Pekerjaan</th>
                    <th className="py-2.5 px-3">Provinsi</th>
                    <th className="py-2.5 px-3 text-center">Jenis</th>
                    <th className="py-2.5 px-3 text-center">Status Upload</th>
                    <th className="py-2.5 px-3 text-center">Status Verifikasi</th>
                    <th className="py-2.5 px-3">Keterangan Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/10">
                  {criticalList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-current/5 transition-colors">
                      <td className="py-2 px-3 font-semibold max-w-xs truncate">{item.nama_paket}</td>
                      <td className="py-2 px-3 font-medium opacity-80">{item.provinsi}</td>
                      <td className="py-2 px-3 text-center font-mono opacity-80">{item.jenis_profil}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status_upload === 'Sudah Upload' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                        }`}>
                          {item.status_upload}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status_verifikasi === 'Disetujui' ? 'bg-emerald-500/20 text-emerald-500' :
                          item.status_verifikasi === 'Perlu Perbaikan' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-slate-500/20 text-slate-500'
                        }`}>
                          {item.status_verifikasi}
                        </span>
                      </td>
                      <td className="py-2 px-3 opacity-70 italic text-[11px] truncate">{item.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center opacity-70">
                <p className="text-sm font-semibold text-emerald-500">Tidak ada paket berstatus Perlu Perbaikan atau Belum Upload pada scope filter ini.</p>
              </div>
            )}
          </div>
        </div>
      )
    });
  }

  // SLIDE 8: CATATAN STRATEGIS & REKOMENDASI
  if (enabledSlides.recommendations) {
    slideList.push({
      id: 'recommendations',
      title: 'Catatan & Rekomendasi Pimpinan',
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-10 space-y-4">
          <div className="flex items-center justify-between border-b border-current/15 pb-3">
            <div>
              <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Kesimpulan</span>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D3853E]" />
                Catatan Strategis &amp; Rekomendasi Pimpinan
              </h2>
            </div>
            <span className="text-xs bg-[#D3853E]/20 text-[#D3853E] px-2.5 py-1 rounded-md font-bold">Rekomendasi</span>
          </div>

          <div className="my-auto p-5 rounded-2xl bg-current/5 border border-current/15 space-y-3">
            <h3 className="text-sm font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D3853E]" /> Point Rekomendasi &amp; Arahan Rapat
            </h3>
            <div className="text-xs sm:text-sm whitespace-pre-line leading-relaxed opacity-95 pl-3 border-l-2 border-[#D3853E]">
              {catatanRekomendasi || "Belum ada catatan khusus ditambahkan."}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-current/5 border border-current/15 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold">Direktorat Jenderal Cipta Karya &bull; Kementerian PU</p>
              <p className="opacity-70">Sistem Pelaporan Profil Audiovisual TA 2025/2026</p>
            </div>
            <span className="font-mono text-[11px] opacity-60">{uploadTimestamp}</span>
          </div>

          {renderSlideManualBlock('recommendations')}
        </div>
      )
    });
  }

  // SLIDE 9: NEXT STEPS & AGENDA
  if (enabledSlides.nextSteps) {
    slideList.push({
      id: 'nextSteps',
      title: 'Agenda & Target Tindak Lanjut',
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-10 space-y-4">
          <div className="flex items-center justify-between border-b border-current/15 pb-3">
            <div>
              <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Action Plan</span>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#5B7161]" />
                Rencana Aksi &amp; Target Timeline Tindak Lanjut
              </h2>
            </div>
            <span className="text-xs bg-[#5B7161]/20 text-[#5B7161] px-2.5 py-1 rounded-md font-bold">Next Steps</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto text-xs">
            <div className="p-4 rounded-xl bg-current/5 border border-current/15 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#D3853E]">
                <span className="w-6 h-6 rounded-full bg-[#D3853E]/20 flex items-center justify-center text-xs">1</span>
                <span>Tahap 1 (H+1 sd H+3)</span>
              </div>
              <p className="font-semibold text-sm">Surat Teguran &amp; Notifikasi Balai</p>
              <p className="opacity-80 leading-relaxed">Pengiriman daftar inventarisasi paket Perlu Perbaikan ke masing-masing Balai Prasarana Permukiman Wilayah.</p>
            </div>

            <div className="p-4 rounded-xl bg-current/5 border border-current/15 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#5B7161]">
                <span className="w-6 h-6 rounded-full bg-[#5B7161]/20 flex items-center justify-center text-xs">2</span>
                <span>Tahap 2 (H+4 sd H+7)</span>
              </div>
              <p className="font-semibold text-sm">Desk Pendampingan Re-upload</p>
              <p className="opacity-80 leading-relaxed">Penyelenggaraan desk verifikasi online untuk pendampingan perbaikan format media &amp; kelengkapan profil.</p>
            </div>

            <div className="p-4 rounded-xl bg-current/5 border border-current/15 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-500">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-xs">3</span>
                <span>Tahap 3 (H+14)</span>
              </div>
              <p className="font-semibold text-sm">Finalisasi Status Keterisian 100%</p>
              <p className="opacity-80 leading-relaxed">Target final persetujuan seluruh media audiovisual untuk dipublikasikan pada Portal Resmi Eksekutif.</p>
            </div>
          </div>

          <div className="p-3.5 bg-current/5 rounded-xl border border-current/15 text-xs flex justify-between items-center opacity-80">
            <span>Penanggung Jawab: Subdit Data &amp; Informasi Cipta Karya</span>
            <span className="font-mono">Target Selesai: 14 Hari Kerja</span>
          </div>

          {renderSlideManualBlock('nextSteps')}
        </div>
      )
    });
  }

  // DYNAMIC CUSTOM SLIDES RENDERED WITH FILLED CUSTOM DATA
  customSlides.filter(s => s.enabled).forEach((customSlide, idx) => {
    // Parse content lines
    const lines = customSlide.content.split('\n').filter(l => l.trim().length > 0);

    slideList.push({
      id: customSlide.id,
      title: customSlide.title,
      render: () => (
        <div className="h-full flex flex-col justify-between p-6 sm:p-10 space-y-4">
          <div className="flex items-center justify-between border-b border-current/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#D3853E] uppercase tracking-wider">Slide Custom #{idx + 1}</span>
                {customSlide.statusBadge && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#D3853E]/20 text-[#D3853E] border border-[#D3853E]/40">
                    {customSlide.statusBadge}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#D3853E]" />
                {customSlide.title}
              </h2>
            </div>
            <span className="text-xs bg-current/10 px-2.5 py-1 rounded-md font-semibold">{customSlide.subtitle}</span>
          </div>

          <div className="my-auto space-y-4">
            {/* Display Metric Box if present */}
            {customSlide.metricLabel && customSlide.metricValue && (
              <div className="p-4 rounded-xl bg-[#D3853E]/15 border border-[#D3853E]/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#D3853E] uppercase">{customSlide.metricLabel}</p>
                  <p className="text-2xl font-black text-current mt-0.5">{customSlide.metricValue}</p>
                </div>
                <div className="p-3 bg-[#D3853E] text-white rounded-xl shadow-md">
                  <Bookmark className="w-6 h-6" />
                </div>
              </div>
            )}

            {/* Display Content Lines as Cards or Bullets */}
            <div className="p-5 rounded-2xl bg-current/5 border border-current/15 space-y-3">
              <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D3853E]" /> Rincian Poin &amp; Informasi Tambahan
              </h3>
              
              <div className="space-y-2.5 text-xs sm:text-sm">
                {lines.map((line, lIdx) => (
                  <div key={lIdx} className="p-3 rounded-xl bg-current/5 border border-current/10 flex items-start gap-2.5">
                    <span className="p-1 rounded bg-[#D3853E]/20 text-[#D3853E] shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <p className="leading-relaxed opacity-95">{line.replace(/^[•\-\d+\.]\s*/, '')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-current/5 border border-current/15 flex justify-between items-center text-xs opacity-70">
            <span>Disusun khusus untuk paparan pimpinan</span>
            <span>{instansi}</span>
          </div>
        </div>
      )
    });
  });

  // Active Slide
  const activeSlide = slideList[currentSlideIndex] || slideList[0];

  // Helper Copy Text Summary for WA / Memo
  const handleCopyTextSummary = () => {
    const summaryText = `*LAPORAN RINGKAS PROFIL AUDIOVISUAL*
Judul: ${judulPaparan}
Tanggal: ${tanggalPaparan}
Scope: ${filterTahun} | ${filterProvinsi} | ${filterJenisProfil}

*RINGKASAN NUMERIK:*
- Total Target iEmon: ${targetTotal} paket
- Sudah Upload: ${sudahUploadTotal} paket
- Disetujui: ${disetujuiTotal} paket
- Perlu Perbaikan: ${perbaikanTotal} paket
- Belum Upload: ${belumUploadTotal} paket
- % Keterisian: ${keterisianPct.toFixed(2)}%

*OLAH DATA KOMPARASI (${compareBase} vs ${compareTarget}):*
- Keterisian ${compareBase}: ${baseStats.keterisianPct.toFixed(2)}%
- Keterisian ${compareTarget}: ${targetStats.keterisianPct.toFixed(2)}%
- Variasi Keterisian: ${deltaKeterisian >= 0 ? '+' : ''}${deltaKeterisian.toFixed(2)}%

*CATATAN STRATEGIS:*
${catatanRekomendasi}

_Disusun oleh: ${pemapar} (${instansi})_
_Timestamp Dashboard: ${uploadTimestamp}_`;

    navigator.clipboard.writeText(summaryText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Helper Theme Classes Mapping
  const getThemeClasses = () => {
    let classes = '';

    // Layout Theme Colors
    if (layoutTemplate === 'clean-light') {
      classes += ' bg-slate-50 text-slate-900 border-slate-300';
    } else if (layoutTemplate === 'high-contrast') {
      classes += ' bg-[#001155] text-white border-yellow-400';
    } else if (layoutTemplate === 'emerald') {
      classes += ' bg-[#064E3B] text-emerald-50 border-emerald-400';
    } else if (layoutTemplate === 'gold-luxury') {
      classes += ' bg-[#0F172A] text-[#FDE68A] border-[#F59E0B]';
    } else {
      // corporate-pu default
      classes += ' bg-[#132324] text-[#E3D5B0] border-[#1F3E47]';
    }

    // Typography style
    if (fontStyle === 'serif') classes += ' font-serif';
    else if (fontStyle === 'mono') classes += ' font-mono';
    else classes += ' font-sans';

    return classes;
  };

  // Ratio Class Mapping
  const getRatioClass = () => {
    if (slideRatio === '4:3') return 'aspect-[4/3]';
    if (slideRatio === '16:10') return 'aspect-[16/10]';
    return 'aspect-[16/9]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className={`w-full max-w-6xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
        isFullscreen ? 'fixed inset-0 max-w-none max-h-none rounded-none border-none z-[100]' : ''
      } ${
        layoutTemplate === 'clean-light' ? 'bg-white text-slate-900' : 'bg-[#132324] text-[#E3D5B0]'
      }`}>
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D3853E] text-white shadow-md">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Pembuat &amp; Mode Paparan Presentation</h2>
              <p className="text-xs opacity-70">Fitur Penyusunan Slide Deck Eksekutif &amp; Mode Presentasi Rapat</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Tabs */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'config' ? 'bg-[#D3853E] text-white shadow' : 'hover:bg-white/10 opacity-80'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Filter &amp; Pengaturan Desain</span>
              </button>
              <button
                onClick={() => setActiveTab('presentation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'presentation' ? 'bg-[#D3853E] text-white shadow' : 'hover:bg-white/10 opacity-80'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Pratinjau Slide ({slideList.length})</span>
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: CONFIGURATION & FILTERS & DESAIN PPT */}
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Filter Kebutuhan Paparan & Desain PPT */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Section 1: Identitas Paparan */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#D3853E]" /> 1. Identitas &amp; Judul Paparan Rapat
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Judul Paparan / Topic</label>
                      <input
                        type="text"
                        value={judulPaparan}
                        onChange={(e) => setJudulPaparan(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Nama Pemapar / Penyusun</label>
                      <input
                        type="text"
                        value={pemapar}
                        onChange={(e) => setPemapar(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Instansi / Direktorat</label>
                      <input
                        type="text"
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Tanggal Paparan</label>
                      <input
                        type="date"
                        value={tanggalPaparan}
                        onChange={(e) => setTanggalPaparan(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Audiens / Kebutuhan Rapat</label>
                      <input
                        type="text"
                        value={audiens}
                        onChange={(e) => setAudiens(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Filter Scope Data Paparan */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#D3853E]" /> 2.A Filter Kebutuhan Scope Data
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Scope Tahun</label>
                      <select
                        value={filterTahun}
                        onChange={(e) => setFilterTahun(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      >
                        <option value="Semua Tahun">Semua Tahun</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Scope Provinsi</label>
                      <select
                        value={filterProvinsi}
                        onChange={(e) => setFilterProvinsi(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      >
                        <option value="Semua Provinsi">Semua Provinsi</option>
                        {availableProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Scope Jenis Profil</label>
                      <select
                        value={filterJenisProfil}
                        onChange={(e) => setFilterJenisProfil(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      >
                        <option value="Semua Jenis Profil">Semua Jenis Profil</option>
                        {availableProfileTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2.B: Filter Parameter Olahan Data Slide */}
                <div className="p-4 rounded-xl bg-[#5B7161]/15 border border-[#5B7161]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#5B7161] uppercase tracking-wider flex items-center gap-2">
                      <Filter className="w-4 h-4 text-[#5B7161]" /> 2.B Filter &amp; Parameter Olahan Data Slide
                    </h3>
                    <span className="text-[10px] bg-[#5B7161]/20 text-[#5B7161] border border-[#5B7161]/40 px-2 py-0.5 rounded font-bold">
                      Data Processing Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Filter Status Verifikasi/Upload</label>
                      <select
                        value={filterStatusVerifikasi}
                        onChange={(e) => setFilterStatusVerifikasi(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B7161]"
                      >
                        <option value="Semua Status">Semua Status Paket</option>
                        <option value="Disetujui">Hanya Status Disetujui (100% Valid)</option>
                        <option value="Perlu Perbaikan">Hanya Status Perlu Perbaikan</option>
                        <option value="Sudah Upload">Hanya Berkas Sudah Upload</option>
                        <option value="Belum Upload">Hanya Berkas Belum Upload</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1 flex items-center gap-1">
                        <ArrowDownUp className="w-3.5 h-3.5 text-[#D3853E]" /> Pengurutan Matriks (Sorting)
                      </label>
                      <select
                        value={filterSortMatriks}
                        onChange={(e) => setFilterSortMatriks(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B7161]"
                      >
                        <option value="default">Default (Urutan Asli)</option>
                        <option value="keterisian_asc">Keterisian Terendah (Prioritas Perhatian)</option>
                        <option value="keterisian_desc">Keterisian Tertinggi (Capaian Terbaik)</option>
                        <option value="target_desc">Target Paket Terbanyak</option>
                        <option value="nama_asc">Abjad Nama Provinsi (A-Z)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Filter Ambang Progress</label>
                      <select
                        value={filterAmbangProgress}
                        onChange={(e) => setFilterAmbangProgress(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B7161]"
                      >
                        <option value="semua">Semua Tingkat Progress</option>
                        <option value="kritis">Kritis (&lt; 50% Disetujui)</option>
                        <option value="sedang">Sedang (50% - 80% Disetujui)</option>
                        <option value="optimal">Optimal (&gt; 80% Disetujui)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Max Tampilan Baris / Slide</label>
                      <select
                        value={filterMaxRowDisplay}
                        onChange={(e) => setFilterMaxRowDisplay(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B7161]"
                      >
                        <option value={10}>Max 10 Baris per Slide</option>
                        <option value={12}>Max 12 Baris per Slide (Default)</option>
                        <option value={15}>Max 15 Baris per Slide</option>
                        <option value={20}>Max 20 Baris per Slide</option>
                        <option value={50}>Max 50 Baris per Slide</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1">Minimum Target Paket</label>
                      <select
                        value={filterMinTarget}
                        onChange={(e) => setFilterMinTarget(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5B7161]"
                      >
                        <option value={0}>Semua Target (&gt;= 0 Target)</option>
                        <option value={3}>Minimal 3 Target Paket</option>
                        <option value={5}>Minimal 5 Target Paket</option>
                        <option value={10}>Minimal 10 Target Paket</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <div className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-[11px] opacity-90 flex items-center justify-between">
                        <span>Hasil Filter Olahan:</span>
                        <span className="font-bold text-[#5B7161]">{filteredRaw.length} Paket &bull; {filteredMatrix.length} Prov</span>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Section 2.D: Isian Kebutuhan Manual per Slide */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#D3853E]/20 to-[#5B7161]/20 border border-[#D3853E]/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#D3853E]" /> 2.D Isian Kebutuhan Manual per Slide (Live Manual Input)
                    </h3>
                    <span className="text-[10px] bg-[#D3853E] text-white px-2 py-0.5 rounded font-bold">
                      Otomatis ke Pratinjau
                    </span>
                  </div>

                  <p className="text-xs opacity-80 leading-relaxed">
                    Isi atau ubah kebutuhan informasi spesifik untuk masing-masing slide secara manual. Isian manual akan secara otomatis menyajikan data dan catatan tambahan pada pratinjau slide.
                  </p>

                  {/* Dropdown pilih slide */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-[#D3853E] uppercase tracking-wider mb-1">
                        Pilih Slide yang Ingin Diedit / Diisi Manual
                      </label>
                      <select
                        value={selectedSlideForManualEdit}
                        onChange={(e) => setSelectedSlideForManualEdit(e.target.value)}
                        className="w-full bg-black/60 border border-[#D3853E]/60 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D3853E]"
                      >
                        {slideList.map((s, idx) => (
                          <option key={s.id} value={s.id}>
                            Slide {idx + 1}: {s.title} ({s.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Form Isian Manual Slide Terpilih */}
                    {selectedSlideForManualEdit && (() => {
                      const currentConf = slideManualConfigs[selectedSlideForManualEdit] || {};
                      return (
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/15 space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="font-bold text-xs text-[#D3853E] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Editing Input Manual Slide: <strong>{selectedSlideForManualEdit}</strong>
                            </span>
                            <label className="flex items-center gap-2 text-[11px] font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentConf.enabledCustomBlock !== false}
                                onChange={(e) => updateSlideManualConfig(selectedSlideForManualEdit, { enabledCustomBlock: e.target.checked })}
                                className="rounded accent-[#D3853E]"
                              />
                              <span>Tampilkan Input Manual pada Slide</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold opacity-80 mb-1">Judul Slide Override (Manual)</label>
                              <input
                                type="text"
                                placeholder="Kosongkan untuk judul bawaan"
                                value={currentConf.customTitle || ''}
                                onChange={(e) => updateSlideManualConfig(selectedSlideForManualEdit, { customTitle: e.target.value })}
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold opacity-80 mb-1">Subjudul / Status Badge Tag</label>
                              <input
                                type="text"
                                placeholder="contoh: EVALUASI UTAMA / PRIORITAS SATKER"
                                value={currentConf.statusBadge || ''}
                                onChange={(e) => updateSlideManualConfig(selectedSlideForManualEdit, { statusBadge: e.target.value })}
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold opacity-80 mb-1">Label Highlight Metric Manual</label>
                              <input
                                type="text"
                                placeholder="contoh: Batas Tindak Lanjut"
                                value={currentConf.metricLabel || ''}
                                onChange={(e) => updateSlideManualConfig(selectedSlideForManualEdit, { metricLabel: e.target.value })}
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold opacity-80 mb-1">Nilai Highlight Metric Manual</label>
                              <input
                                type="text"
                                placeholder="contoh: 3 x 24 Jam Workdays"
                                value={currentConf.metricValue || ''}
                                onChange={(e) => updateSlideManualConfig(selectedSlideForManualEdit, { metricValue: e.target.value })}
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold opacity-80 mb-1">Catatan &amp; Poin Narasi Manual Slide (Gunakan Enter untuk Poin Baru)</label>
                            <textarea
                              rows={3}
                              placeholder="Tuliskan poin narasi atau rincian tambahan untuk disajikan otomatis pada pratinjau slide..."
                              value={currentConf.narrativeNotes || ''}
                              onChange={(e) => updateSlideManualConfig(selectedSlideForManualEdit, { narrativeNotes: e.target.value })}
                              className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#D3853E]"
                            ></textarea>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold opacity-80 mb-1">Catatan / Atensi Khusus Pimpinan (Leadership Focus)</label>
                            <textarea
                              rows={2}
                              placeholder="Catatan khusus atau arahan pimpinan yang di-highlight pada slide..."
                              value={currentConf.leadershipFocus || ''}
                              onChange={(e) => updateSlideManualConfig(selectedSlideForManualEdit, { leadershipFocus: e.target.value })}
                              className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-xs leading-relaxed focus:outline-none focus:border-[#D3853E]"
                            ></textarea>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px] opacity-80">
                            <span className="text-emerald-400 font-medium">✓ Perubahan langsung terhubung ke pratinjau slide</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('presentation');
                                const foundIdx = slideList.findIndex(s => s.id === selectedSlideForManualEdit);
                                if (foundIdx >= 0) setCurrentSlideIndex(foundIdx);
                              }}
                              className="px-3 py-1 bg-[#D3853E] text-white rounded font-bold hover:bg-[#be7331] transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Presentation className="w-3.5 h-3.5" /> Lihat di Pratinjau
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Section 3: Desain & Tampilan PPT (PPT Style Settings) */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#D3853E]" /> 3. Pengaturan Desain PPT &amp; Layout
                  </h3>

                  {/* Template Palette */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold opacity-80">Tema Warna Slide (PPT Color Palette)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setLayoutTemplate('corporate-pu')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          layoutTemplate === 'corporate-pu' ? 'border-[#D3853E] bg-[#132324] font-bold ring-2 ring-[#D3853E]/50' : 'border-white/10 bg-black/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-full h-3 rounded bg-[#132324] border border-[#D3853E] mb-1"></div>
                        Resmi PU Dark
                      </button>

                      <button
                        type="button"
                        onClick={() => setLayoutTemplate('clean-light')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          layoutTemplate === 'clean-light' ? 'border-[#D3853E] bg-white text-slate-900 font-bold ring-2 ring-[#D3853E]/50' : 'border-white/10 bg-black/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-full h-3 rounded bg-white border border-slate-300 mb-1"></div>
                        Clean Light
                      </button>

                      <button
                        type="button"
                        onClick={() => setLayoutTemplate('high-contrast')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          layoutTemplate === 'high-contrast' ? 'border-yellow-400 bg-[#001155] font-bold ring-2 ring-yellow-400/50' : 'border-white/10 bg-black/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-full h-3 rounded bg-[#001155] border border-yellow-400 mb-1"></div>
                        Navy Gold
                      </button>

                      <button
                        type="button"
                        onClick={() => setLayoutTemplate('emerald')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          layoutTemplate === 'emerald' ? 'border-emerald-400 bg-[#064E3B] font-bold ring-2 ring-emerald-400/50' : 'border-white/10 bg-black/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-full h-3 rounded bg-[#064E3B] border border-emerald-400 mb-1"></div>
                        Emerald
                      </button>

                      <button
                        type="button"
                        onClick={() => setLayoutTemplate('gold-luxury')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          layoutTemplate === 'gold-luxury' ? 'border-amber-400 bg-[#0F172A] font-bold ring-2 ring-amber-400/50' : 'border-white/10 bg-black/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-full h-3 rounded bg-[#0F172A] border border-amber-400 mb-1"></div>
                        Gold Luxury
                      </button>
                    </div>
                  </div>

                  {/* Ratio & Font & Pattern */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1 flex items-center gap-1">
                        <Layout className="w-3.5 h-3.5 text-[#D3853E]" /> Aspek Ratio Slide
                      </label>
                      <select
                        value={slideRatio}
                        onChange={(e) => setSlideRatio(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      >
                        <option value="16:9">16:9 Widescreen (Standar Presentasi)</option>
                        <option value="4:3">4:3 TV Traditional</option>
                        <option value="16:10">16:10 Modern Laptop</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1 flex items-center gap-1">
                        <Type className="w-3.5 h-3.5 text-[#5B7161]" /> Gaya Font / Typo
                      </label>
                      <select
                        value={fontStyle}
                        onChange={(e) => setFontStyle(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      >
                        <option value="sans">Sans-Serif Modern (Jakarta / Inter)</option>
                        <option value="serif">Serif Resmi (Playfair / Merriweather)</option>
                        <option value="mono">Monospace Technocrat (Fira / Code)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold opacity-80 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#D3853E]" /> Efek Background
                      </label>
                      <select
                        value={bgPattern}
                        onChange={(e) => setBgPattern(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#D3853E]"
                      >
                        <option value="gradient-blur">Ambient Glowing Blur</option>
                        <option value="grid-dots">Grid Dotted Radial</option>
                        <option value="flat">Clean Flat Minimalis</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Catatan Khusus & Rekomendasi */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#D3853E]" /> 4. Isian Catatan Strategis &amp; Rekomendasi Pimpinan
                  </h3>
                  <textarea
                    rows={3}
                    value={catatanRekomendasi}
                    onChange={(e) => setCatatanRekomendasi(e.target.value)}
                    placeholder="Masukkan poin-poin arahan/rekomendasi..."
                    className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:border-[#D3853E]"
                  ></textarea>
                </div>

              </div>

              {/* Right Column: Slide Module Checklist, Alternatif Lain & Dynamic Custom Slide Feature */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Checklist Modul Slide & Alternatif */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#D3853E]" /> Kebutuhan Modul Slide Paparan
                    </span>
                    <span className="text-[10px] bg-[#D3853E]/20 text-[#D3853E] px-2 py-0.5 rounded font-mono">
                      {slideList.length} Slide Aktif
                    </span>
                  </h3>

                  <div className="space-y-2 text-xs max-h-[320px] overflow-y-auto pr-1">
                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.cover}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, cover: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 1: Cover Utama &amp; Identitas Paparan</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.executiveSummary}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, executiveSummary: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 2: Executive Summary &amp; KPI Metrics</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#D3853E]/15 border border-[#D3853E]/30 cursor-pointer hover:bg-[#D3853E]/20">
                      <input
                        type="checkbox"
                        checked={enabledSlides.comparisonAnalytics}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, comparisonAnalytics: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span className="font-semibold text-[#D3853E]">Slide 3: Olah Data Komparasi Analytics ({compareBase} vs {compareTarget})</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.recapMatrix}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, recapMatrix: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 4: Matriks Rekapitulasi per Provinsi</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.charts}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, charts: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 5: Visualisasi Grafik Progress</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.sectorComparison}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, sectorComparison: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 6: Komparasi Reguler vs IBM</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.trendAnalysis}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, trendAnalysis: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 7: Analisis Kecepatan Verifikasi &amp; QC</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.criticalPackages}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, criticalPackages: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 8: Paket Kritis (Perlu Perbaikan / Belum Upload)</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.recommendations}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, recommendations: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 9: Catatan Strategis &amp; Rekomendasi Pimpinan</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg bg-black/20 border border-white/10 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={enabledSlides.nextSteps}
                        onChange={(e) => setEnabledSlides({ ...enabledSlides, nextSteps: e.target.checked })}
                        className="rounded text-[#D3853E] focus:ring-0"
                      />
                      <span>Slide 10: Action Plan &amp; Timeline Tindak Lanjut</span>
                    </label>

                    {/* Custom Slides List */}
                    {customSlides.map((cs) => (
                      <div key={cs.id} className="p-2 rounded-lg bg-[#D3853E]/10 border border-[#D3853E]/30 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs truncate cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={cs.enabled}
                            onChange={() => handleToggleCustomSlide(cs.id)}
                            className="rounded text-[#D3853E] focus:ring-0"
                          />
                          <span className="truncate font-semibold text-[#D3853E]">{cs.title}</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditCustomSlide(cs)}
                            className="p-1 hover:bg-[#D3853E]/30 text-[#D3853E] rounded transition-colors cursor-pointer"
                            title="Edit Slide Custom"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomSlide(cs.id)}
                            className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors cursor-pointer"
                            title="Hapus Slide Custom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fitur Tambah Kebutuhan Slide Custom */}
                <div className="p-4 rounded-xl bg-[#D3853E]/10 border border-[#D3853E]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#D3853E] uppercase tracking-wider flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#D3853E]" /> Fitur Tambah Kebutuhan Slide Custom
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (showAddCustomForm && editingSlideId) {
                          setEditingSlideId(null);
                          setNewSlideTitle('');
                          setNewSlideSubtitle('');
                          setNewSlideContent('');
                          setNewMetricLabel('');
                          setNewMetricValue('');
                          setNewStatusBadge('CATATAN KHUSUS');
                        }
                        setShowAddCustomForm(!showAddCustomForm);
                      }}
                      className="px-2.5 py-1 bg-[#D3853E] hover:bg-[#be7331] text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      {showAddCustomForm ? 'Tutup Form' : editingSlideId ? 'Edit Slide' : '+ Tambah Slide Custom'}
                    </button>
                  </div>

                  {showAddCustomForm && (
                    <form onSubmit={handleSaveCustomSlide} className="space-y-2.5 text-xs pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold opacity-90 mb-1">Judul Slide Custom</label>
                        <input
                          type="text"
                          required
                          placeholder="contoh: Lampiran Kontak Satker & Balai Lapangan"
                          value={newSlideTitle}
                          onChange={(e) => setNewSlideTitle(e.target.value)}
                          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold opacity-90 mb-1">Kategori / Subtitle</label>
                          <input
                            type="text"
                            placeholder="contoh: Catatan Satker"
                            value={newSlideSubtitle}
                            onChange={(e) => setNewSlideSubtitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold opacity-90 mb-1">Badge Status / Tag</label>
                          <input
                            type="text"
                            placeholder="contoh: PRIORITAS TINGGI"
                            value={newStatusBadge}
                            onChange={(e) => setNewStatusBadge(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold opacity-90 mb-1">Metrik Tambahan (Opsional Label)</label>
                          <input
                            type="text"
                            placeholder="contoh: Estimasi Waktu Desk"
                            value={newMetricLabel}
                            onChange={(e) => setNewMetricLabel(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold opacity-90 mb-1">Nilai Metrik (Opsional)</label>
                          <input
                            type="text"
                            placeholder="contoh: 14 Hari Kerja"
                            value={newMetricValue}
                            onChange={(e) => setNewMetricValue(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#D3853E]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold opacity-90 mb-1">Isi Poin-Poin Kebutuhan Slide</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Masukkan rincian informasi atau poin-poin yang ingin ditampilkan pada slide..."
                          value={newSlideContent}
                          onChange={(e) => setNewSlideContent(e.target.value)}
                          className="w-full bg-black/40 border border-white/20 rounded-lg p-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#D3853E]"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#D3853E] hover:bg-[#be7331] text-white font-bold rounded-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{editingSlideId ? 'Simpan Perubahan Slide Custom' : 'Simpan & Tambahkan ke Deck Slide'}</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Submit / Launch Presentation Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSlideIndex(0);
                    setActiveTab('presentation');
                  }}
                  className="w-full py-3.5 px-4 bg-[#D3853E] hover:bg-[#be7331] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ring-1 ring-[#D3853E]/50"
                >
                  <Presentation className="w-5 h-5" />
                  <span>Tampilkan Pratinjau Slide Paparan ({slideList.length} Slide)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>

            </div>
          )}

          {/* TAB 2: PRESENTATION SLIDE VIEWER */}
          {activeTab === 'presentation' && (
            <div className="space-y-4">
              
              {/* Slide Deck Container */}
              <div className={`w-full ${getRatioClass()} min-h-[380px] sm:min-h-[480px] rounded-2xl shadow-2xl border overflow-hidden relative transition-all duration-300 ${getThemeClasses()}`}>
                {slideList.length > 0 && activeSlide ? (
                  activeSlide.render()
                ) : (
                  <div className="h-full flex items-center justify-center p-8 text-center">
                    <p className="opacity-70 text-sm">Tidak ada slide yang diaktifkan. Silakan aktifkan minimal 1 modul slide di tab Filter &amp; Pengaturan.</p>
                  </div>
                )}
              </div>

              {/* Presentation Control Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/20 p-3 rounded-xl border border-white/10">
                
                {/* Slide Nav Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentSlideIndex <= 0}
                    onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                    className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all cursor-pointer"
                    title="Slide Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-lg">
                    Slide {slideList.length > 0 ? currentSlideIndex + 1 : 0} / {slideList.length}
                  </span>

                  <button
                    disabled={currentSlideIndex >= slideList.length - 1}
                    onClick={() => setCurrentSlideIndex(prev => Math.min(slideList.length - 1, prev + 1))}
                    className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition-all cursor-pointer"
                    title="Slide Berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Thumbnails Jump Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
                  {slideList.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                        currentSlideIndex === idx
                          ? 'bg-[#D3853E] text-white border-[#D3853E]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70'
                      }`}
                    >
                      {idx + 1}. {slide.title.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Export & Print Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeSlide) {
                        setSelectedSlideForManualEdit(activeSlide.id);
                        setActiveTab('config');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D3853E]/20 hover:bg-[#D3853E]/30 text-[#D3853E] border border-[#D3853E]/40 text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                    title="Ubah isian kebutuhan manual untuk slide yang sedang tampil ini"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Manual Slide Ini</span>
                  </button>

                  <button
                    onClick={handleCopyTextSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5B7161] hover:bg-[#4d6052] text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
                    title="Salin ringkasan teks untuk WA / Nota Dinas"
                  >
                    {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedText ? 'Tersalin!' : 'Salin Text WA'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3E47] hover:bg-[#284e5a] text-white text-xs font-bold rounded-xl border border-white/20 shadow transition-all cursor-pointer"
                    title="Cetak atau simpan slide ke PDF"
                  >
                    <Printer className="w-4 h-4 text-[#D3853E]" />
                    <span>Cetak / PDF</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
