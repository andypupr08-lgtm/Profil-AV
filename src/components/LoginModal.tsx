import React, { useState } from 'react';
import { Lock, User, X, LogIn, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi');
      return;
    }

    setIsLoading(true);

    // Simulate login authentication
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: 'Admin Cipta Karya',
        email: username.includes('@') ? username : `${username}@pupr.go.id`,
        role: 'Administrator'
      });
      onClose();
    }, 400);
  };

  const handleDemoLogin = () => {
    setUsername('admin');
    setPassword('admin123');
    onLoginSuccess({
      name: 'Admin Cipta Karya',
      email: 'admin.ciptakarya@pupr.go.id',
      role: 'Administrator'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#132324] border-b border-[#1F3E47] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-[#1F3E47] flex items-center justify-center mb-3 border border-[#5B7161]/40">
            <ShieldCheck className="w-6 h-6 text-[#D3853E]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Masuk ke Sistem</h2>
          <p className="text-xs text-[#E3D5B0]/80 mt-1">
            Silakan masuk untuk mengunggah file Excel dan mengelola data profil audiovisual.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          {error && (
            <div className="flex items-center gap-2 text-xs bg-[#D3853E]/10 text-[#132324] p-3 rounded-xl border border-[#D3853E]/40 font-medium">
              <AlertCircle className="w-4 h-4 text-[#D3853E] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#132324] mb-1.5 uppercase tracking-wide">
              Username / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#1F3E47]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau email"
                className="w-full pl-10 pr-4 py-2.5 bg-[#E3D5B0]/10 border border-[#1F3E47]/20 rounded-xl text-sm font-medium text-[#132324] placeholder:text-[#132324]/40 focus:outline-none focus:ring-2 focus:ring-[#D3853E] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#132324] mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#1F3E47]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-2.5 bg-[#E3D5B0]/10 border border-[#1F3E47]/20 rounded-xl text-sm font-medium text-[#132324] placeholder:text-[#132324]/40 focus:outline-none focus:ring-2 focus:ring-[#D3853E] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1F3E47]/60 hover:text-[#132324] transition-colors p-1 cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#132324] hover:bg-[#1F3E47] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer disabled:opacity-50 border border-[#1F3E47]"
            >
              <LogIn className="w-4 h-4 text-[#D3853E]" />
              <span>{isLoading ? 'Memproses...' : 'Masuk sekarang'}</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1F3E47]/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#132324]/50 font-semibold">Atau</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full bg-[#E3D5B0]/20 hover:bg-[#E3D5B0]/40 text-[#132324] font-semibold py-2 px-4 rounded-xl border border-[#1F3E47]/20 text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#5B7161]" />
            <span>Masuk Cepat sebagai Admin (Demo)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
