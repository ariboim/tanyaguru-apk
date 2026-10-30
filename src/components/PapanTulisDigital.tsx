import React, { useState } from 'react';
import { PapanTulisLangkah } from '../types';
import { CheckCircle2, Copy, Check, Eye, EyeOff, BookOpen, Sparkles, HelpCircle, Layers } from 'lucide-react';
import { playChimeSound } from '../utils/speech';

interface PapanTulisDigitalProps {
  ringkasanMateri: string;
  langkahList: PapanTulisLangkah[];
}

export const PapanTulisDigital: React.FC<PapanTulisDigitalProps> = ({
  ringkasanMateri,
  langkahList,
}) => {
  // Mode: green chalkboard or modern bright whiteboard
  const [boardTheme, setBoardTheme] = useState<'chalkboard' | 'whiteboard'>('chalkboard');
  // Revealed step count for pedagogical step-by-step guidance
  const [revealedCount, setRevealedCount] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const handleNextStep = () => {
    if (revealedCount < langkahList.length) {
      setRevealedCount(prev => prev + 1);
      playChimeSound('step');
    }
  };

  const handleRevealAll = () => {
    setRevealedCount(langkahList.length);
    playChimeSound('success');
  };

  const handleCopyBoard = () => {
    const textContent = `📚 ${ringkasanMateri}\n\n` +
      langkahList.map(l => `${l.judul_langkah}\n${l.tampilan_layar}\n`).join('\n---\n\n');
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="papan-tulis-virtual"
      className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-amber-800/80 transition-all duration-300"
    >
      {/* Visual Call-to-action Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-black flex items-center justify-between gap-2 shadow-xs border-b border-amber-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
          <span>Papan Tulis Virtual: Yuk buka langkah demi langkahnya di bawah ini!</span>
        </div>
        <span className="text-[11px] font-bold text-amber-900 hidden sm:inline">
          Sesuai arahan Kak Bintang
        </span>
      </div>

      {/* Wood Frame Header / Bar */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-amber-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-700/80 border border-amber-500/50 flex items-center justify-center text-amber-200">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-extrabold tracking-wide uppercase text-amber-200 flex items-center gap-1.5">
              <span>Papan Tulis Digital Kak Bintang</span>
              <span className="bg-amber-600/60 text-amber-100 text-[10px] px-2 py-0.5 rounded-full font-mono normal-case">
                Kurikulum Merdeka
              </span>
            </h4>
            <p className="text-[11px] text-amber-300/80 font-medium truncate max-w-[260px] md:max-w-md">
              {ringkasanMateri}
            </p>
          </div>
        </div>

        {/* Board Controls */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Theme switcher */}
          <div className="flex bg-amber-950/70 p-0.5 rounded-xl border border-amber-700/60 text-xs font-semibold">
            <button
              onClick={() => setBoardTheme('chalkboard')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                boardTheme === 'chalkboard'
                  ? 'bg-emerald-800 text-emerald-100 shadow-xs'
                  : 'text-amber-300/70 hover:text-amber-200'
              }`}
            >
              Papan Kapur
            </button>
            <button
              onClick={() => setBoardTheme('whiteboard')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                boardTheme === 'whiteboard'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-amber-300/70 hover:text-amber-200'
              }`}
            >
              Whiteboard
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyBoard}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-700/70 hover:bg-amber-600 text-amber-100 text-xs font-semibold transition-colors"
            title="Salin seluruh isi papan untuk dicatat di buku PR"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin PR'}</span>
          </button>
        </div>
      </div>

      {/* Main Board Surface */}
      <div
        className={`p-4 md:p-7 min-h-[360px] transition-colors duration-300 ${
          boardTheme === 'chalkboard'
            ? 'bg-[#1b3a2f] text-emerald-50'
            : 'bg-white text-slate-800'
        }`}
      >
        {/* Subtle grid or chalk dust texture */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-dashed border-emerald-600/30">
          <div className="flex items-center gap-2">
            <Layers className={`w-4 h-4 ${boardTheme === 'chalkboard' ? 'text-emerald-400' : 'text-blue-500'}`} />
            <span className={`text-xs md:text-sm font-bold ${boardTheme === 'chalkboard' ? 'text-emerald-200' : 'text-slate-700'}`}>
              Langkah Nalar ({Math.min(revealedCount, langkahList.length)} dari {langkahList.length} Terbuka)
            </span>
          </div>

          {revealedCount < langkahList.length ? (
            <button
              onClick={handleRevealAll}
              className={`text-xs font-semibold underline underline-offset-4 flex items-center gap-1 ${
                boardTheme === 'chalkboard' ? 'text-amber-300 hover:text-amber-200' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Buka Semua Sekaligus</span>
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Semua langkah selesai dipelajari!
            </span>
          )}
        </div>

        {/* Step Cards List */}
        <div className="space-y-4">
          {langkahList.map((step, idx) => {
            const isRevealed = idx < revealedCount;
            const isFinalStep = idx === langkahList.length - 1;

            if (!isRevealed) {
              return (
                <div
                  key={step.urutan || idx}
                  onClick={handleNextStep}
                  className={`p-4 rounded-2xl border-2 border-dashed flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                    boardTheme === 'chalkboard'
                      ? 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300/70 hover:border-emerald-500'
                      : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        boardTheme === 'chalkboard'
                          ? 'bg-emerald-800/80 text-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-xs md:text-sm">
                        {step.judul_langkah || `Langkah ${idx + 1}`}
                      </p>
                      <p className="text-[11px] opacity-75">
                        Klik untuk membuka logika pengerjaan langkah ini bersama Kak Bintang
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      boardTheme === 'chalkboard'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                    }`}
                  >
                    <span>Buka Langkah</span>
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={step.urutan || idx}
                className={`p-4 md:p-5 rounded-2xl transition-all duration-300 relative ${
                  boardTheme === 'chalkboard'
                    ? isFinalStep
                      ? 'bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-2 border-yellow-400/80 shadow-lg'
                      : 'bg-emerald-950/70 border border-emerald-700/70 shadow-md'
                    : isFinalStep
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 shadow-md'
                    : 'bg-slate-50 border border-slate-200 shadow-xs'
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                        isFinalStep
                          ? 'bg-yellow-400 text-yellow-950'
                          : boardTheme === 'chalkboard'
                          ? 'bg-emerald-500 text-emerald-950'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <h5
                      className={`text-sm md:text-base font-extrabold ${
                        isFinalStep
                          ? boardTheme === 'chalkboard'
                            ? 'text-yellow-300'
                            : 'text-amber-900'
                          : boardTheme === 'chalkboard'
                          ? 'text-emerald-100'
                          : 'text-slate-800'
                      }`}
                    >
                      {step.judul_langkah}
                    </h5>
                  </div>

                  {isFinalStep && (
                    <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Jawaban Akhir
                    </span>
                  )}
                </div>

                {/* Step Body Content - Chalkboard text */}
                <div
                  className={`pl-9 whitespace-pre-wrap font-sans text-xs md:text-sm leading-relaxed ${
                    boardTheme === 'chalkboard'
                      ? 'text-emerald-100/90 font-mono tracking-wide'
                      : 'text-slate-700 font-sans'
                  }`}
                >
                  {step.tampilan_layar}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pedagogical Next Step Prompt */}
        {revealedCount < langkahList.length && (
          <div className="mt-5 text-center">
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Lanjut ke Langkah {revealedCount + 1}</span>
              <Sparkles className="w-4 h-4 fill-amber-950" />
            </button>
            <p className="text-[11px] mt-1.5 opacity-70">
              Kak Bintang menemani kamu memahami satu per satu logikanya!
            </p>
          </div>
        )}
      </div>

      {/* Chalk Tray footer */}
      <div className="bg-amber-900/90 px-4 py-2 border-t-2 border-amber-800 flex items-center justify-between text-[11px] text-amber-200">
        <div className="flex items-center gap-2">
          {/* Simulated colorful chalk pieces */}
          <div className="w-8 h-2 rounded-full bg-white shadow-xs"></div>
          <div className="w-7 h-2 rounded-full bg-yellow-300 shadow-xs"></div>
          <div className="w-6 h-2 rounded-full bg-rose-400 shadow-xs"></div>
          <div className="w-8 h-2 rounded-full bg-sky-300 shadow-xs"></div>
          <span className="hidden sm:inline text-amber-300/80 ml-1">Papan Tulis Kurikulum Merdeka</span>
        </div>
        <span className="font-semibold text-amber-100">
          💡 Catat rapi di buku PR sekolahmu ya!
        </span>
      </div>
    </div>
  );
};
