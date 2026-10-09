import React, { useRef } from 'react';
import { Upload, Download, RefreshCw, FileSpreadsheet, Layers, CheckCircle2, Clock, LogIn, LogOut, UserCheck, Code, Presentation } from 'lucide-react';
import { downloadSampleExcelFile } from '../utils/excelParser';
import { PuLogoSvg } from './PuLogoSvg';

interface HeaderProps {
  isLoggedIn: boolean;
  user: { name: string; email: string; role: string } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onFileUpload: (file: File) => void;
  onResetToSample: () => void;
  onOpenCodeModal?: () => void;
  onOpenPresentation?: () => void;
  activeFileName: string;
  totalRecords: number;
  scannedYears: string[];
  ignoredSheetsCount: number;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  user,
  onOpenLogin,
  onLogout,
  onFileUpload,
  onResetToSample,
  onOpenCodeModal,
  onOpenPresentation,
  activeFileName,
  totalRecords,
  scannedYears,
  ignoredSheetsCount,
  isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="bg-[#132324] text-[#E3D5B0] border-b border-[#1F3E47] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-md overflow-hidden shadow-md shadow-black/20 shrink-0 border border-white/20 bg-[#002299]">
              <PuLogoSvg className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-white tracking-tight">
                Dashboard Profil Audiovisual
              </h1>
              <p className="text-xs text-[#E3D5B0]/90 font-semibold mt-1">
                Direktorat Jenderal Cipta Karya
              </p>
              <p className="text-[11px] text-[#E3D5B0]/70 font-medium">
                Kementerian Pekerjaan Umum
              </p>
            </div>
          </div>

          {/* Controls & File Upload */}
          <div className="flex flex-wrap items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* System Status Div */}
                <div className="hidden lg:block text-right mr-2 border-r border-[#1F3E47] pr-4">
                  <p className="text-[10px] text-[#E3D5B0]/60 uppercase tracking-wider font-bold flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-[#5B7161]" /> System Status
                  </p>
                  <p className="text-xs font-bold text-[#E3D5B0] flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#5B7161] animate-pulse inline-block" />
                    Live Client Engine
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="excel-file-input"
                />

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-[#D3853E] hover:bg-[#be7331] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Excel (.xlsx)</span>
                </button>

                {/* Presentation Builder Button */}
                {onOpenPresentation && (
                  <button
                    onClick={onOpenPresentation}
                    title="Buat Paparan / Presentation Slide Mode"
                    className="inline-flex items-center gap-2 bg-[#1F3E47] hover:bg-[#284e5a] text-white text-sm font-bold px-3.5 py-2 rounded-xl border border-[#D3853E]/60 shadow-md transition-all cursor-pointer ring-1 ring-[#D3853E]/40"
                  >
                    <Presentation className="w-4 h-4 text-[#D3853E]" />
                    <span>Buat Paparan</span>
                  </button>
                )}

                {/* Code Generator Modal Trigger Button */}
                {onOpenCodeModal && (
                  <button
                    onClick={onOpenCodeModal}
                    title="Lihat / Salin / Unduh isian code sampleData.ts dari data Excel"
                    className="inline-flex items-center gap-1.5 bg-[#1F3E47] hover:bg-[#284e5a] text-[#E3D5B0] text-sm font-semibold px-3.5 py-2 rounded-xl border border-[#5B7161]/50 transition-all cursor-pointer"
                  >
                    <Code className="w-4 h-4 text-[#D3853E]" />
                    <span className="hidden sm:inline">Code sampleData.ts</span>
                  </button>
                )}

                {/* Template Button */}
                <button
                  onClick={downloadSampleExcelFile}
                  title="Unduh file Excel contoh (.xlsx) dengan sheet 2025, 2026, Raw Data"
                  className="inline-flex items-center gap-2 bg-[#5B7161] hover:bg-[#4d6052] text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Template Excel</span>
                  <span className="sm:hidden">Template</span>
                </button>

                {/* Reset Button */}
                <button
                  onClick={onResetToSample}
                  title="Reset ke data default"
                  className="inline-flex items-center gap-1.5 bg-[#1F3E47]/80 hover:bg-[#1F3E47] text-[#E3D5B0] text-sm font-semibold px-3 py-2 rounded-xl border border-[#5B7161]/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#D3853E]" />
                  <span className="hidden md:inline">Reset</span>
                </button>

                {/* User Badge & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-[#1F3E47]">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#5B7161]/40 border border-[#5B7161]/60 px-2.5 py-1.5 rounded-xl">
                    <UserCheck className="w-3.5 h-3.5 text-[#5B7161]" />
                    <span>{user?.name || 'Admin'}</span>
                  </span>
                  <button
                    onClick={onLogout}
                    title="Keluar dari sistem"
                    className="inline-flex items-center gap-1 bg-[#1F3E47] hover:bg-red-950/60 hover:text-red-300 text-[#E3D5B0] text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#5B7161]/40 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 bg-[#D3853E] hover:bg-[#be7331] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

