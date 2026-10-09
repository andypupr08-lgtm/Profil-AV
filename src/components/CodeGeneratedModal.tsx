import React, { useState } from 'react';
import { Code, Copy, Check, Download, X, FileCode } from 'lucide-react';
import { downloadTsFile } from '../utils/codeGenerator';

interface CodeGeneratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedCode: string;
  activeFileName: string;
}

export const CodeGeneratedModal: React.FC<CodeGeneratedModalProps> = ({
  isOpen,
  onClose,
  generatedCode,
  activeFileName,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTsFile(generatedCode, 'code-utils-sampleData.ts');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#132324] text-white flex items-center justify-between border-b border-[#1F3E47]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F3E47] text-[#D3853E] flex items-center justify-center border border-[#5B7161]/30 shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Code utils sampleData.ts</span>
                <span className="text-[10px] bg-[#D3853E]/20 text-[#E3D5B0] px-2 py-0.5 rounded-md border border-[#D3853E]/40 font-semibold uppercase">
                  Excel Auto-Generated
                </span>
              </h3>
              <p className="text-xs text-[#E3D5B0]/70 mt-0.5">
                Dihasilkan dari file: <strong className="text-white">{activeFileName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1F3E47] rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Info */}
        <div className="bg-[#E3D5B0]/10 border-b border-[#1F3E47]/10 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#132324]">
            <Code className="w-4 h-4 text-[#D3853E]" />
            <span>Format: <strong>TypeScript (.ts)</strong> &bull; Siap dimasukkan ke <code>src/utils/sampleData.ts</code> atau <code>code-utils-sampleData.ts</code></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                copied
                  ? 'bg-[#5B7161] text-white'
                  : 'bg-white border border-[#1F3E47]/30 text-[#132324] hover:bg-[#E3D5B0]/30'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 bg-[#132324] hover:bg-[#1F3E47] text-white px-3 py-1.5 rounded-lg font-semibold text-xs shadow-xs border border-[#1F3E47] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D3853E]" />
              <span>Unduh code-utils-sampleData.ts</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#132324] font-mono text-xs text-[#E3D5B0] leading-relaxed">
          <pre className="whitespace-pre-wrap break-all selection:bg-[#D3853E] selection:text-white">
            <code>{generatedCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#E3D5B0]/10 border-t border-[#1F3E47]/10 flex justify-between items-center text-xs text-[#132324]/70">
          <span>Gunakan file ini untuk menyimpan data sampel permanen di sistem.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#132324] text-white rounded-lg hover:bg-[#1F3E47] font-semibold transition-all cursor-pointer border border-[#1F3E47]"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
