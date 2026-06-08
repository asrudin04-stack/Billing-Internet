/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  Clock, 
  LifeBuoy, 
  User, 
  MapPin, 
  Smartphone, 
  Send, 
  PlusCircle, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  CreditCard 
} from 'lucide-react';
import { Customer, Invoice, Ticket, SpeedPlan, UsagePoint } from '../types';
import { generateLiveTraffic } from '../data/mockData';
import { CustomChart } from './CustomChart';
import { IndonesiaPaymentModal } from './IndonesiaPaymentModal';

interface CustomerPortalProps {
  customer: Customer;
  plans: SpeedPlan[];
  invoices: Invoice[];
  tickets: Ticket[];
  onAddTicket: (title: string, category: Ticket['category'], text: string) => void;
  onPayInvoice: (invoiceId: string, method: string) => void;
  onSendTicketMessage: (ticketId: string, message: string, sender: 'client') => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  plans,
  invoices,
  tickets,
  onAddTicket,
  onPayInvoice,
  onSendTicketMessage
}) => {
  const currentPlan = plans.find(p => p.id === customer.activePlanId) || plans[0];
  const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
  const unpaidInvoices = customerInvoices.filter(inv => inv.status !== 'paid');
  const paidInvoices = customerInvoices.filter(inv => inv.status === 'paid');
  const customerTickets = tickets.filter(t => t.customerId === customer.id);

  // Live traffic state
  const [traffic, setTraffic] = useState<UsagePoint[]>([]);
  // Selected invoice for payment modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // New ticket state
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<Ticket['category']>('Lambat');
  const [newTicketText, setNewTicketText] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // Message chat state per ticket
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  // Update live traffic representation every 3.5 seconds
  useEffect(() => {
    // Generate initial points
    setTraffic(generateLiveTraffic(currentPlan.speedMbps, currentPlan.speedMbps * 0.5));
    
    const interval = setInterval(() => {
      setTraffic(prev => {
        const nextTime = new Date();
        const timeStr = `${String(nextTime.getHours()).padStart(2, '0')}:${String(nextTime.getMinutes()).padStart(2, '0')}:${String(nextTime.getSeconds()).padStart(2, '0')}`;
        const download = Math.max(0.2, Number((currentPlan.speedMbps * (0.35 + Math.random() * 0.6)).toFixed(1)));
        const upload = Math.max(0.1, Number(((currentPlan.speedMbps * 0.5) * (0.2 + Math.random() * 0.7)).toFixed(1)));
        
        const updated = [...prev.slice(1), { time: timeStr, download, upload }];
        return updated;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [customer.activePlanId, currentPlan]);

  const handlePayTrigger = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentModalOpen(true);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketText.trim()) return;
    onAddTicket(newTicketTitle, newTicketCategory, newTicketText);
    setNewTicketTitle('');
    setNewTicketText('');
    setShowNewTicketForm(false);
  };

  const handleSendChat = (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendTicketMessage(ticketId, chatInput, 'client');
    setChatInput('');
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      
      {/* Suspension Alert banner if customer is suspended */}
      {customer.status === 'suspended' && (
        <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex items-start gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold">Layanan Internet Ditangguhkan (Suspended)</h4>
            <p className="text-xs text-red-300 mt-1">
              Sistem mendeteksi masa aktif paket Anda telah habis dan tagihan jatuh tempo belum diselesaikan. Harap melunasi tagihan aktif di bawah ini untuk mengaktifkan kembali koneksi ANet Anda secara instan.
            </p>
          </div>
        </div>
      )}

      {/* Customer Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Profile Card */}
        <div id="customer-profile-card" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Pelanggan Aktif</span>
            <h3 className="text-base font-bold text-slate-200 mt-1">{customer.name}</h3>
            <div className="space-y-1 mt-3 text-xs text-slate-400">
              <p className="flex items-center gap-1.5 pt-0.5"><Smartphone className="w-3.5 h-3.5 text-slate-500" /> {customer.phone}</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {customer.address}</p>
            </div>
          </div>
        </div>

        {/* Plan Specs Card */}
        <div id="package-detail-card" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Paket Internet</span>
              <h3 className="text-base font-bold text-emerald-400 mt-1">{currentPlan.name}</h3>
            </div>
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
              FTTH {currentPlan.type}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 border-t border-slate-800/80 pt-3">
            <div>
              <span className="text-[10px] text-slate-500 block">Bandwidth</span>
              <span className="text-base font-bold text-slate-200">{currentPlan.speedMbps} Mbps</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Rasio Kecepatan</span>
              <span className="text-sm font-semibold text-slate-300">Symmetric {currentPlan.ratio}</span>
            </div>
          </div>
        </div>

        {/* IP Specs and credentials card */}
        <div id="connection-status-card" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Status Jaringan</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400 font-mono">PPPoE Session</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${customer.status === 'active' ? 'text-emerald-400' : 'text-rose-500'}`}>
              <span className={`w-2 h-2 rounded-full ${customer.status === 'active' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
              {customer.status === 'active' ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Alamat IP:</span>
              <span className="font-mono text-slate-200">{customer.ipAddress}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Jatuh Tempo:</span>
              <span className="font-mono text-slate-200 font-medium">{customer.dueDate}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Traffic Usage Visualizer */}
      {customer.status === 'active' && (
        <CustomChart 
          data={traffic} 
          downloadMax={currentPlan.speedMbps} 
          uploadMax={currentPlan.speedMbps * 0.5} 
        />
      )}

      {/* Invoices and Tickets columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BILLING & INVOICES TAB */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Informasi Tagihan & Histori
            </h3>
            {unpaidInvoices.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Ada {unpaidInvoices.length} Tagihan Aktif
              </span>
            )}
          </div>

          {/* Unpaid Section */}
          <div className="space-y-3">
            {unpaidInvoices.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl text-center text-xs text-slate-500 font-sans">
                🟢 Semua tagihan Anda telah terbayar lunas. Terima kasih atas kerja sama Anda!
              </div>
            ) : (
              unpaidInvoices.map(inv => (
                <div key={inv.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 h-full w-1 bg-amber-500"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{inv.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.3 rounded ${
                        inv.status === 'overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                      }`}>
                        {inv.status === 'overdue' ? 'Jatuh Tempo' : 'Menunggu Pembayaran'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Sewa Bulanan Paket - Periode {inv.period}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tanggal Invoice: {inv.createdAt}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-amber-400 font-mono">{formatIDR(inv.amount)}</span>
                    <button
                      type="button"
                      onClick={() => handlePayTrigger(inv)}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      Bayar Sekarang
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paid History Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Riwayat Pembayaran Terakhir</h4>
            {paidInvoices.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Belum ada riwayat pembayaran terekam.</p>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[220px] overflow-y-auto pr-1">
                {paidInvoices.map(inv => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-400">{inv.id}</span>
                        <span className="text-[9px] px-1 bg-emerald-400/10 text-emerald-400 rounded">Paid</span>
                      </div>
                      <span className="text-slate-500 text-[11px] block mt-0.5">{inv.period} • {inv.paymentMethod}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-slate-300 block">{formatIDR(inv.amount)}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Lunas: {inv.paidAt?.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* SUPPORT TICKETS TAB */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              Layanan Bantuan & Tiket
            </h3>
            <button
              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Ajukan Tiket Baru
            </button>
          </div>

          {/* New Ticket Overlay/Card Form */}
          {showNewTicketForm && (
            <form onSubmit={handleCreateTicketSubmit} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 animate-fade-in relative">
              <button 
                type="button" 
                onClick={() => setShowNewTicketForm(false)}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 text-xs"
              >
                Batal
              </button>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Membuat Tiket Baru</h4>
              
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Masalah / Perihal</label>
                <input
                  type="text"
                  placeholder="Contoh: Lampu LOS router merah / Speed Drop"
                  value={newTicketTitle}
                  onChange={e => setNewTicketTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Kategori Kendala</label>
                  <select
                    value={newTicketCategory}
                    onChange={e => setNewTicketCategory(e.target.value as Ticket['category'])}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="Lambat">Koneksi Lambat</option>
                    <option value="Putus">Koneksi Mati/Putus-Putus</option>
                    <option value="Tagihan">Pertanyaan Tagihan</option>
                    <option value="Lainnya">Lain-lain</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-1"
                  >
                    Kirim Tiket
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Detail Kronologis Masalah</label>
                <textarea
                  placeholder="Tuliskan kendala Anda, nomor indikasi LOS, atau sejak kapan masalah ini muncul..."
                  rows={3}
                  value={newTicketText}
                  onChange={e => setNewTicketText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  required
                ></textarea>
              </div>
            </form>
          )}

          {/* List of active tickers */}
          <div className="space-y-3">
            {customerTickets.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-xl text-center text-xs text-slate-500 font-sans">
                Tidak ada tiket bantuan yang aktif. Anda bisa mengajukan tiket baru jika mengalami gangguan internet.
              </div>
            ) : (
              customerTickets.map(ticket => (
                <div key={ticket.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  {/* Ticket Summary Row */}
                  <div 
                    onClick={() => setActiveTicketId(activeTicketId === ticket.id ? null : ticket.id)}
                    className="p-3.5 cursor-pointer hover:bg-slate-800/40 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 font-bold">{ticket.id}</span>
                        <span className={`text-[9px] font-semibold px-2 rounded-full ${
                          ticket.status === 'open' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : ticket.status === 'progress' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {ticket.status === 'open' ? 'Terbuka' : ticket.status === 'progress' ? 'Dikerjakan' : 'Selesai'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-1">{ticket.title}</h4>
                      <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5 font-sans">
                        <span>Kategori: {ticket.category}</span>
                        <span>•</span>
                        <span>{ticket.createdAt}</span>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold font-mono">
                      {activeTicketId === ticket.id ? 'Tutup Chat ▲' : 'Buka Chat ▼'}
                    </span>
                  </div>

                  {/* Message Detail Segment */}
                  {activeTicketId === ticket.id && (
                    <div className="border-t border-slate-800 bg-slate-950/60 p-4 space-y-4 font-sans">
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {ticket.messages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] ${
                              msg.sender === 'client' ? 'ml-auto items-end' : 'mr-auto items-start'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] font-bold text-slate-400">{msg.senderName}</span>
                              <span className="text-[8px] font-mono text-slate-500">{msg.timestamp.split(' ')[1]}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                              msg.sender === 'client' 
                                ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none' 
                                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Msg Input form */}
                      {ticket.status !== 'resolved' ? (
                        <form onSubmit={(e) => handleSendChat(e, ticket.id)} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ketik balasan Anda ke teknisi helpdesk..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                            required
                          />
                          <button
                            type="submit"
                            className="px-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <div className="text-center text-[11px] text-slate-500 py-1 border-t border-slate-800 mt-2">
                          🔒 Tiket ini telah ditutup oleh ANet Support.
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Pop payment overlay */}
      {selectedInvoice && (
        <IndonesiaPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onPaymentSuccess={onPayInvoice}
        />
      )}

    </div>
  );
};
