import React from 'react';
import { FileText, CheckCircle, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { FilterState, KPIStats } from '../types';

interface SummaryCardProps {
  filters: FilterState;
  stats: KPIStats;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ filters, stats }) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
      {/* Decorative accent background light */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-100">Ringkasan Dashboard</h3>
            <p className="text-xs text-slate-400">Ringkasan status agregat berdasarkan parameter filter saat ini</p>
          </div>
        </div>
        <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full font-medium hidden sm:inline-block">
          Cipta Karya Executive Summary
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 text-xs">
        
        {/* Data Tahun */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] block font-medium">Data Tahun</span>
          <span className="text-sm font-bold text-amber-400 mt-0.5 block truncate">
            {filters.tahun}
          </span>
        </div>

        {/* Provinsi */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] block font-medium">Provinsi</span>
          <span className="text-sm font-bold text-blue-300 mt-0.5 block truncate" title={filters.provinsi}>
            {filters.provinsi}
          </span>
        </div>

        {/* Jenis Profil */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] block font-medium">Jenis Profil</span>
          <span className="text-sm font-bold text-violet-300 mt-0.5 block truncate">
            {filters.jenis_profil}
          </span>
        </div>

        {/* Target */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] block font-medium">Target iEmon</span>
          <span className="text-sm font-black text-slate-100 mt-0.5 block">
            {stats.targetIEmon}
          </span>
        </div>

        {/* Sudah Upload */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] block font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Sudah Upload
          </span>
          <span className="text-sm font-black text-emerald-400 mt-0.5 block">
            {stats.sudahUpload}
          </span>
        </div>

        {/* Belum Upload */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
          <span className="text-slate-400 text-[11px] block font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-400" /> Belum Upload
          </span>
          <span className="text-sm font-black text-rose-400 mt-0.5 block">
            {stats.belumUpload}
          </span>
        </div>

        {/* Persentase */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 col-span-2 sm:col-span-1">
          <span className="text-slate-400 text-[11px] block font-medium flex items-center gap-1">
            <PieChartIcon className="w-3 h-3 text-violet-400" /> Persentase
          </span>
          <span className="text-sm font-black text-violet-300 mt-0.5 block">
            {stats.persentaseKeterisian.toFixed(2)}%
          </span>
        </div>

      </div>
    </div>
  );
};
