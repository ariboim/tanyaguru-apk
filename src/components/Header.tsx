import React from 'react';
import { Sparkles, Coins, Plus, BookOpen, Heart, User, GraduationCap } from 'lucide-react';
import { KakBintangAvatar } from './KakBintangAvatar';

interface HeaderProps {
  tokens: number;
  onOpenTopup: () => void;
  onOpenHistory: () => void;
  onOpenParentGuide: () => void;
  historyCount: number;
  userRole: 'siswa' | 'orangtua';
  setUserRole: (role: 'siswa' | 'orangtua') => void;
  userEmail: string;
}

export const Header: React.FC<HeaderProps> = ({
  tokens,
  onOpenTopup,
  onOpenHistory,
  onOpenParentGuide,
  historyCount,
  userRole,
  setUserRole,
  userEmail,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-200">
            <Sparkles className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-['Fredoka',sans-serif] text-lg md:text-2xl font-black text-amber-950 tracking-tight">
                Tanya Guru
              </h1>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full hidden sm:inline">
                SD Merdeka
              </span>
            </div>
            <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <span>Bahas PR Bareng Kak Bintang</span>
            </p>
          </div>
        </div>

        {/* Center: Role Switcher (Siswa vs Orang Tua) */}
        <div className="hidden lg:flex items-center bg-amber-50 p-1 rounded-2xl border border-amber-200 text-xs font-bold text-amber-950">
          <button
            onClick={() => setUserRole('siswa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              userRole === 'siswa'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-900 hover:text-amber-950'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Mode Siswa SD</span>
          </button>
          <button
            onClick={() => setUserRole('orangtua')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              userRole === 'orangtua'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-amber-900 hover:text-amber-950'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Mode Orang Tua</span>
          </button>
        </div>

        {/* Right side: Token Pill & Action Modals */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
            title="Buka Riwayat Soal PR"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Riwayat</span>
            {historyCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {/* Parental Guide */}
          <button
            onClick={onOpenParentGuide}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
            title="Panduan untuk Orang Tua"
          >
            <Heart className="w-3.5 h-3.5 text-teal-600" />
            <span>Panduan</span>
          </button>

          {/* Virtual Token Pill */}
          <div
            onClick={onOpenTopup}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white pl-3 pr-1.5 py-1.5 rounded-2xl shadow-sm shadow-amber-200 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-98"
            title="Klik untuk isi ulang token via Mayar"
          >
            <Coins className="w-4 h-4 text-amber-100 fill-amber-200" />
            <span className="text-xs md:text-sm font-black">
              {tokens} <span className="hidden sm:inline text-xs font-bold text-amber-100">Token</span>
            </span>
            <span className="w-5 h-5 rounded-xl bg-white/25 flex items-center justify-center text-white ml-0.5">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>

          {/* Google User Avatar chip */}
          <div
            className="hidden md:flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-2xl text-[11px] font-medium"
            title={`Akun Google: ${userEmail}`}
          >
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
              G
            </div>
            <span className="max-w-[100px] truncate">{userEmail.split('@')[0]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
