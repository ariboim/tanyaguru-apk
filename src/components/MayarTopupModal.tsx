import React, { useState } from 'react';
import { MayarPackage, TokenTransaction } from '../types';
import {
  X,
  Coins,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  Gift,
  CreditCard,
  History,
  Check,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playChimeSound } from '../utils/speech';

interface MayarTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTokens: number;
  onAddTokens: (amount: number, description: string, type: 'mayar_topup' | 'voucher') => void;
  transactions: TokenTransaction[];
}

export const MAYAR_PACKAGES: MayarPackage[] = [
  {
    id: 'pkg-10',
    name: 'Paket Belajar Hemat',
    tokens: 10,
    bonusTokens: 0,
    price: 15000,
    priceFormatted: 'Rp 15.000',
    description: 'Cocok untuk bantuan PR mingguan siswa SD',
  },
  {
    id: 'pkg-30',
    name: 'Paket Juara Kelas',
    tokens: 25,
    bonusTokens: 5,
    price: 35000,
    priceFormatted: 'Rp 35.000',
    badge: 'Paling Populer',
    popular: true,
    description: 'Total 30 Token! Pilihan favorit orang tua & siswa berprestasi',
  },
  {
    id: 'pkg-75',
    name: 'Paket Bintang Semester',
    tokens: 60,
    bonusTokens: 15,
    price: 75000,
    priceFormatted: 'Rp 75.000',
    badge: 'Hemat 40%',
    description: 'Total 75 Token! Pendampingan intensif persiapan ujian & PTS',
  },
];

export const MayarTopupModal: React.FC<MayarTopupModalProps> = ({
  isOpen,
  onClose,
  currentTokens,
  onAddTokens,
  transactions,
}) => {
  const [selectedPkg, setSelectedPkg] = useState<MayarPackage>(MAYAR_PACKAGES[1]);
  const [activeTab, setActiveTab] = useState<'checkout' | 'history'>('checkout');
  const [paymentStep, setPaymentStep] = useState<'select' | 'qris' | 'success'>('select');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherMessage, setVoucherMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleStartPayment = (pkg: MayarPackage) => {
    setSelectedPkg(pkg);
    setPaymentStep('qris');
  };

  const handleCompleteMayarPayment = () => {
    const totalAdded = selectedPkg.tokens + selectedPkg.bonusTokens;
    onAddTokens(
      totalAdded,
      `Top-up Mayar: ${selectedPkg.name} (${selectedPkg.priceFormatted})`,
      'mayar_topup'
    );
    playChimeSound('success');
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
    setPaymentStep('success');
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'BINTANGJUARA') {
      onAddTokens(5, 'Klaim Kode Promo: BINTANGJUARA (+5 Token)', 'voucher');
      setVoucherMessage({ text: 'Selamat! Kamu dapat bonus 5 Token gratis!', isError: false });
      playChimeSound('success');
      confetti({ particleCount: 50, spread: 60 });
      setVoucherCode('');
    } else if (code === 'PRBERES' || code === 'MERDEKA') {
      onAddTokens(3, `Klaim Kode Promo: ${code} (+3 Token)`, 'voucher');
      setVoucherMessage({ text: 'Berhasil! Bonus 3 Token ditambahkan.', isError: false });
      playChimeSound('success');
      setVoucherCode('');
    } else {
      setVoucherMessage({ text: 'Kode voucher tidak valid atau sudah kedaluwarsa.', isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border-2 border-amber-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <span>Isi Ulang Token Belajar</span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Mayar Gateway
                </span>
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Sisa kuota belajarmu: <span className="font-bold underline">{currentTokens} Token</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-amber-50/50 px-4 pt-2">
          <button
            onClick={() => {
              setActiveTab('checkout');
              if (paymentStep === 'success') setPaymentStep('select');
            }}
            className={`pb-2 px-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'checkout'
                ? 'border-amber-500 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Pilih Paket Mayar</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Token ({transactions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'history' ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                Catatan pemakaian 1 token per soal dan bonus top-up akunmu:
              </p>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada transaksi token.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.timestamp).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black text-sm ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Token
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Sisa: {tx.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : paymentStep === 'select' ? (
            <>
              {/* Package cards */}
              <div className="space-y-3">
                {MAYAR_PACKAGES.map((pkg) => {
                  const isSelected = selectedPkg.id === pkg.id;
                  const total = pkg.tokens + pkg.bonusTokens;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                          : 'border-slate-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                          {pkg.badge}
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-1.5">
                            <span>{pkg.name}</span>
                            {pkg.bonusTokens > 0 && (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                +{pkg.bonusTokens} Bonus!
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{pkg.description}</p>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-lg font-black text-amber-600">
                              {pkg.priceFormatted}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              (Dapat {total} Token)
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Input */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <div className="relative flex-1">
                    <Gift className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="Punya Kode Promo? (cth: BINTANGJUARA)"
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-none text-xs font-semibold uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Klaim
                  </button>
                </form>
                {voucherMessage && (
                  <p
                    className={`text-[11px] font-semibold mt-1.5 ${
                      voucherMessage.isError ? 'text-rose-500' : 'text-emerald-600'
                    }`}
                  >
                    {voucherMessage.text}
                  </p>
                )}
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => handleStartPayment(selectedPkg)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm md:text-base shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <span>Lanjut Bayar via Mayar ({selectedPkg.priceFormatted})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : paymentStep === 'qris' ? (
            /* QRIS Mayar payment screen */
            <div className="text-center space-y-4 py-2">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 inline-block">
                <p className="text-xs font-bold text-amber-900">
                  Pembayaran Mayar: {selectedPkg.name}
                </p>
                <p className="text-xl font-black text-amber-700">
                  {selectedPkg.priceFormatted}
                </p>
              </div>

              {/* QRIS Display Container */}
              <div className="p-4 bg-white border-2 border-slate-800 rounded-2xl inline-block shadow-md">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 pb-2 mb-2 border-b border-slate-200">
                  <span>QRIS STANDAR PEMBAYARAN NASIONAL</span>
                  <span className="text-emerald-600">MAYAR INSTAN</span>
                </div>
                {/* SVG QR Code Simulation */}
                <div className="w-48 h-48 mx-auto flex items-center justify-center bg-slate-50 p-2 rounded-lg border border-dashed border-slate-300">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                    <rect width="100" height="100" fill="white" />
                    {/* Corners */}
                    <rect x="10" y="10" width="25" height="25" fill="#1e293b" />
                    <rect x="14" y="14" width="17" height="17" fill="white" />
                    <rect x="17" y="17" width="11" height="11" fill="#1e293b" />

                    <rect x="65" y="10" width="25" height="25" fill="#1e293b" />
                    <rect x="69" y="14" width="17" height="17" fill="white" />
                    <rect x="72" y="17" width="11" height="11" fill="#1e293b" />

                    <rect x="10" y="65" width="25" height="25" fill="#1e293b" />
                    <rect x="14" y="69" width="17" height="17" fill="white" />
                    <rect x="17" y="72" width="11" height="11" fill="#1e293b" />

                    {/* Data modules */}
                    <rect x="40" y="12" width="6" height="6" fill="#1e293b" />
                    <rect x="50" y="15" width="8" height="4" fill="#1e293b" />
                    <rect x="42" y="24" width="12" height="6" fill="#1e293b" />
                    <rect x="12" y="42" width="6" height="12" fill="#1e293b" />
                    <rect x="25" y="45" width="10" height="6" fill="#1e293b" />
                    <rect x="42" y="42" width="16" height="16" fill="#f59e0b" />
                    <circle cx="50" cy="50" r="4" fill="white" />
                    <rect x="65" y="42" width="10" height="8" fill="#1e293b" />
                    <rect x="80" y="52" width="8" height="12" fill="#1e293b" />
                    <rect x="42" y="65" width="8" height="10" fill="#1e293b" />
                    <rect x="55" y="70" width="12" height="8" fill="#1e293b" />
                    <rect x="72" y="72" width="15" height="15" fill="#1e293b" />
                  </svg>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 font-mono">
                  BCA • Mandiri • GoPay • OVO • Dana • ShopeePay
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 font-semibold">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Menunggu konfirmasi pembayaran via Mayar...</span>
              </div>

              {/* Instant Simulator Button */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleCompleteMayarPayment}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Simulasikan Pembayaran Berhasil (Mayar Instant)</span>
                </button>

                <button
                  onClick={() => setPaymentStep('select')}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold underline"
                >
                  Kembali ke pilihan paket
                </button>
              </div>
            </div>
          ) : (
            /* Success confirmation */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Pembayaran Mayar Berhasil!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Token belajarmu telah bertambah. Kak Bintang siap membedah PR berikutnya!
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 inline-block text-left">
                <p className="text-xs text-amber-800 font-semibold">Total Saldo Sekarang:</p>
                <p className="text-2xl font-black text-amber-600">{currentTokens} Token</p>
              </div>

              <div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  Mulai Tanya Soal PR Sekarang
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Transaksi aman dan terenkripsi melalui Mayar Indonesia</span>
        </div>
      </div>
    </div>
  );
};
