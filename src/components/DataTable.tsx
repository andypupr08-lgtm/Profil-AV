import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  FileSpreadsheet,
  Copy,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProfilItem, DrillDownFilter } from '../types';

interface DataTableProps {
  items: ProfilItem[];
  activeDrillDown: DrillDownFilter;
  onClearDrillDown: () => void;
}

type SortField = keyof ProfilItem | 'no';
type SortOrder = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({ items, activeDrillDown, onClearDrillDown }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusVerifikasiFilter, setStatusVerifikasiFilter] = useState<string>('ALL');
  const [jenisProfilFilter, setJenisProfilFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<SortField>('provinsi');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Dynamic unique options for Jenis Profil
  const jenisProfilOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.jenis_profil && (item.jenis_profil === 'Reguler' || item.jenis_profil === 'IBM')) {
        set.add(item.jenis_profil);
      }
    });
    const arr = Array.from(set).sort();
    return arr.length > 0 ? arr : ['Reguler', 'IBM'];
  }, [items]);

  // Dynamic unique options for Status Verifikasi
  const statusVerifikasiOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.status_verifikasi) set.add(item.status_verifikasi);
    });
    const defaultList = ['Disetujui', 'Perlu Perbaikan', 'Belum Diverifikasi', 'Belum Upload'];
    return Array.from(new Set([...defaultList, ...Array.from(set)]));
  }, [items]);

  // 1. Filter items by Search Term & Dropdown Filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter Status Verifikasi
      if (statusVerifikasiFilter !== 'ALL') {
        if (statusVerifikasiFilter === 'Belum Upload' || statusVerifikasiFilter === 'Belum Diupload') {
          if (
            item.status_verifikasi !== 'Belum Upload' &&
            item.status_verifikasi !== 'Belum Diupload' &&
            item.status_upload !== 'Belum Upload' &&
            item.status_upload !== 'Belum Diupload'
          ) {
            return false;
          }
        } else if (item.status_verifikasi !== statusVerifikasiFilter) {
          return false;
        }
      }
      // Filter Jenis Profil
      if (jenisProfilFilter !== 'ALL' && item.jenis_profil !== jenisProfilFilter) {
        return false;
      }
      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          String(item.provinsi || '').toLowerCase().includes(term) ||
          String(item.tahun || '').toLowerCase().includes(term) ||
          String(item.nama_paket || '').toLowerCase().includes(term) ||
          String(item.jenis_profil || '').toLowerCase().includes(term) ||
          String(item.status_verifikasi || '').toLowerCase().includes(term) ||
          String(item.tanggal_upload || '').toLowerCase().includes(term) ||
          String(item.keterangan || '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [items, statusVerifikasiFilter, jenisProfilFilter, searchTerm]);

  // 2. Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let valA = a[sortField as keyof ProfilItem] ?? '';
      let valB = b[sortField as keyof ProfilItem] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortOrder]);

  // 3. Paginate items
  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    if (pageSize === -1) return sortedItems;
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  // Handle Sort Click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = sortedItems.map((item, idx) => ({
      No: idx + 1,
      Provinsi: item.provinsi,
      Tahun: item.tahun,
      'Nama Paket': item.nama_paket,
      'Jenis Profil': item.jenis_profil,
      'Target iEmon': item.target_iemon,
      'Status Verifikasi': item.status_verifikasi,
      Keterangan: item.keterangan
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profil_Audiovisual');
    XLSX.writeFile(wb, `Profil_Audiovisual_CiptaKarya_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = sortedItems.map((item, idx) => ({
      No: idx + 1,
      Provinsi: item.provinsi,
      Tahun: item.tahun,
      'Nama Paket': item.nama_paket,
      'Jenis Profil': item.jenis_profil,
      'Target iEmon': item.target_iemon,
      'Status Verifikasi': item.status_verifikasi,
      Keterangan: item.keterangan
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Profil_Audiovisual_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to Clipboard
  const handleCopy = () => {
    const headers = ['No', 'Provinsi', 'Tahun', 'Nama Paket', 'Jenis Profil', 'Status Verifikasi', 'Tanggal Upload', 'Keterangan'];
    const rows = sortedItems.map((item, idx) => [
      idx + 1,
      item.provinsi,
      item.tahun,
      `"${item.nama_paket}"`,
      item.jenis_profil,
      item.status_verifikasi,
      item.tanggal_upload,
      `"${item.keterangan}"`
    ].join('\t'));

    const text = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    });
  };

  // Print View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-[#1F3E47]/20 shadow-sm overflow-hidden" id="dashboard-table-container">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-[#1F3E47]/10 bg-[#E3D5B0]/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <h3 className="text-base font-bold text-[#132324] flex items-center gap-2">
              <span>Detail Profil Audiovisual</span>
              <span className="text-xs bg-[#D3853E] text-white font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                {sortedItems.length} Data
              </span>
            </h3>
            <p className="text-xs text-[#132324]/60 mt-0.5">
              Daftar paket terstruktur dengan pencarian, pengurutan, pagination, dan ekspor
            </p>
          </div>

          {/* Action Buttons & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Jenis Profil */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#1F3E47] hidden sm:inline">Jenis Profil:</span>
              <select
                value={jenisProfilFilter}
                onChange={(e) => {
                  setJenisProfilFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#1F3E47]/30 text-[#132324] text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/20 focus:border-[#D3853E] transition-all cursor-pointer"
              >
                <option value="ALL">Semua Jenis Profil</option>
                {jenisProfilOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status Verifikasi */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#1F3E47] hidden sm:inline">Status Verifikasi:</span>
              <select
                value={statusVerifikasiFilter}
                onChange={(e) => {
                  setStatusVerifikasiFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#1F3E47]/30 text-[#132324] text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#D3853E]/20 focus:border-[#D3853E] transition-all cursor-pointer"
              >
                <option value="ALL">Semua Status Verifikasi</option>
                {statusVerifikasiOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Excel Action */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 bg-[#5B7161] hover:bg-[#4a5e50] text-white text-xs font-medium px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Ekspor ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Drilldown Banner Notification */}
        {activeDrillDown.field && (
          <div className="mt-3 bg-[#D3853E]/15 border border-[#D3853E]/40 text-[#132324] rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#D3853E]" />
              <span>Drill-down Aktif dari KPI: <strong>{activeDrillDown.label}</strong></span>
            </div>
            <button
              onClick={onClearDrillDown}
              className="text-[#D3853E] hover:text-[#b86d2a] underline text-xs cursor-pointer font-bold"
            >
              Hapus Drill-down KPI
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#132324] border-collapse">
          <thead className="bg-[#132324] text-[#E3D5B0] font-bold uppercase tracking-wider border-b border-[#1F3E47] sticky top-0 z-10">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center">No</th>
              
              <th
                onClick={() => handleSort('provinsi')}
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1F3E47] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Provinsi</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5B7161]" />
                </div>
              </th>

              <th
                onClick={() => handleSort('tahun')}
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1F3E47] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Tahun</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5B7161]" />
                </div>
              </th>

              <th
                onClick={() => handleSort('nama_paket')}
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1F3E47] transition-colors min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>Nama Paket</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5B7161]" />
                </div>
              </th>

              <th
                onClick={() => handleSort('jenis_profil')}
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1F3E47] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Jenis Profil</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5B7161]" />
                </div>
              </th>

              <th
                onClick={() => handleSort('status_verifikasi')}
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1F3E47] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Status Verifikasi</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5B7161]" />
                </div>
              </th>

              <th className="py-3.5 px-4 min-w-[150px]">Keterangan</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1F3E47]/10">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#132324]/60">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">📄</span>
                    <p className="font-semibold text-[#132324]">Tidak ada data yang sesuai dengan filter.</p>
                    <p className="text-xs text-[#132324]/50">Coba ubah kriteria pencarian atau reset filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const globalIndex = pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;

                return (
                  <tr key={item.id || idx} className="hover:bg-[#E3D5B0]/30 transition-colors">
                    <td className="py-3 px-4 text-center font-semibold text-[#132324]/60">{globalIndex}</td>
                    
                    <td className="py-3 px-4 font-semibold text-[#132324]">{item.provinsi}</td>
                    
                    <td className="py-3 px-4">
                      <span className="bg-[#1F3E47]/10 text-[#1F3E47] font-bold px-2 py-0.5 rounded text-[11px] border border-[#1F3E47]/20">
                        {item.tahun}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-[#132324]">{item.nama_paket}</td>

                    <td className="py-3 px-4">
                      <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                        item.jenis_profil === 'IBM'
                          ? 'bg-[#1F3E47] text-white border border-[#5B7161]/50'
                          : 'bg-[#D3853E]/20 text-[#132324] border border-[#D3853E]/40'
                      }`}>
                        {item.jenis_profil}
                      </span>
                    </td>

                    {/* Status Verifikasi Badge */}
                    <td className="py-3 px-4">
                      {item.status_verifikasi === 'Disetujui' && (
                        <span className="inline-flex items-center gap-1 bg-[#5B7161]/20 text-[#132324] border border-[#5B7161]/50 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-[#5B7161]" />
                          Disetujui
                        </span>
                      )}
                      {item.status_verifikasi === 'Perlu Perbaikan' && (
                        <span className="inline-flex items-center gap-1 bg-[#D3853E]/20 text-[#132324] border border-[#D3853E]/50 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-[#D3853E]" />
                          Perlu Perbaikan
                        </span>
                      )}
                      {item.status_verifikasi === 'Belum Diverifikasi' && (
                        <span className="inline-flex items-center gap-1 bg-[#1F3E47]/10 text-[#1F3E47] border border-[#1F3E47]/30 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                          <Clock className="w-3 h-3 text-[#1F3E47]" />
                          Belum Diverifikasi
                        </span>
                      )}
                      {(item.status_verifikasi === 'Belum Upload' || item.status_verifikasi === 'Belum Diupload') && (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-700 border border-red-500/30 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                          <XCircle className="w-3 h-3 text-red-600" />
                          Belum Upload
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#132324]/60 italic max-w-xs truncate" title={item.keterangan}>
                      {item.keterangan || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[#1F3E47]/10 bg-[#E3D5B0]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#132324]/70">
        
        {/* Page Size & Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#1F3E47]/30 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:border-[#D3853E]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>Semua</option>
            </select>
            <span>per halaman</span>
          </div>

          <span className="text-[#1F3E47]/30">|</span>

          <span>
            Menampilkan <strong>{paginatedItems.length}</strong> dari <strong>{sortedItems.length}</strong> entri
          </span>
        </div>

        {/* Navigation Buttons */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#1F3E47]/30 bg-white hover:bg-[#E3D5B0]/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#132324]" />
            </button>

            <span className="px-3 py-1 font-semibold text-[#132324] bg-white border border-[#1F3E47]/20 rounded-lg">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#1F3E47]/30 bg-white hover:bg-[#E3D5B0]/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-[#132324]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
