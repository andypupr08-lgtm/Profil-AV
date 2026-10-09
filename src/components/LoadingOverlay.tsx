import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading Dashboard...' }) => {
  return (
    <div className="fixed inset-0 bg-[#132324]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#132324] rounded-2xl p-6 shadow-2xl border border-[#1F3E47] flex flex-col items-center max-w-xs w-full text-center animate-in fade-in zoom-in duration-200">
        <div className="w-12 h-12 rounded-2xl bg-[#1F3E47] text-[#D3853E] flex items-center justify-center mb-3 border border-[#5B7161]/30">
          <Loader2 className="w-7 h-7 animate-spin text-[#D3853E]" />
        </div>
        <h3 className="text-base font-bold text-white">{message}</h3>
        <p className="text-xs text-[#E3D5B0]/70 mt-1">Membaca dan memproses sheet data Excel...</p>
      </div>
    </div>
  );
};
