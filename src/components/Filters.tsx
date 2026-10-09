import React from 'react';
import { Filter, Calendar, MapPin, Tag, RotateCcw } from 'lucide-react';
import { FilterState } from '../types';

interface FiltersProps {
  filters: FilterState;
  availableProvinces: string[];
  availableYears: string[];
  availableProfileTypes: string[];
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  activeDrillDownLabel?: string | null;
  onClearDrillDown?: () => void;
  filteredCount: number;
  totalCount: number;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  availableProvinces,
  availableYears,
  availableProfileTypes,
  onFilterChange,
  onResetFilters,
  activeDrillDownLabel,
  onClearDrillDown,
  filteredCount,
  totalCount
}) => {
  const isFiltered =
    filters.provinsi !== 'Semua Provinsi' ||
    filters.tahun !== 'Semua Tahun' ||
    filters.jenis_profil !== 'Semua Jenis Profil' ||
    Boolean(activeDrillDownLabel);

  return (
    <div className="bg-white rounded-2xl border border-[#1F3E47]/20 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Filter Bar Header */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#1F3E47] text-[#E3D5B0] flex items-center justify-center shadow-xs">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#132324]">Filter Data Dashboard</h2>
            <p className="text-xs text-[#132324]/60">Filter bertipe AND mempengaruhi KPI, Chart, dan Tabel</p>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
          
          {/* 1. Filter Provinsi */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-[#1F3E47] uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#D3853E]" /> Provinsi
            </label>
            <select
              value={filters.provinsi}
              onChange={(e) => onFilterChange({ ...filters, provinsi: e.target.value })}
              className="w-full bg-[#E3D5B0]/20 border border-[#1F3E47]/30 hover:border-[#1F3E47] text-[#132324] text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/30 focus:border-[#D3853E] transition-all cursor-pointer"
            >
              <option value="Semua Provinsi">
                Semua Provinsi ({availableProvinces.length} Provinsi)
              </option>
              {availableProvinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Tahun (Auto-detected from numeric sheets) */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-[#1F3E47] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#D3853E]" /> Tahun
            </label>
            <select
              value={filters.tahun}
              onChange={(e) => onFilterChange({ ...filters, tahun: e.target.value })}
              className="w-full bg-[#E3D5B0]/20 border border-[#1F3E47]/30 hover:border-[#1F3E47] text-[#132324] text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/30 focus:border-[#D3853E] transition-all cursor-pointer"
            >
              <option value="Semua Tahun">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Jenis Profil */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-[#1F3E47] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#D3853E]" /> Jenis Profil
            </label>
            <select
              value={filters.jenis_profil}
              onChange={(e) => onFilterChange({ ...filters, jenis_profil: e.target.value })}
              className="w-full bg-[#E3D5B0]/20 border border-[#1F3E47]/30 hover:border-[#1F3E47] text-[#132324] text-sm font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/30 focus:border-[#D3853E] transition-all cursor-pointer"
            >
              <option value="Semua Jenis Profil">Semua Jenis Profil</option>
              {availableProfileTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Reset & Status Count */}
        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1F3E47]/10">
          <div className="text-right">
            <span className="text-xs text-[#132324]/60 font-medium">Data Terfilter:</span>
            <div className="text-sm font-bold text-[#D3853E]">
              {filteredCount} <span className="text-[#132324]/50 font-normal">/ {totalCount} paket</span>
            </div>
          </div>

          {isFiltered && (
            <button
              onClick={() => {
                onResetFilters();
                if (onClearDrillDown) onClearDrillDown();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-all border border-rose-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

      </div>

      {/* Drill-down or Filter Active Tags */}
      {isFiltered && (
        <div className="mt-3 pt-3 border-t border-[#1F3E47]/10 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#132324]/70">Filter Aktif:</span>
          {filters.provinsi !== 'Semua Provinsi' && (
            <span className="inline-flex items-center gap-1 text-xs bg-[#1F3E47]/10 text-[#1F3E47] font-semibold px-2.5 py-1 rounded-lg border border-[#1F3E47]/30">
              Provinsi: {filters.provinsi}
            </span>
          )}
          {filters.tahun !== 'Semua Tahun' && (
            <span className="inline-flex items-center gap-1 text-xs bg-[#5B7161]/15 text-[#132324] font-semibold px-2.5 py-1 rounded-lg border border-[#5B7161]/30">
              Tahun: {filters.tahun}
            </span>
          )}
          {filters.jenis_profil !== 'Semua Jenis Profil' && (
            <span className="inline-flex items-center gap-1 text-xs bg-[#D3853E]/15 text-[#D3853E] font-semibold px-2.5 py-1 rounded-lg border border-[#D3853E]/30">
              Jenis: {filters.jenis_profil}
            </span>
          )}
          {activeDrillDownLabel && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-[#D3853E] text-white font-semibold px-2.5 py-1 rounded-lg shadow-2xs">
              <span>Drill-down KPI: {activeDrillDownLabel}</span>
              {onClearDrillDown && (
                <button
                  onClick={onClearDrillDown}
                  className="hover:text-amber-100 font-bold ml-1 cursor-pointer"
                  title="Hapus filter drill-down KPI"
                >
                  &times;
                </button>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
