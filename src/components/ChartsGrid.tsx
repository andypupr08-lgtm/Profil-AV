import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TooltipItem
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { BarChart3, PieChart as PieChartIcon, CheckSquare, Layers, Filter, MapPin } from 'lucide-react';
import { ProfilItem, KPIStats, SummaryMatrixRow } from '../types';
import { sortProvincesByBPBPK } from '../utils/provinces';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartsGridProps {
  filteredItems: ProfilItem[];
  stats: KPIStats;
  matrixRows?: SummaryMatrixRow[];
  rawItems?: ProfilItem[];
  availableProvinces?: string[];
}

export const ChartsGrid: React.FC<ChartsGridProps> = ({
  filteredItems,
  stats,
  matrixRows = [],
  rawItems = [],
  availableProvinces = []
}) => {
  // Filters for Chart 2: Perbandingan Status Upload & Verifikasi
  const [chart2Filter, setChart2Filter] = useState<'ALL' | 'Reguler' | 'IBM'>('ALL');
  const [chart2Province, setChart2Province] = useState<string>('ALL');

  // Available province list for Chart 2 dropdown
  const provinceOptions = useMemo(() => {
    if (availableProvinces && availableProvinces.length > 0) {
      return availableProvinces;
    }
    const set = new Set<string>();
    matrixRows.forEach((r) => {
      if (r.provinsi && r.provinsi.trim() && r.provinsi !== 'Semua Provinsi') set.add(r.provinsi.trim());
    });
    filteredItems.forEach((i) => {
      if (i.provinsi && i.provinsi.trim() && i.provinsi !== 'Semua Provinsi') set.add(i.provinsi.trim());
    });
    rawItems.forEach((r) => {
      if (r.provinsi && r.provinsi.trim() && r.provinsi !== 'Semua Provinsi') set.add(r.provinsi.trim());
    });
    return sortProvincesByBPBPK(Array.from(set));
  }, [availableProvinces, matrixRows, filteredItems, rawItems]);

  // Chart 1: Progress Profil Audiovisual (Bar Chart)
  const chart1Data = {
    labels: ['Target', 'Sudah Upload', 'Belum Upload', 'Disetujui', 'Perlu Perbaikan'],
    datasets: [
      {
        label: 'Jumlah Paket',
        data: [
          stats.targetIEmon,
          stats.sudahUpload,
          stats.belumUpload,
          stats.disetujui,
          stats.perluPerbaikan
        ],
        backgroundColor: [
          '#1F3E47', // Porsche Teal
          '#5B7161', // Porsche Sage
          '#132324', // Porsche Dark
          '#D3853E', // Porsche Amber
          '#b86d2a'  // Porsche Dark Amber
        ],
        borderRadius: 8,
        borderWidth: 0,
        maxBarThickness: 45
      }
    ]
  };

  const chart1Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => ` Jumlah: ${context.parsed.y} paket`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: 'rgba(31, 62, 71, 0.1)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  // Chart 2 Calculation: Perbandingan Disetujui, Perlu Perbaikan, Belum Diupload (dengan filter Tipe & Provinsi)
  const chart2Counts = useMemo(() => {
    // If matrixRows are provided
    if (matrixRows.length > 0) {
      let filteredMatrix = matrixRows;
      if (chart2Province !== 'ALL') {
        filteredMatrix = filteredMatrix.filter(
          (r) => String(r.provinsi || '').trim().toLowerCase() === chart2Province.trim().toLowerCase()
        );
      }

      let disetujui = 0;
      let perluPerbaikan = 0;
      let belumUpload = 0;
      let sudahUpload = 0;
      let target = 0;

      filteredMatrix.forEach((r) => {
        if (chart2Filter === 'Reguler' || chart2Filter === 'ALL') {
          target += Number(r.regTarget || 0);
          sudahUpload += Number(r.regUploaded || 0);
          disetujui += Number(r.regApproved || 0);
          perluPerbaikan += Number(r.regRevision || 0);
          belumUpload += Number(r.regUnuploaded || 0);
        }
        if (chart2Filter === 'IBM' || chart2Filter === 'ALL') {
          target += Number(r.ibmTarget || 0);
          sudahUpload += Number(r.ibmUploaded || 0);
          disetujui += Number(r.ibmApproved || 0);
          perluPerbaikan += Number(r.ibmRevision || 0);
          belumUpload += Number(r.ibmUnuploaded || 0);
        }
      });

      const belumDiverifikasi = Math.max(0, sudahUpload - (disetujui + perluPerbaikan));

      return {
        disetujui,
        perluPerbaikan,
        belumUpload,
        sudahUpload,
        belumDiverifikasi,
        target: target > 0 ? target : disetujui + perluPerbaikan + belumUpload + belumDiverifikasi
      };
    }

    // Fallback: Compute from rawItems or filteredItems
    const sourceItems = rawItems.length > 0 ? rawItems : filteredItems;
    const scoped = sourceItems.filter((i) => {
      if (chart2Province !== 'ALL') {
        if (String(i.provinsi || '').trim().toLowerCase() !== chart2Province.trim().toLowerCase()) {
          return false;
        }
      }
      if (chart2Filter !== 'ALL') {
        if (String(i.jenis_profil || '').trim().toLowerCase() !== chart2Filter.trim().toLowerCase()) {
          return false;
        }
      }
      return true;
    });

    const disetujui = scoped.filter((i) => i.status_verifikasi === 'Disetujui').length;
    const perluPerbaikan = scoped.filter((i) => i.status_verifikasi === 'Perlu Perbaikan').length;
    const belumUpload = scoped.filter(
      (i) =>
        i.status_verifikasi === 'Belum Upload' ||
        i.status_verifikasi === 'Belum Diupload' ||
        i.status_upload === 'Belum Upload' ||
        i.status_upload === 'Belum Diupload'
    ).length;
    const belumDiverifikasi = scoped.filter((i) => i.status_verifikasi === 'Belum Diverifikasi').length;
    const sudahUpload = scoped.filter(
      (i) => i.status_upload === 'Sudah Upload' || i.status_verifikasi === 'Disetujui' || i.status_verifikasi === 'Perlu Perbaikan'
    ).length;

    return {
      disetujui,
      perluPerbaikan,
      belumUpload,
      sudahUpload,
      belumDiverifikasi,
      target: scoped.length
    };
  }, [matrixRows, rawItems, filteredItems, chart2Province, chart2Filter]);

  // Dynamic Pie Chart Data Construction for Chart 2
  const chart2Labels: string[] = ['Disetujui', 'Perlu Perbaikan', 'Belum Diupload'];
  const chart2Values: number[] = [chart2Counts.disetujui, chart2Counts.perluPerbaikan, chart2Counts.belumUpload];
  const chart2Colors: string[] = [
    '#1F3E47', // Teal (Disetujui)
    '#D3853E', // Amber (Perlu Perbaikan)
    '#132324'  // Dark Navy/Black (Belum Diupload)
  ];

  if (chart2Counts.belumDiverifikasi > 0) {
    chart2Labels.push('Belum Diverifikasi');
    chart2Values.push(chart2Counts.belumDiverifikasi);
    chart2Colors.push('#5B7161'); // Sage (Belum Diverifikasi)
  }

  const totalChart2 = chart2Values.reduce((a, b) => a + b, 0);

  const chart2Data = {
    labels: chart2Labels,
    datasets: [
      {
        data: chart2Values,
        backgroundColor: chart2Colors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }
    ]
  };

  const chart2Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11, weight: 600 as const },
          color: '#132324'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const val = context.parsed as number;
            const pct = totalChart2 > 0 ? ((val / totalChart2) * 100).toFixed(1) : '0';
            return ` ${context.label}: ${val} paket (${pct}%)`;
          }
        }
      }
    }
  };

  // Chart 3: Status Upload (Pie Chart)
  const chart3Data = {
    labels: ['Sudah Upload', 'Belum Upload'],
    datasets: [
      {
        data: [stats.sudahUpload, stats.belumUpload],
        backgroundColor: ['#5B7161', '#132324'],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  const chart3Options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const total = stats.targetIEmon;
            const val = context.parsed as number;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return ` ${context.label}: ${val} paket (${pct}%)`;
          }
        }
      }
    }
  };

  // Chart 4: Status Verifikasi (Horizontal Bar Chart)
  const chart4Data = {
    labels: ['Disetujui', 'Perlu Perbaikan', 'Belum Diverifikasi'],
    datasets: [
      {
        label: 'Status Verifikasi',
        data: [stats.disetujui, stats.perluPerbaikan, stats.belumDiverifikasi],
        backgroundColor: ['#5B7161', '#D3853E', '#1F3E47'],
        borderRadius: 6,
        maxBarThickness: 30
      }
    ]
  };

  const chart4Options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => ` ${context.label}: ${context.parsed.x} paket`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: 'rgba(31, 62, 71, 0.1)' }
      },
      y: {
        grid: { display: false }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      
      {/* Chart 1: Bar Chart Progress Profil Audiovisual */}
      <div className="bg-white rounded-2xl p-5 border border-[#1F3E47]/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F3E47]/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#132324] text-[#D3853E] rounded-lg">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#132324]">Progress Profil Audiovisual</h3>
              <p className="text-[11px] text-[#132324]/60">Target vs Realisasi Upload & Verifikasi</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-[#1F3E47]/10 text-[#132324] px-2.5 py-0.5 rounded-full border border-[#1F3E47]/20">
            Bar Chart
          </span>
        </div>
        <div className="h-64 w-full relative">
          <Bar data={chart1Data} options={chart1Options} />
        </div>
      </div>

      {/* Chart 2: Pie Chart Perbandingan Disetujui, Perlu Perbaikan, Belum Diupload (dengan Filter Reguler/IBM & Provinsi) */}
      <div className="bg-white rounded-2xl p-5 border border-[#1F3E47]/20 shadow-xs flex flex-col justify-between">
        <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-[#1F3E47]/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#132324] text-[#E3D5B0] rounded-lg shrink-0">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#132324]">Perbandingan Upload & Verifikasi</h3>
                <p className="text-[11px] text-[#132324]/60">Disetujui, Perlu Perbaikan, & Belum Diupload</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold bg-[#1F3E47]/10 text-[#132324] px-2.5 py-0.5 rounded-full border border-[#1F3E47]/20">
              Pie Chart
            </span>
          </div>

          {/* Filter Controls: Tipe Profil & Provinsi */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Filter Reguler vs IBM Toggle Tabs */}
            <div className="flex items-center gap-1 bg-[#1F3E47]/5 p-1 rounded-xl border border-[#1F3E47]/15">
              <span className="text-[10px] text-[#132324]/60 px-1 font-bold uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#132324]/50" />
                Tipe:
              </span>
              <button
                onClick={() => setChart2Filter('ALL')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chart2Filter === 'ALL'
                    ? 'bg-[#1F3E47] text-white shadow-xs'
                    : 'text-[#132324]/70 hover:bg-[#1F3E47]/10'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setChart2Filter('Reguler')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chart2Filter === 'Reguler'
                    ? 'bg-[#D3853E] text-white shadow-xs'
                    : 'text-[#132324]/70 hover:bg-[#D3853E]/10'
                }`}
              >
                Reguler
              </button>
              <button
                onClick={() => setChart2Filter('IBM')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chart2Filter === 'IBM'
                    ? 'bg-[#5B7161] text-white shadow-xs'
                    : 'text-[#132324]/70 hover:bg-[#5B7161]/10'
                }`}
              >
                IBM
              </button>
            </div>

            {/* Filter Provinsi Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#1F3E47]/5 px-2.5 py-1 rounded-xl border border-[#1F3E47]/15">
              <MapPin className="w-3.5 h-3.5 text-[#1F3E47] shrink-0" />
              <span className="text-[10px] text-[#132324]/60 font-bold uppercase tracking-wider">Provinsi:</span>
              <select
                value={chart2Province}
                onChange={(e) => setChart2Province(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#132324] border-none outline-none cursor-pointer focus:ring-0 pr-1 max-w-[140px] truncate"
              >
                <option value="ALL">Semua Provinsi</option>
                {provinceOptions.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pie Chart Canvas */}
        <div className="h-60 w-full relative flex items-center justify-center">
          {totalChart2 > 0 ? (
            <Pie data={chart2Data} options={chart2Options} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <Layers className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-semibold">Tidak ada data untuk filter ini</p>
            </div>
          )}
        </div>

        {/* Summary Badges below chart */}
        <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-[#1F3E47]/10 text-center">
          <div className="bg-[#1F3E47]/10 border border-[#1F3E47]/25 rounded-xl p-2">
            <span className="text-[10px] uppercase font-bold text-[#1F3E47] block tracking-wider">Disetujui</span>
            <span className="text-sm font-extrabold text-[#132324]">{chart2Counts.disetujui}</span>
            <span className="text-[10px] text-[#132324]/60 block">
              {totalChart2 > 0 ? `${((chart2Counts.disetujui / totalChart2) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <div className="bg-[#D3853E]/10 border border-[#D3853E]/25 rounded-xl p-2">
            <span className="text-[10px] uppercase font-bold text-[#D3853E] block tracking-wider">Perlu Perbaikan</span>
            <span className="text-sm font-extrabold text-[#132324]">{chart2Counts.perluPerbaikan}</span>
            <span className="text-[10px] text-[#132324]/60 block">
              {totalChart2 > 0 ? `${((chart2Counts.perluPerbaikan / totalChart2) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <div className="bg-[#132324]/10 border border-[#132324]/25 rounded-xl p-2">
            <span className="text-[10px] uppercase font-bold text-[#132324] block tracking-wider">Belum Diupload</span>
            <span className="text-sm font-extrabold text-[#132324]">{chart2Counts.belumUpload}</span>
            <span className="text-[10px] text-[#132324]/60 block">
              {totalChart2 > 0 ? `${((chart2Counts.belumUpload / totalChart2) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart 3: Pie Chart Status Upload */}
      <div className="bg-white rounded-2xl p-5 border border-[#1F3E47]/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F3E47]/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#132324] text-[#5B7161] rounded-lg">
              <PieChartIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#132324]">Status Upload</h3>
              <p className="text-[11px] text-[#132324]/60">Perbandingan Sudah Upload vs Belum Upload</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-[#1F3E47]/10 text-[#132324] px-2.5 py-0.5 rounded-full border border-[#1F3E47]/20">
            Pie Chart
          </span>
        </div>
        <div className="h-64 w-full relative flex items-center justify-center">
          <Pie data={chart3Data} options={chart3Options} />
        </div>
      </div>

      {/* Chart 4: Horizontal Bar Chart Status Verifikasi */}
      <div className="bg-white rounded-2xl p-5 border border-[#1F3E47]/20 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1F3E47]/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#132324] text-[#D3853E] rounded-lg">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#132324]">Status Verifikasi</h3>
              <p className="text-[11px] text-[#132324]/60">Rincian Hasil Review Verifikasi Paket</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-[#1F3E47]/10 text-[#132324] px-2.5 py-0.5 rounded-full border border-[#1F3E47]/20">
            Horizontal Bar
          </span>
        </div>
        <div className="h-64 w-full relative">
          <Bar data={chart4Data} options={chart4Options} />
        </div>
      </div>

    </div>
  );
};
