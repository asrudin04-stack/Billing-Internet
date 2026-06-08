/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QrCode, CreditCard, Store, Check, Copy, Clock, X, AlertCircle } from 'lucide-react';
import { Invoice } from '../types';

interface IndonesiaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentSuccess: (invoiceId: string, paymentMethod: string) => void;
}

type PaymentCategory = 'qris' | 'va' | 'retail';

export const IndonesiaPaymentModal: React.FC<IndonesiaPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess
}) => {
  const [category, setCategory] = useState<PaymentCategory>('qris');
  const [selectedVA, setSelectedVA] = useState<string>('bca');
  const [copied, setCopied] = useState(false);
  const [pendingActive, setPendingActive] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins for VA/QRIS simulation

  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setPendingActive(false);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(invoice.amount);

  const getVANumber = (bankName: string) => {
    switch (bankName) {
      case 'bca': return '70012' + invoice.id.replace(/\D/g, '').slice(-8);
      case 'mandiri': return '88410' + invoice.id.replace(/\D/g, '').slice(-8);
      case 'bni': return '98800' + invoice.id.replace(/\D/g, '').slice(-8);
      case 'bri': return '12008' + invoice.id.replace(/\D/g, '').slice(-8);
      default: return '888812345678';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = () => {
    setPendingActive(true);
    // Simulate API request delay
    setTimeout(() => {
      setPendingActive(false);
      setSuccess(true);
      setTimeout(() => {
        let finalMethod = 'QRIS';
        if (category === 'va') {
          finalMethod = `${selectedVA.toUpperCase()} Virtual Account`;
        } else if (category === 'retail') {
          finalMethod = 'Gerai Retail';
        }
        onPaymentSuccess(invoice.id, finalMethod);
        onClose();
      }, 1800);
    }, 1500);
  };

  return (
    <div id="payment-modal-backdrop" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div id="payment-modal-card" className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Pembayaran Tagihan Internet
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">ID Tagihan: <span className="font-mono">{invoice.id}</span> • Periode: {invoice.period}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Splash overlay */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/25">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h4 className="text-xl font-bold text-slate-100">Pembayaran Sukses!</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-[280px]">
              Terima kasih, pembayaran sebesar <strong>{formattedAmount}</strong> telah dikonfirmasi secara otomatis.
            </p>
            <p className="text-xs text-emerald-400 mt-4 bg-emerald-500/10 px-3 py-1.5 rounded-full inline-block font-medium">
              Layanan internet Anda segera diaktifkan/diperbarui.
            </p>
          </div>
        ) : pendingActive ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 text-center">
            <div className="relative w-14 h-14 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
            <h4 className="text-lg font-bold text-slate-200">Memverifikasi Pembayaran...</h4>
            <p className="text-xs text-slate-400 mt-1">Sistem sedang memeriksa transaksi Anda di jaringan perbankan.</p>
          </div>
        ) : (
          /* Normal flow */
          <>
            {/* Amount Banner */}
            <div className="px-5 py-4 bg-slate-950/60 flex items-center justify-between border-b border-slate-800/50">
              <span className="text-slate-400 text-sm">Total Pembayaran</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">{formattedAmount}</span>
            </div>

            {/* Methods Selection tab list */}
            <div className="grid grid-cols-3 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setCategory('qris')}
                className={`py-3 px-1 text-center font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
                  category === 'qris'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <QrCode className="w-4 h-4" />
                QRIS (Gopay/OVO/Dana)
              </button>
              <button
                type="button"
                onClick={() => setCategory('va')}
                className={`py-3 px-1 text-center font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
                  category === 'va'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Virtual Account
              </button>
              <button
                type="button"
                onClick={() => setCategory('retail')}
                className={`py-3 px-1 text-center font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
                  category === 'retail'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Store className="w-4 h-4" />
                Alfamart / Indomaret
              </button>
            </div>

            {/* Content box */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* Timeout clock */}
              <div className="flex items-center justify-between text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg p-2.5 mb-4">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Selesaikan pembayaran dalam waktu:
                </div>
                <span className="font-mono font-bold text-xs">{formatTime(timeLeft)}</span>
              </div>

              {/* CATEGORY 1: QRIS */}
              {category === 'qris' && (
                <div className="flex flex-col items-center py-2">
                  <p className="text-xs text-slate-400 text-center mb-4">
                    Pindai kode QRIS di bawah ini menggunakan aplikasi dompet digital Anda (GoPay, OVO, Dana, LinkAja, BCA Mobile, dll).
                  </p>

                  {/* QRIS Container */}
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center relative gap-1.5 max-w-[210px] w-full">
                    <span className="text-[10px] font-bold text-slate-800 border-b border-slate-200 w-full text-center pb-0.5 tracking-wider font-sans">ANET COOP</span>
                    
                    {/* Mock QR Representation */}
                    <div className="w-[160px] h-[160px] bg-slate-100 rounded border border-slate-200 flex flex-col items-center justify-center relative p-1.5">
                      {/* Grid Pattern Simulating complex QR code */}
                      <div className="grid grid-cols-4 gap-1 w-full h-full opacity-90 p-1 bg-white">
                        <div className="bg-slate-900 rounded-sm"></div>
                        <div className="bg-slate-900 rounded-sm border-r border-b border-white"></div>
                        <div className="bg-slate-400 rounded-sm"></div>
                        <div className="bg-slate-900 rounded-sm"></div>
                        
                        <div className="bg-slate-300 rounded-sm"></div>
                        <div className="bg-slate-700 rounded-sm"></div>
                        <div className="bg-slate-900 rounded-sm"></div>
                        <div className="bg-slate-500 rounded-sm"></div>

                        <div className="bg-slate-900 rounded-sm"></div>
                        <div className="bg-slate-400 rounded-sm"></div>
                        <div className="bg-slate-900 rounded-sm"></div>
                        <div className="bg-slate-950 rounded-sm"></div>

                        <div className="bg-slate-900 rounded-sm"></div>
                        <div className="bg-slate-500 rounded-sm"></div>
                        <div className="bg-slate-300 rounded-sm"></div>
                        <div className="bg-slate-900 rounded-sm"></div>
                      </div>
                      {/* Center floating icon logos styled dynamically */}
                      <div className="absolute inset-0 m-auto w-10 h-10 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-[10px] font-extrabold text-[#2563eb] font-sans">QRIS</span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center justify-center mt-1 border-t border-slate-100 pt-1.5 w-full">
                      <span className="text-[9px] font-sans font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">GPN NETWORK</span>
                    </div>
                  </div>

                  <div className="mt-5 w-full text-xs text-slate-500 space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 font-sans">
                    <p className="font-semibold text-slate-300 mb-1">💡 Langkah Membayar:</p>
                    <p>1. Simpan atau Screenshot tampilan kode QR di atas.</p>
                    <p>2. Buka aplikasi e-Wallet atau m-Banking Anda, pilih menu "Transfer" / "Bayar / QRIS".</p>
                    <p>3. Unggah file screenshot QR atau hadapkan kamera HP Anda ke QR.</p>
                    <p>4. Verifikasi nominal tagihan lalu bayar.</p>
                  </div>
                </div>
              )}

              {/* CATEGORY 2: VIRTUAL ACCOUNT */}
              {category === 'va' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Pilih Bank Penerima</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'bca', name: 'BCA VA', color: 'border-blue-600 bg-blue-500/5' },
                        { id: 'mandiri', name: 'MANDIRI', color: 'border-yellow-600 bg-yellow-500/5' },
                        { id: 'bni', name: 'BNI VA', color: 'border-orange-600 bg-orange-500/5' },
                        { id: 'bri', name: 'BRI VA', color: 'border-blue-500 bg-blue-400/5' }
                      ].map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedVA(bank.id)}
                          className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center ${
                            selectedVA === bank.id
                              ? `${bank.color} border-2 text-white shadow-md shadow-emerald-500/5`
                              : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300 bg-slate-900/40'
                          }`}
                        >
                          {bank.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VA Credentials Code display row */}
                  <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl relative">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Nomor Virtual Account {selectedVA.toUpperCase()}
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-mono font-bold text-slate-200 tracking-wider">
                        {getVANumber(selectedVA)}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(getVANumber(selectedVA))}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium py-1 px-2.5 rounded transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 text-xs text-slate-400 space-y-1.5">
                    <p className="font-semibold text-slate-300">💡 Instruksi Transfer Mandiri & Swasta:</p>
                    <p>• Masuk ke Mobile Banking / ATM Anda.</p>
                    <p>• Pilih menu <strong className="text-slate-300">Transfer &gt; Virtual Account</strong> (atau Bayar Tagihan).</p>
                    <p>• Masukkan kode Virtual Account di atas.</p>
                    <p>• Layanan akan memverifikasi otomatis dalam 10 detik tanpa perlu kirim struk bukti transfer.</p>
                  </div>
                </div>
              )}

              {/* CATEGORY 3: RETAIL STORE */}
              {category === 'retail' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl relative">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      Kode Pembayaran Retail (Alfamart / Indomaret)
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-mono font-bold text-emerald-400 tracking-wider">
                        NET-{invoice.id.replace(/\D/g, '').slice(-6)}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('NET-' + invoice.id.replace(/\D/g, '').slice(-6))}
                        className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium py-1 px-2.5 rounded transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/40 text-xs text-slate-400 space-y-2">
                    <p className="font-semibold text-slate-300">🏪 Tata Cara Pembayaran di Kasir:</p>
                    <p>1. Datangi gerai Alfamart, Indomaret, atau Lawson terdekat.</p>
                    <p>2. Beritahukan kepada kasir bahwa Anda ingin membayar <strong className="text-slate-200">"Pembayaran ANet ISP"</strong> atau <strong className="text-slate-200">"Telkom/Internet Lainnya"</strong>.</p>
                    <p>3. Tunjukkan Kode Pembayaran di atas.</p>
                    <p>4. Bayar sesuai nominal kepada kasir. Simpan struk fisik pembayaran sebagai jaminan.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/20 text-[10px] text-slate-500 mt-4 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  Sistem billing ANet berbasis Real-Time Sync. IP internet Anda akan otomatis mendapatkan pembaruan status bandwidth dan auto-unblock sesaat setelah gateway mencatat status pembayaran Anda valid.
                </span>
              </div>

            </div>

            {/* Simulated Action Bottom Bar */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg shadow-md hover:shadow-emerald-500/10 transition-all flex items-center gap-1.5"
              >
                Simulasi Bayar Sekarang
                <Check className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
