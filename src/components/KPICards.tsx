import React, { useState } from 'react';
import { Target, CloudUpload, CheckCircle2, AlertTriangle, XCircle, Percent, Info } from 'lucide-react';
import { KPIStats, DrillDownFilter } from '../types';

interface KPICardsProps {
  stats: KPIStats;
  activeDrillDown?: DrillDownFilter;
  onDrillDown?: (drill: DrillDownFilter) => void;
  selectedProfileType?: string;
  selectedYear?: string;
  selectedProvince?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  stats,
  selectedProfileType = 'Semua Jenis Profil',
  selectedYear = 'Semua Tahun',
  selectedProvince = 'Semua Provinsi'
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isReguler = selectedProfileType === 'Reguler';
  const isIBM = selectedProfileType === 'IBM';
  const hasYearFilter = Boolean(selectedYear && selectedYear !== 'Semua Tahun');
  const yearSuffix = hasYearFilter ? ` (${selectedYear})` : '';

  const getPersentaseSubtext = () => {
    if (isReguler) {
      return `Diisi dari kolom Profil Reguler % Keterisian (${stats.sudahUploadReguler}/${stats.targetReguler})${yearSuffix}`;
    }
    if (isIBM) {
      return `Diisi dari kolom Profil IBM % Keterisian (${stats.sudahUploadIBM}/${stats.targetIBM})${yearSuffix}`;
    }
    return `Reg: ${stats.persentaseKeterisianReguler.toFixed(2)}% • IBM: ${stats.persentaseKeterisianIBM.toFixed(2)}%${yearSuffix ? ` • ${selectedYear}` : ''}`;
  };

  const getPersentaseFormula = () => {
    if (isReguler) {
      return `Filter Reguler${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil Reguler % Keterisian"\n(Sudah Upload Reguler / Target Reguler) × 100%\n= (${stats.sudahUploadReguler} / ${stats.targetReguler}) × 100%\n= ${stats.persentaseKeterisian.toFixed(2)}%`;
    }
    if (isIBM) {
      return `Filter IBM${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil IBM % Keterisian"\n(Sudah Upload IBM / Target IBM) × 100%\n= (${stats.sudahUploadIBM} / ${stats.targetIBM}) × 100%\n= ${stats.persentaseKeterisian.toFixed(2)}%`;
    }
    return `Semua Jenis Profil${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\n(Total Sudah Upload / Total Target iEmon) × 100%\n= (${stats.sudahUpload} / ${stats.targetIEmon}) × 100%\n= ${stats.persentaseKeterisian.toFixed(2)}%`;
  };

  const cards = [
    {
      id: 'target',
      title: isIBM
        ? 'Profil IBM Target Sesuai iEmon'
        : 'Profil Reguler Target Sesuai iEmon',
      value: isIBM ? stats.targetIBM : stats.targetReguler,
      subtext: isIBM
        ? `Diisi dari kolom Profil IBM Target Sesuai iEmon${yearSuffix}`
        : `Diisi dari kolom Profil Reguler Target Sesuai iEmon${yearSuffix}`,
      formula: isIBM
        ? `Filter IBM${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiambil dari kolom "Profil IBM Target Sesuai iEmon"\nTotal Target: ${stats.targetIBM}`
        : `Filter ${selectedProfileType}${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiambil dari kolom "Profil Reguler Target Sesuai iEmon"\nTotal Target Sesuai iEmon: ${stats.targetReguler}`,
      icon: Target,
      iconBg: 'bg-[#D3853E] text-white',
      borderColor: 'border-[#1F3E47]',
      accentColor: '#D3853E',
    },
    {
      id: 'sudah_upload',
      title: isIBM
        ? 'Profil IBM Sudah Diupload'
        : 'Profil Reguler Sudah Diupload',
      value: isIBM ? stats.sudahUploadIBM : stats.sudahUploadReguler,
      subtext: isIBM
        ? `Diisi dari kolom Profil IBM Sudah Diupload${yearSuffix}`
        : `Diisi dari kolom Profil Reguler Sudah Diupload${yearSuffix}`,
      formula: isIBM
        ? `Filter IBM${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiambil dari kolom "Profil IBM Sudah Diupload"\nTotal: ${stats.sudahUploadIBM}`
        : `Filter ${selectedProfileType}${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiambil dari kolom "Profil Reguler Sudah Diupload"\nTotal Sudah Diupload: ${stats.sudahUploadReguler}`,
      icon: CloudUpload,
      iconBg: 'bg-[#5B7161] text-white',
      borderColor: 'border-[#1F3E47]',
      accentColor: '#5B7161',
    },
    {
      id: 'disetujui',
      title: isIBM ? 'Profil IBM Disetujui' : 'Profil Reguler Disetujui',
      value: isIBM ? stats.disetujuiIBM : stats.disetujuiReguler,
      subtext: isIBM
        ? `Diisi dari kolom Profil IBM Disetujui${yearSuffix}`
        : `Diisi dari kolom Profil Reguler Disetujui${yearSuffix}`,
      formula: isIBM
        ? `Filter IBM${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil IBM Disetujui"\nTotal: ${stats.disetujuiIBM}`
        : `Filter ${selectedProfileType}${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil Reguler Disetujui"\nTotal: ${stats.disetujuiReguler}`,
      icon: CheckCircle2,
      iconBg: 'bg-[#1F3E47] text-white border border-[#5B7161]/50',
      borderColor: 'border-[#1F3E47]',
      accentColor: '#5B7161',
    },
    {
      id: 'perlu_perbaikan',
      title: isIBM ? 'Profil IBM Perlu Perbaikan' : 'Profil Reguler Perlu Perbaikan',
      value: isIBM ? stats.perluPerbaikanIBM : stats.perluPerbaikanReguler,
      subtext: isIBM
        ? `Diisi dari kolom Profil IBM Perlu Perbaikan${yearSuffix}`
        : `Diisi dari kolom Profil Reguler Perlu Perbaikan${yearSuffix}`,
      formula: isIBM
        ? `Filter IBM${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil IBM Perlu Perbaikan"\nTotal: ${stats.perluPerbaikanIBM}`
        : `Filter ${selectedProfileType}${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil Reguler Perlu Perbaikan"\nTotal: ${stats.perluPerbaikanReguler}`,
      icon: AlertTriangle,
      iconBg: 'bg-[#D3853E]/90 text-white',
      borderColor: 'border-[#1F3E47]',
      accentColor: '#D3853E',
    },
    {
      id: 'belum_upload',
      title: isIBM ? 'Profil IBM Belum Diupload' : 'Profil Reguler Belum Diupload',
      value: isIBM ? stats.belumUploadIBM : stats.belumUploadReguler,
      subtext: isIBM
        ? `Diisi dari kolom Profil IBM Belum Diupload${yearSuffix}`
        : `Diisi dari kolom Profil Reguler Belum Diupload${yearSuffix}`,
      formula: isIBM
        ? `Filter IBM${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiambil dari kolom "Profil IBM Belum Diupload"\nTotal: ${stats.belumUploadIBM}`
        : `Filter ${selectedProfileType}${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiambil dari kolom "Profil Reguler Belum Diupload"\nTotal: ${stats.belumUploadReguler}`,
      icon: XCircle,
      iconBg: 'bg-[#1F3E47] text-[#E3D5B0]',
      borderColor: 'border-[#1F3E47]',
      accentColor: '#E3D5B0',
    },
    {
      id: 'persentase',
      title: isIBM ? 'Profil IBM % Keterisian' : 'Profil Reguler % Keterisian',
      value: `${(isIBM ? stats.persentaseKeterisianIBM : stats.persentaseKeterisianReguler).toFixed(2)}%`,
      subtext: isIBM
        ? `Diisi dari kolom Profil IBM % Keterisian (${stats.sudahUploadIBM}/${stats.targetIBM})${yearSuffix}`
        : `Diisi dari kolom Profil Reguler % Keterisian (${stats.sudahUploadReguler}/${stats.targetReguler})${yearSuffix}`,
      formula: isIBM
        ? `Filter IBM${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil IBM % Keterisian"\n(Sudah Upload IBM / Target IBM) × 100%\n= (${stats.sudahUploadIBM} / ${stats.targetIBM}) × 100%\n= ${stats.persentaseKeterisianIBM.toFixed(2)}%`
        : `Filter ${selectedProfileType}${hasYearFilter ? ` - Tahun ${selectedYear}` : ''}:\nDiisi dari kolom "Profil Reguler % Keterisian"\n(Sudah Upload Reguler / Target Reguler) × 100%\n= (${stats.sudahUploadReguler} / ${stats.targetReguler}) × 100%\n= ${stats.persentaseKeterisianReguler.toFixed(2)}%`,
      icon: Percent,
      iconBg: 'bg-[#D3853E] text-white',
      borderColor: 'border-[#1F3E47]',
      isProgressBar: true,
      percentageValue: isIBM ? stats.persentaseKeterisianIBM : stats.persentaseKeterisianReguler,
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isTooltipOpen = activeTooltip === card.id;

        return (
          <div
            key={card.id}
            id={`kpi-card-${card.id}`}
            className="relative bg-[#132324] border border-[#1F3E47] hover:border-[#5B7161] rounded-2xl p-4 transition-all duration-200 shadow-md group"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-xs`}>
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Info formula button */}
              <div className="relative">
                <button
                  type="button"
                  id={`btn-info-${card.id}`}
                  onClick={() => setActiveTooltip(isTooltipOpen ? null : card.id)}
                  onMouseEnter={() => setActiveTooltip(card.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="text-[#E3D5B0]/50 hover:text-[#E3D5B0] p-1 rounded-md hover:bg-white/5 transition-colors"
                  title="Detail Perhitungan"
                  aria-label="Detail Perhitungan"
                >
                  <Info className="w-4 h-4" />
                </button>

                {isTooltipOpen && (
                  <div className="absolute right-0 top-7 z-30 w-64 bg-[#1B3033] text-white border border-[#5B7161]/50 rounded-xl p-3 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    <p className="font-bold text-[#D3853E] mb-1">Rumus & Sumber Data:</p>
                    <p className="text-[#E3D5B0]/90 whitespace-pre-line leading-relaxed">
                      {card.formula}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#E3D5B0]/80 mb-0.5" id={`kpi-title-${card.id}`}>{card.title}</p>
              <h3 className="text-2xl font-black text-white tracking-tight" id={`kpi-val-${card.id}`}>
                {card.value}
              </h3>

              {card.isProgressBar ? (
                <div className="mt-2.5">
                  <div className="w-full bg-[#1F3E47] rounded-full h-2 overflow-hidden border border-[#5B7161]/30">
                    <div
                      className="bg-[#D3853E] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, card.percentageValue || 0))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#E3D5B0]/60 mt-1 font-medium">{card.subtext}</p>
                </div>
              ) : (
                <p className="text-[11px] text-[#E3D5B0]/60 mt-1 font-medium">{card.subtext}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

