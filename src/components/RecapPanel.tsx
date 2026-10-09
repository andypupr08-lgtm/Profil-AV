import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Calendar, RefreshCw, Search } from 'lucide-react';
import { SummaryMatrixRow } from '../types';

interface RecapPanelProps {
  matrixRows: SummaryMatrixRow[];
  availableYears?: string[];
}

export {
  MASTER_34_PROVINCES,
  normalizeProvinceName,
  getProvinceBPBPKIndex,
  sortProvincesByBPBPK
} from '../utils/provinces';
import {
  MASTER_34_PROVINCES,
  sortProvincesByBPBPK
} from '../utils/provinces';

export const RecapPanel: React.FC<RecapPanelProps> = ({ matrixRows, availableYears = [] }) => {
  const [selectedYear, setSelectedYear] = useState<string>('Semua Tahun');
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('Semua Provinsi');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract available years dynamically if not provided
  const years = useMemo(() => {
    const yearSet = new Set<string>();
    if (availableYears && availableYears.length > 0) {
      availableYears.forEach((y) => yearSet.add(y));
    }
    matrixRows.forEach((row) => {
      if (row.tahun) yearSet.add(String(row.tahun));
    });
    return Array.from(yearSet).sort((a, b) => Number(a) - Number(b));
  }, [matrixRows, availableYears]);

  // Extract available provinces - ensures all 34 provinces are ordered from Aceh to Papua Barat (BPBPK order)
  const provinces = useMemo(() => {
    const provList = [...MASTER_34_PROVINCES];
    const existingSet = new Set(MASTER_34_PROVINCES.map((p) => p.toLowerCase()));
    matrixRows.forEach((row) => {
      const p = row.provinsi ? row.provinsi.trim() : '';
      if (p && !existingSet.has(p.toLowerCase())) {
        existingSet.add(p.toLowerCase());
        provList.push(p);
      }
    });
    return sortProvincesByBPBPK(provList);
  }, [matrixRows]);

  // Process rows so that the table displays the 34 provinces
  // - When "Semua Tahun", consolidate / aggregate data per province across all years (34 rows)
  // - When a specific year is selected, list all 34 provinces for that year (34 rows)
  const processedRows = useMemo(() => {
    const allProvs = provinces;

    if (selectedYear === 'Semua Tahun') {
      return allProvs.map((prov) => {
        const matchRows = matrixRows.filter(
          (r) => r.provinsi.trim().toLowerCase() === prov.toLowerCase()
        );

        const regTarget = matchRows.reduce((sum, r) => sum + Number(r.regTarget || 0), 0);
        const regUploaded = matchRows.reduce((sum, r) => sum + Number(r.regUploaded || 0), 0);
        const regApproved = matchRows.reduce((sum, r) => sum + Number(r.regApproved || 0), 0);
        const regRevision = matchRows.reduce((sum, r) => sum + Number(r.regRevision || 0), 0);
        const regUnuploaded = matchRows.reduce((sum, r) => sum + Number(r.regUnuploaded || 0), 0);

        const ibmTarget = matchRows.reduce((sum, r) => sum + Number(r.ibmTarget || 0), 0);
        const ibmUploaded = matchRows.reduce((sum, r) => sum + Number(r.ibmUploaded || 0), 0);
        const ibmApproved = matchRows.reduce((sum, r) => sum + Number(r.ibmApproved || 0), 0);
        const ibmRevision = matchRows.reduce((sum, r) => sum + Number(r.ibmRevision || 0), 0);
        const ibmUnuploaded = matchRows.reduce((sum, r) => sum + Number(r.ibmUnuploaded || 0), 0);

        // Use parsed % Keterisian directly from Excel data if available
        let regKeterisian = 0;
        if (matchRows.length === 1 && matchRows[0].regKeterisian !== undefined) {
          regKeterisian = Number(matchRows[0].regKeterisian);
        } else if (matchRows.length > 1 && matchRows.some((r) => r.regKeterisian !== undefined)) {
          const totalTarget = matchRows.reduce((sum, r) => sum + Number(r.regTarget || 0), 0);
          if (totalTarget > 0) {
            regKeterisian =
              matchRows.reduce((sum, r) => {
                const val =
                  r.regKeterisian !== undefined
                    ? Number(r.regKeterisian)
                    : r.regTarget > 0
                    ? (Number(r.regUploaded) / Number(r.regTarget)) * 100
                    : 0;
                return sum + val * Number(r.regTarget || 0);
              }, 0) / totalTarget;
          } else {
            regKeterisian =
              matchRows.reduce((sum, r) => sum + Number(r.regKeterisian || 0), 0) / matchRows.length;
          }
        } else {
          regKeterisian = regTarget > 0 ? (regUploaded / regTarget) * 100 : 0;
        }

        let ibmKeterisian = 0;
        if (matchRows.length === 1 && matchRows[0].ibmKeterisian !== undefined) {
          ibmKeterisian = Number(matchRows[0].ibmKeterisian);
        } else if (matchRows.length > 1 && matchRows.some((r) => r.ibmKeterisian !== undefined)) {
          const totalTarget = matchRows.reduce((sum, r) => sum + Number(r.ibmTarget || 0), 0);
          if (totalTarget > 0) {
            ibmKeterisian =
              matchRows.reduce((sum, r) => {
                const val =
                  r.ibmKeterisian !== undefined
                    ? Number(r.ibmKeterisian)
                    : r.ibmTarget > 0
                    ? (Number(r.ibmUploaded) / Number(r.ibmTarget)) * 100
                    : 0;
                return sum + val * Number(r.ibmTarget || 0);
              }, 0) / totalTarget;
          } else {
            ibmKeterisian =
              matchRows.reduce((sum, r) => sum + Number(r.ibmKeterisian || 0), 0) / matchRows.length;
          }
        } else {
          ibmKeterisian = ibmTarget > 0 ? (ibmUploaded / ibmTarget) * 100 : 0;
        }

        return {
          id: `agg-${prov}`,
          provinsi: prov,
          tahun: 'Semua',
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
        };
      });
    } else {
      return allProvs.map((prov) => {
        const matchRow = matrixRows.find(
          (r) =>
            r.provinsi.trim().toLowerCase() === prov.toLowerCase() &&
            String(r.tahun).trim() === selectedYear.trim()
        );

        if (matchRow) {
          const regTarget = Number(matchRow.regTarget || 0);
          const regUploaded = Number(matchRow.regUploaded || 0);
          const ibmTarget = Number(matchRow.ibmTarget || 0);
          const ibmUploaded = Number(matchRow.ibmUploaded || 0);

          return {
            ...matchRow,
            regKeterisian:
              matchRow.regKeterisian !== undefined
                ? Number(matchRow.regKeterisian)
                : regTarget > 0
                ? (regUploaded / regTarget) * 100
                : 0,
            ibmKeterisian:
              matchRow.ibmKeterisian !== undefined
                ? Number(matchRow.ibmKeterisian)
                : ibmTarget > 0
                ? (ibmUploaded / ibmTarget) * 100
                : 0,
          };
        }

        return {
          id: `${selectedYear}-${prov}`,
          provinsi: prov,
          tahun: selectedYear,
          regTarget: 0,
          regUploaded: 0,
          regApproved: 0,
          regRevision: 0,
          regUnuploaded: 0,
          regKeterisian: 0,
          ibmTarget: 0,
          ibmUploaded: 0,
          ibmApproved: 0,
          ibmRevision: 0,
          ibmUnuploaded: 0,
          ibmKeterisian: 0,
        };
      });
    }
  }, [matrixRows, provinces, selectedYear]);

  // Filter matrix rows based on province filter and search
  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => {
      // Province filter
      if (selectedProvinsi !== 'Semua Provinsi' && row.provinsi.trim().toLowerCase() !== selectedProvinsi.trim().toLowerCase()) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          row.provinsi.toLowerCase().includes(term) ||
          String(row.tahun).toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [processedRows, selectedProvinsi, searchTerm]);

  // Compute Grand Totals for the bottom summary row
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const regTarget = Number(row.regTarget || 0);
        const regUploaded = Number(row.regUploaded || 0);
        const regApproved = Number(row.regApproved || 0);
        const regRevision = Number(row.regRevision || 0);
        const regUnuploaded = Number(row.regUnuploaded || 0);

        const ibmTarget = Number(row.ibmTarget || 0);
        const ibmUploaded = Number(row.ibmUploaded || 0);
        const ibmApproved = Number(row.ibmApproved || 0);
        const ibmRevision = Number(row.ibmRevision || 0);
        const ibmUnuploaded = Number(row.ibmUnuploaded || 0);

        acc.regTarget += regTarget;
        acc.regUploaded += regUploaded;
        acc.regApproved += regApproved;
        acc.regRevision += regRevision;
        acc.regUnuploaded += regUnuploaded;

        acc.ibmTarget += ibmTarget;
        acc.ibmUploaded += ibmUploaded;
        acc.ibmApproved += ibmApproved;
        acc.ibmRevision += ibmRevision;
        acc.ibmUnuploaded += ibmUnuploaded;

        return acc;
      },
      {
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
      }
    );
  }, [filteredRows]);

  // Export Recapitulation Table to Excel
  const handleExportExcel = () => {
    const exportData = filteredRows.map((row, idx) => {
      const regTarget = Number(row.regTarget || 0);
      const regUploaded = Number(row.regUploaded || 0);
      const regApproved = Number(row.regApproved || 0);
      const regRevision = Number(row.regRevision || 0);
      const regUnuploaded = Number(row.regUnuploaded || 0);

      const ibmTarget = Number(row.ibmTarget || 0);
      const ibmUploaded = Number(row.ibmUploaded || 0);
      const ibmApproved = Number(row.ibmApproved || 0);
      const ibmRevision = Number(row.ibmRevision || 0);
      const ibmUnuploaded = Number(row.ibmUnuploaded || 0);

      const regKeterisian = row.regKeterisian !== undefined ? row.regKeterisian : (regTarget > 0 ? (regUploaded / regTarget) * 100 : 0);
      const ibmKeterisian = row.ibmKeterisian !== undefined ? row.ibmKeterisian : (ibmTarget > 0 ? (ibmUploaded / ibmTarget) * 100 : 0);

      return {
        No: idx + 1,
        Provinsi: row.provinsi,
        Tahun: row.tahun,
        'Reguler - Target': regTarget,
        'Reguler - Sudah Upload': regUploaded,
        'Reguler - Disetujui': regApproved,
        'Reguler - Perlu Perbaikan': regRevision,
        'Reguler - Belum Upload': regUnuploaded,
        'Reguler - % Keterisian': `${regKeterisian.toFixed(2)}%`,
        'IBM - Target': ibmTarget,
        'IBM - Sudah Upload': ibmUploaded,
        'IBM - Disetujui': ibmApproved,
        'IBM - Perlu Perbaikan': ibmRevision,
        'IBM - Belum Upload': ibmUnuploaded,
        'IBM - % Keterisian': `${ibmKeterisian.toFixed(2)}%`,
      };
    });

    const totalRegKeterisian = totals.regTarget > 0 ? (totals.regUploaded / totals.regTarget) * 100 : 0;
    const totalIbmKeterisian = totals.ibmTarget > 0 ? (totals.ibmUploaded / totals.ibmTarget) * 100 : 0;

    // Add total row
    exportData.push({
      No: 0,
      Provinsi: 'TOTAL REKAPITULASI',
      Tahun: selectedYear,
      'Reguler - Target': totals.regTarget,
      'Reguler - Sudah Upload': totals.regUploaded,
      'Reguler - Disetujui': totals.regApproved,
      'Reguler - Perlu Perbaikan': totals.regRevision,
      'Reguler - Belum Upload': totals.regUnuploaded,
      'Reguler - % Keterisian': `${totalRegKeterisian.toFixed(2)}%`,
      'IBM - Target': totals.ibmTarget,
      'IBM - Sudah Upload': totals.ibmUploaded,
      'IBM - Disetujui': totals.ibmApproved,
      'IBM - Perlu Perbaikan': totals.ibmRevision,
      'IBM - Belum Upload': totals.ibmUnuploaded,
      'IBM - % Keterisian': `${totalIbmKeterisian.toFixed(2)}%`,
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi');
    XLSX.writeFile(wb, `Rekapitulasi_Profil_Audiovisual_${selectedYear.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleResetFilters = () => {
    setSelectedYear('Semua Tahun');
    setSelectedProvinsi('Semua Provinsi');
    setSearchTerm('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#1F3E47]/20 overflow-hidden transition-all">
      {/* Top Header & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-[#1F3E47]/10 bg-[#E3D5B0]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Info Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#132324] border border-[#1F3E47] flex items-center justify-center text-[#D3853E] shrink-0 shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#132324]">
              Rekapitulasi Profil Audiovisual
            </h3>
            <p className="text-xs text-[#132324]/60 font-medium">
              Ringkasan target dan keterisian data 34 Provinsi BPPW Indonesia (Sheet 2025 & Sheet 2026)
            </p>
          </div>
        </div>

        {/* Right: Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Tahun */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#1F3E47] hidden sm:inline">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-[#1F3E47]/30 text-[#132324] text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/20 focus:border-[#D3853E] transition-all cursor-pointer shadow-2xs"
            >
              <option value="Semua Tahun">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Provinsi */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#1F3E47] hidden sm:inline">Provinsi:</span>
            <select
              value={selectedProvinsi}
              onChange={(e) => setSelectedProvinsi(e.target.value)}
              className="bg-white border border-[#1F3E47]/30 text-[#132324] text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/20 focus:border-[#D3853E] transition-all cursor-pointer shadow-2xs max-w-[170px] truncate"
            >
              <option value="Semua Provinsi">Semua Provinsi (34 Provinsi)</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input for Provinsi */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari provinsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#1F3E47]/30 text-[#132324] text-xs font-medium rounded-xl pl-7 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/20 focus:border-[#D3853E] transition-all shadow-2xs w-32 sm:w-36"
            />
            <Search className="w-3.5 h-3.5 text-[#1F3E47]/50 absolute left-2 top-2.5 pointer-events-none" />
          </div>

          {/* Reset Filters button */}
          {(selectedYear !== 'Semua Tahun' || selectedProvinsi !== 'Semua Provinsi' || searchTerm.trim() !== '') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 bg-[#1F3E47]/10 hover:bg-[#1F3E47]/20 text-[#132324] text-xs font-medium px-2.5 py-2 rounded-xl transition-all cursor-pointer border border-[#1F3E47]/20"
              title="Reset Filter Rekapitulasi"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-[#5B7161] hover:bg-[#4a5e50] text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer ml-auto sm:ml-0"
            title="Ekspor Rekapitulasi ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Grouped Table Header */}
          <thead className="bg-[#132324] text-[#E3D5B0] sticky top-0 z-10 font-semibold border-b border-[#1F3E47]">
            {/* Header Row 1 */}
            <tr className="divide-x divide-[#1F3E47] text-center">
              <th rowSpan={2} className="py-3 px-3 w-12 text-center bg-[#132324]">
                No
              </th>
              <th rowSpan={2} className="py-3 px-4 text-left min-w-[180px] bg-[#132324]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#E3D5B0]">BPBPK / Provinsi</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D3853E]/20 text-[#E3D5B0] border border-[#D3853E]/40 whitespace-nowrap">
                    34 Provinsi (Aceh - Papua Barat)
                  </span>
                </div>
              </th>
              <th rowSpan={2} className="py-3 px-3 w-16 text-center bg-[#132324]">
                Tahun
              </th>
              <th colSpan={6} className="py-2 px-3 bg-[#D3853E] text-white font-bold uppercase tracking-wider">
                Profil Reguler
              </th>
              <th colSpan={6} className="py-2 px-3 bg-[#1F3E47] text-[#E3D5B0] font-bold uppercase tracking-wider">
                Keterisian IBM
              </th>
            </tr>

            {/* Header Row 2 */}
            <tr className="divide-x divide-[#1F3E47] text-center text-[11px]">
              {/* Reguler Subheaders */}
              <th
                className="py-2 px-2.5 bg-[#B86B28] text-white font-bold tracking-wide border-l border-r border-[#D3853E]/70 shadow-inner whitespace-nowrap"
                title="Profil Reguler Target Sesuai iEmon (sesuai data kolom Excel)"
              >
                Target
              </th>
              <th className="py-2 px-2.5 bg-[#D3853E]/30 text-[#E3D5B0]">Sudah Upload</th>
              <th className="py-2 px-2.5 bg-[#D3853E]/30 text-[#E3D5B0]">Disetujui</th>
              <th className="py-2 px-2.5 bg-[#D3853E]/30 text-[#E3D5B0]">Perlu Perbaikan</th>
              <th className="py-2 px-2.5 bg-[#D3853E]/30 text-[#E3D5B0]">Belum Upload</th>
              <th
                className="py-2 px-2.5 bg-[#B86B28] text-white font-bold tracking-wide border-l border-r border-[#D3853E]/70 shadow-inner whitespace-nowrap"
                title="Profil Reguler % Keterisian (sesuai data kolom Excel)"
              >
                % Keterisian
              </th>

              {/* IBM Subheaders */}
              <th
                className="py-2 px-2.5 bg-[#162D34] text-[#E3D5B0] font-bold tracking-wide border-l border-r border-[#5B7161]/60 shadow-inner whitespace-nowrap"
                title="Profil IBM / Keterisian IBM Target Sesuai iEmon (sesuai data kolom Excel)"
              >
                Target
              </th>
              <th className="py-2 px-2.5 bg-[#1F3E47]/60 text-[#E3D5B0]">Sudah Upload</th>
              <th className="py-2 px-2.5 bg-[#1F3E47]/60 text-[#E3D5B0]">Disetujui</th>
              <th className="py-2 px-2.5 bg-[#1F3E47]/60 text-[#E3D5B0]">Perlu Perbaikan</th>
              <th className="py-2 px-2.5 bg-[#1F3E47]/60 text-[#E3D5B0]">Belum Upload</th>
              <th
                className="py-2 px-2.5 bg-[#162D34] text-[#E3D5B0] font-bold tracking-wide border-l border-r border-[#5B7161]/60 shadow-inner whitespace-nowrap"
                title="Keterisian IBM % keterisian (sesuai data kolom Excel)"
              >
                % Keterisian
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#1F3E47]/10 text-[#132324]">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-[#132324]/60">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">📊</span>
                    <p className="font-semibold text-[#132324]">Tidak ada data rekapitulasi yang sesuai.</p>
                    <p className="text-xs text-[#132324]/50">
                      Coba ganti filter tahun atau kata kunci pencarian.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => {
                const regTarget = Number(row.regTarget || 0);
                const regUploaded = Number(row.regUploaded || 0);
                const regApproved = Number(row.regApproved || 0);
                const regRevision = Number(row.regRevision || 0);
                const regUnuploaded = Number(row.regUnuploaded || 0);
                const regKeterisian = row.regKeterisian !== undefined ? row.regKeterisian : (regTarget > 0 ? (regUploaded / regTarget) * 100 : 0);

                const ibmTarget = Number(row.ibmTarget || 0);
                const ibmUploaded = Number(row.ibmUploaded || 0);
                const ibmApproved = Number(row.ibmApproved || 0);
                const ibmRevision = Number(row.ibmRevision || 0);
                const ibmUnuploaded = Number(row.ibmUnuploaded || 0);
                const ibmKeterisian = row.ibmKeterisian !== undefined ? row.ibmKeterisian : (ibmTarget > 0 ? (ibmUploaded / ibmTarget) * 100 : 0);

                return (
                  <tr
                    key={row.id || `${row.provinsi}-${row.tahun}-${idx}`}
                    className="hover:bg-[#E3D5B0]/30 transition-colors divide-x divide-[#1F3E47]/10"
                  >
                    <td className="py-2.5 px-3 text-center text-[#132324]/60 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#132324]">{row.provinsi}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#132324] bg-[#E3D5B0]/10">
                      <span className="bg-[#1F3E47]/10 text-[#132324] px-2 py-0.5 rounded-md font-semibold border border-[#1F3E47]/20">
                        {row.tahun}
                      </span>
                    </td>

                    {/* Reguler Data */}
                    <td
                      className="py-2.5 px-2.5 text-center font-bold text-[#132324] bg-[#D3853E]/10 border-l border-r border-[#D3853E]/20 whitespace-nowrap"
                      title={`Target Sesuai iEmon Reguler: ${regTarget}`}
                    >
                      {regTarget}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#132324] bg-[#D3853E]/5">{regUploaded}</td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#5B7161] bg-[#D3853E]/5">{regApproved}</td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#D3853E] bg-[#D3853E]/5">{regRevision}</td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#132324]/40 bg-[#D3853E]/5">{regUnuploaded}</td>
                    <td
                      className="py-2.5 px-2.5 text-center font-bold text-[#132324] bg-[#D3853E]/15 border-l border-r border-[#D3853E]/30 whitespace-nowrap"
                      title={`Profil Reguler % Keterisian: ${regKeterisian.toFixed(2)}%`}
                    >
                      {regKeterisian.toFixed(2)}%
                    </td>

                    {/* IBM Data */}
                    <td
                      className="py-2.5 px-2.5 text-center font-bold text-[#132324] bg-[#1F3E47]/10 border-l border-r border-[#1F3E47]/20 whitespace-nowrap"
                      title={`Target Sesuai iEmon IBM: ${ibmTarget}`}
                    >
                      {ibmTarget}
                    </td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#132324] bg-[#1F3E47]/5">{ibmUploaded}</td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#5B7161] bg-[#1F3E47]/5">{ibmApproved}</td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#D3853E] bg-[#1F3E47]/5">{ibmRevision}</td>
                    <td className="py-2.5 px-2.5 text-center font-medium text-[#132324]/40 bg-[#1F3E47]/5">{ibmUnuploaded}</td>
                    <td
                      className="py-2.5 px-2.5 text-center font-bold text-[#132324] bg-[#1F3E47]/15 border-l border-r border-[#1F3E47]/30 whitespace-nowrap"
                      title={`Keterisian IBM % keterisian: ${ibmKeterisian.toFixed(2)}%`}
                    >
                      {ibmKeterisian.toFixed(2)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer: Total Rekapitulasi Row */}
          {filteredRows.length > 0 && (
            <tfoot className="bg-[#132324] text-white font-bold border-t-2 border-[#1F3E47] sticky bottom-0 z-10">
              <tr className="divide-x divide-[#1F3E47] text-center">
                <td colSpan={2} className="py-3 px-4 text-left font-bold text-xs uppercase tracking-wider text-[#D3853E]">
                  TOTAL REKAPITULASI ({filteredRows.length === 34 ? '34 PROVINSI' : `${filteredRows.length} PROVINSI`})
                </td>
                <td className="py-3 px-2 text-center text-xs font-mono text-[#E3D5B0]">
                  {selectedYear === 'Semua Tahun' ? 'SEMUA' : selectedYear}
                </td>

                {/* Reguler Totals */}
                <td className="py-3 px-2.5 bg-[#132324] text-white">{totals.regTarget}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#E3D5B0]">{totals.regUploaded}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#5B7161]">{totals.regApproved}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#D3853E]">{totals.regRevision}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#E3D5B0]/50">{totals.regUnuploaded}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#D3853E] font-bold">
                  {(totals.regTarget > 0 ? (totals.regUploaded / totals.regTarget) * 100 : 0).toFixed(2)}%
                </td>

                {/* IBM Totals */}
                <td className="py-3 px-2.5 bg-[#132324] text-white">{totals.ibmTarget}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#E3D5B0]">{totals.ibmUploaded}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#5B7161]">{totals.ibmApproved}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#D3853E]">{totals.ibmRevision}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#E3D5B0]/50">{totals.ibmUnuploaded}</td>
                <td className="py-3 px-2.5 bg-[#132324] text-[#E3D5B0] font-bold">
                  {(totals.ibmTarget > 0 ? (totals.ibmUploaded / totals.ibmTarget) * 100 : 0).toFixed(2)}%
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#E3D5B0]/10 border-t border-[#1F3E47]/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#132324]/70 font-medium">
        <span>
          Menampilkan <strong>{filteredRows.length}</strong> provinsi &bull; Filter Tahun: <strong>{selectedYear}</strong>
        </span>
      </div>
    </div>
  );
};
