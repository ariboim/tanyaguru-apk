import React, { useState, useEffect } from 'react';
import {
  TanyaGuruResult,
  SoalHistoryItem,
  TokenTransaction,
} from './types';
import { Header } from './components/Header';
import { KakBintangAvatar } from './components/KakBintangAvatar';
import { QuestionInput } from './components/QuestionInput';
import { AudioNarasiPlayer } from './components/AudioNarasiPlayer';
import { PapanTulisDigital } from './components/PapanTulisDigital';
import { TipsJuaraCard } from './components/TipsJuaraCard';
import { SoalLatihanSection } from './components/SoalLatihanSection';
import { MayarTopupModal } from './components/MayarTopupModal';
import { RiwayatBelajarModal } from './components/RiwayatBelajarModal';
import { ParentGuideModal } from './components/ParentGuideModal';
import {
  Sparkles,
  BookOpen,
  ArrowDown,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Coins,
  Smile,
  ShieldCheck,
  GraduationCap,
  Heart,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { playChimeSound } from './utils/speech';

export default function App() {
  // Tokens state
  const [tokens, setTokens] = useState<number>(() => {
    const saved = localStorage.getItem('tanya_guru_tokens');
    return saved !== null ? parseInt(saved, 10) : 5; // 5 free tokens on initial start
  });

  // History state
  const [history, setHistory] = useState<SoalHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('tanya_guru_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Transactions state
  const [transactions, setTransactions] = useState<TokenTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('tanya_guru_transactions');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'init-bonus',
          timestamp: Date.now(),
          description: 'Bonus Pendaftaran Awal (Akun Google)',
          amount: 5,
          balanceAfter: 5,
          type: 'bonus',
        },
      ];
    } catch {
      return [];
    }
  });

  // Current active analysis result
  const [currentResult, setCurrentResult] = useState<TanyaGuruResult | null>(null);
  const [activeQuestionMeta, setActiveQuestionMeta] = useState<{
    prompt?: string;
    imageBase64?: string;
    driveUrl?: string;
    fase: string;
    mataPelajaran: string;
  } | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<{
    prompt: string;
    imageBase64?: string;
    mimeType?: string;
    driveUrl?: string;
    fase: string;
    mataPelajaran: string;
  } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userRole, setUserRole] = useState<'siswa' | 'orangtua'>('siswa');
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isParentGuideModalOpen, setIsParentGuideModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const userEmail = 'bca.ccpl@gmail.com';

  // Save tokens and transactions
  useEffect(() => {
    localStorage.setItem('tanya_guru_tokens', tokens.toString());
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('tanya_guru_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('tanya_guru_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add tokens via Mayar or Voucher
  const handleAddTokens = (
    amount: number,
    description: string,
    type: 'mayar_topup' | 'voucher'
  ) => {
    const newBal = tokens + amount;
    setTokens(newBal);
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        timestamp: Date.now(),
        description,
        amount,
        balanceAfter: newBal,
        type,
      },
      ...prev,
    ]);
    showToast(`🎉 Sukses! +${amount} Token telah masuk ke akunmu.`);
  };

  // Consume 1 token upon successful PR answer
  const deductTokenForAnalysis = (topic: string) => {
    const newBal = Math.max(0, tokens - 1);
    setTokens(newBal);
    setTransactions((prev) => [
      {
        id: `usage-${Date.now()}`,
        timestamp: Date.now(),
        description: `Analisis Soal PR: ${topic.slice(0, 32)}...`,
        amount: -1,
        balanceAfter: newBal,
        type: 'usage',
      },
      ...prev,
    ]);
    showToast(`1 Token digunakan. Sisa token belajar: ${newBal}`);
  };

  // Submit PR Question
  const handleAnalyzePR = async (data: {
    prompt: string;
    imageBase64?: string;
    mimeType?: string;
    driveUrl?: string;
    fase: string;
    mataPelajaran: string;
  }) => {
    if (tokens <= 0) {
      setIsTopupModalOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCurrentResult(null);
    setLastSubmittedData(data);

    try {
      const res = await fetch('/api/analyze-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menganalisis soal PR.');
      }

      const result: TanyaGuruResult = json.data;
      setCurrentResult(result);
      setActiveQuestionMeta(data);

      // Deduct 1 token
      deductTokenForAnalysis(result.ringkasan_materi);

      // Add to history
      const historyItem: SoalHistoryItem = {
        id: `pr-${Date.now()}`,
        timestamp: Date.now(),
        soalText: data.prompt,
        imageUrl: data.imageBase64,
        driveUrl: data.driveUrl,
        fase: data.fase,
        mataPelajaran: data.mataPelajaran,
        result,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 24)]);

      playChimeSound('success');

      // Scroll smoothly to blackboard
      setTimeout(() => {
        document.getElementById('papan-tulis-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan saat memproses soal.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select item from history
  const handleSelectHistoryItem = (item: SoalHistoryItem) => {
    setCurrentResult(item.result);
    setActiveQuestionMeta({
      prompt: item.soalText,
      imageBase64: item.imageUrl,
      fase: item.fase,
      mataPelajaran: item.mataPelajaran,
    });
    showToast(`Membuka riwayat pembahasan: ${item.result.ringkasan_materi}`);
    setTimeout(() => {
      document.getElementById('papan-tulis-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 200);
  };

  const handleClearHistory = () => {
    if (confirm('Yakin ingin menghapus semua riwayat soal tersimpan?')) {
      setHistory([]);
      showToast('Riwayat berhasil dibersihkan.');
    }
  };

  // Dynamic avatar state
  const avatarState = isLoading
    ? 'thinking'
    : isSpeaking
    ? 'speaking'
    : currentResult
    ? 'celebrating'
    : 'idle';

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 bg-slate-900 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2 animate-bounce-subtle">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        tokens={tokens}
        onOpenTopup={() => setIsTopupModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenParentGuide={() => setIsParentGuideModalOpen(true)}
        historyCount={history.length}
        userRole={userRole}
        setUserRole={setUserRole}
        userEmail={userEmail}
      />

      {/* Hero Welcome Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8 space-y-7">
        <section className="bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200/60 rounded-3xl p-5 md:p-8 border-2 border-amber-300 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Mascot Avatar with dynamic speech bubble */}
            <div className="flex-shrink-0">
              <KakBintangAvatar
                state={avatarState}
                size="hero"
                bubbleText={
                  isLoading
                    ? 'Tunggu sebentar ya, Kak Bintang sedang membaca dan membedah logikanya...'
                    : isSpeaking
                    ? 'Dengarkan baik-baik ya, Kak Bintang jelaskan pelan-pelan!'
                    : currentResult
                    ? 'Wah, hebat! Soal ini sudah selesai kita bedah bareng di papan tulis!'
                    : userRole === 'orangtua'
                    ? 'Halo Ayah/Bunda! Yuk kita dampingi ananda memahami PR dengan nalar ceria.'
                    : 'Halo Adik Juara! Ada soal PR yang bikin bingung? Yuk foto atau tulis di sini!'
                }
              />
            </div>

            {/* Intro Copy */}
            <div className="flex-1 text-center md:text-left space-y-2.5">
              <div className="inline-flex items-center gap-1.5 bg-amber-200/80 text-amber-950 px-3 py-1 rounded-full text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Asisten Belajar Kurikulum Merdeka (Fase A, B & C)</span>
              </div>

              <h2 className="font-['Fredoka',sans-serif] text-2xl md:text-3xl font-black text-amber-950 leading-tight">
                Belajar Jadi Seru, Nalar Makin Tajam, PR Tuntas Bareng Kak Bintang!
              </h2>

              <p className="text-xs md:text-sm text-amber-900/85 font-medium leading-relaxed max-w-2xl">
                Kak Bintang siap menemani siswa SD dan orang tua membedah langkah penyelesaian soal PR secara sabar dan tuntas. Bukan sekadar contekan cepat, tapi melatih logika berpikir agar anak siap jadi juara kelas!
              </p>

              {/* Free Token / Freemium Banner */}
              <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                  <Coins className="w-4 h-4 text-amber-600 fill-amber-300" />
                  <span>Kuota Belajar: {tokens} Token Tersedia</span>
                </div>

                <button
                  onClick={() => setIsTopupModalOpen(true)}
                  className="text-xs font-black text-amber-800 hover:text-amber-950 underline underline-offset-4 flex items-center gap-1 cursor-pointer"
                >
                  <span>Isi Ulang via Mayar</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Question Submission Input Box */}
        <section>
          <QuestionInput
            onAnalyze={handleAnalyzePR}
            isLoading={isLoading}
            tokens={tokens}
            onOpenTopup={() => setIsTopupModalOpen(true)}
          />
        </section>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 md:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs md:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-amber-950 leading-snug">{errorMessage}</p>
                <p className="text-[11px] text-amber-800/80 font-medium mt-0.5">
                  Kak Bintang siap mencoba kembali membedah soal ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              {lastSubmittedData && (
                <button
                  onClick={() => handleAnalyzePR(lastSubmittedData)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Coba Lagi</span>
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* RESULTS SECTION: Audio Narration, Digital Blackboard, Tips Juara, and Practice Challenge */}
        {currentResult && (
          <div id="papan-tulis-section" className="space-y-6 pt-3 animate-fade-in">
            {/* Subject Summary Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-wider uppercase text-amber-200">
                    Materi Pembahasan Selesai
                  </span>
                  <h3 className="text-sm md:text-base font-extrabold">
                    {currentResult.ringkasan_materi}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                  1 Soal PR Tuntas
                </span>
              </div>
            </div>

            {/* 1. Interactive Audio Narration Player with Autoplay */}
            <AudioNarasiPlayer
              narasiText={currentResult.skrip_audio_narasi}
              onSpeakingChange={setIsSpeaking}
              autoPlay={true}
              onNarrationEnd={() => {
                const el = document.getElementById('papan-tulis-virtual');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            />

            {/* 2. Digital Blackboard (Papan Tulis Digital) */}
            <PapanTulisDigital
              ringkasanMateri={currentResult.ringkasan_materi}
              langkahList={currentResult.langkah_papan_tulis}
            />

            {/* 3. Tips Juara Card */}
            <TipsJuaraCard tips={currentResult.tips_juara} />

            {/* 4. Interactive Practice Problem Solver */}
            <SoalLatihanSection
              soalLatihan={currentResult.soal_latihan_serupa}
              ringkasanMateri={currentResult.ringkasan_materi}
            />

            {/* Back to top or ask another question CTA */}
            <div className="text-center pt-2 pb-4">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 font-bold text-xs md:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Bahas Soal PR Lainnya</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t-2 border-amber-200 bg-white py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-semibold">
          <span>Tanya Guru bersama Kak Bintang</span>
          <span>•</span>
          <span>Kurikulum Merdeka SD</span>
          <span>•</span>
          <span>Integrasi Pembayaran Mayar</span>
          <span>•</span>
          <span>Google AI Gemini Powered</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Dirancang untuk mengasah nalar kritis dan kemandirian belajar anak sekolah dasar di Indonesia.
        </p>
      </footer>

      {/* Modals */}
      <MayarTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        currentTokens={tokens}
        onAddTokens={handleAddTokens}
        transactions={transactions}
      />

      <RiwayatBelajarModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      <ParentGuideModal
        isOpen={isParentGuideModalOpen}
        onClose={() => setIsParentGuideModalOpen(false)}
      />
    </div>
  );
}
