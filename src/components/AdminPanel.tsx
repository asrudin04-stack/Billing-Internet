/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  LifeBuoy, 
  TrendingUp, 
  Cpu, 
  Plus, 
  Check, 
  Search, 
  Trash2, 
  AlertCircle, 
  Ban, 
  ArrowUpCircle, 
  MessageSquare,
  Activity,
  UserCheck
} from 'lucide-react';
import { Customer, Invoice, Ticket, SpeedPlan, CustomerStatus } from '../types';

interface AdminPanelProps {
  customers: Customer[];
  plans: SpeedPlan[];
  invoices: Invoice[];
  tickets: Ticket[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>) => void;
  onUpdateCustomerStatus: (id: string, status: CustomerStatus) => void;
  onUpdateCustomerPlan: (id: string, planId: string) => void;
  onDeleteCustomer: (id: string) => void;
  onNewInvoice: (invoiceData: Omit<Invoice, 'id' | 'status' | 'createdAt'>) => void;
  onApproveInvoiceManual: (invoiceId: string) => void;
  onSendTicketReply: (ticketId: string, replyMessage: string) => void;
  onUpdateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  customers,
  plans,
  invoices,
  tickets,
  onAddCustomer,
  onUpdateCustomerStatus,
  onUpdateCustomerPlan,
  onDeleteCustomer,
  onNewInvoice,
  onApproveInvoiceManual,
  onSendTicketReply,
  onUpdateTicketStatus
}) => {
  // Tabs: 'customers' | 'billing' | 'tickets'
  const [activeTab, setActiveTab] = useState<'customers' | 'billing' | 'tickets'>('customers');
  
  // Search inputs
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Register form state
  const [showAddCustForm, setShowAddCustForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPlanId, setNewPlanId] = useState(plans[0]?.id || '');
  const [newPPPoE, setNewPPPoE] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-07-01');

  // Manual invoice form state
  const [showAddInvoiceForm, setShowAddInvoiceForm] = useState(false);
  const [invCustomerId, setInvCustomerId] = useState('');
  const [invPeriod, setInvPeriod] = useState('Juni 2026');
  const [invAmount, setInvAmount] = useState(360000);

  // Tickets support chat active frame state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Math calculated KPI Stats
  const activeCustomers = customers.filter(c => c.status === 'active');
  const suspendedCustomers = customers.filter(c => c.status === 'suspended');
  
  // Calculate MRR (Monthly Recurring Revenue) based on active plans
  const totalMRR = activeCustomers.reduce((acc, cust) => {
    const plan = plans.find(p => p.id === cust.activePlanId);
    return acc + (plan ? plan.price : 0);
  }, 0);

  // Live total bandwidth managed in pool
  const totalBandwidth = activeCustomers.reduce((acc, cust) => {
    const plan = plans.find(p => p.id === cust.activePlanId);
    return acc + (plan ? plan.speedMbps : 0);
  }, 0);

  const pendingInvoiceCount = invoices.filter(i => i.status !== 'paid').length;
  const openTicketCount = tickets.filter(t => t.status !== 'resolved').length;

  // Filtered queries
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.pppoeUsername.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i => 
    i.customerName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    i.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    i.period.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim() || !newPPPoE.trim()) return;
    
    onAddCustomer({
      name: newName,
      email: newEmail,
      phone: newPhone,
      address: newAddress,
      activePlanId: newPlanId,
      pppoeUsername: newPPPoE,
      dueDate: newDueDate
    });

    // Reset Form
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewAddress('');
    setNewPPPoE('');
    setShowAddCustForm(false);
  };

  const handleManualInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerId) return;
    const currentCust = customers.find(c => c.id === invCustomerId);
    if (!currentCust) return;

    onNewInvoice({
      customerId: invCustomerId,
      customerName: currentCust.name,
      planName: plans.find(p => p.id === currentCust.activePlanId)?.name || 'NusaNet Speed Plan',
      amount: Number(invAmount),
      period: invPeriod
    });

    setShowAddInvoiceForm(false);
  };

  const handleSendTicketReplySubmit = (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onSendTicketReply(ticketId, replyInput);
    setReplyInput('');
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* KPI TOP METRIC ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">MRR Est. Aktif</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">{formatIDR(totalMRR)}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Pendapatan bulanan berulang</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Total Pelanggan</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">
              {customers.length} <span className="text-xs font-normal text-slate-400">({activeCustomers.length} Aktif)</span>
            </span>
            <span className="text-[10px] text-amber-400 block mt-0.5">{suspendedCustomers.length} Isolir/Suspended</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Alokasi Bandwidth</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">{totalBandwidth} Mbps</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Pool Fiber Gateway Core-01</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Pemberitahuan</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">{openTicketCount} Antrean</span>
            <span className="text-[10px] text-amber-400 block mt-0.5">{pendingInvoiceCount} Tagihan Belum Dibayar</span>
          </div>
        </div>

      </div>

      {/* ADMIN SUB-TABS SELECTOR RULER */}
      <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-2 w-max shadow-sm">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'customers'
              ? 'bg-emerald-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Data Pelanggan
        </button>
        <button
          onClick={() => {
            setActiveTab('billing');
            // Select first customer as default for billing generator
            if (customers.length > 0 && !invCustomerId) {
              setInvCustomerId(customers[0].id);
            }
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'billing'
              ? 'bg-emerald-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Billing & Invoice
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'bg-emerald-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Pusat Kendala / Tiket Support
          {openTicketCount > 0 && (
            <span className="bg-rose-500 text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
              {openTicketCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB SUBSECTIONS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            
            {/* Search customer box */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, email, pppoe user..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 pl-9 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-sans"
              />
            </div>

            {/* Trigger register plan */}
            <button
              onClick={() => setShowAddCustForm(!showAddCustForm)}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tambah Pelanggan Baru
            </button>
          </div>

          {/* Form Create Customer */}
          {showAddCustForm && (
            <form onSubmit={handleRegisterCustomer} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-2xl animate-fade-in relative shadow-lg">
              <button 
                type="button" 
                onClick={() => setShowAddCustForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Batal [x]
              </button>
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Form Registrasi Pelanggan Baru</h4>
                <p className="text-xs text-slate-400 mt-0.5">Isi semua kolom untuk mendaftarkan dan mematangkan username PPPoE pelanggan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ahmad Subardjo"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">E-mail Pelanggan</label>
                  <input
                    type="email"
                    placeholder="Contoh: subardjo@gmail.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Nomor WhatsApp/Phone</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812345678"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Username PPPoE (Secret)</label>
                  <input
                    type="text"
                    placeholder="Contoh: subardjo_lite@nusanet"
                    value={newPPPoE}
                    onChange={e => setNewPPPoE(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Paket Layanan</label>
                  <select
                    value={newPlanId}
                    onChange={e => setNewPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ({p.speedMbps} Mbps, {formatIDR(p.price)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Jatuh Tempo Pembayaran Pertama</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Alamat Instalasi Lengkap</label>
                <textarea
                  placeholder="Detail nama perumahan, komplek, nomor rumah, RT/RW, dan kecamatan..."
                  rows={2}
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-all"
                >
                  Daftarkan Pelanggan (Activate IP)
                </button>
              </div>
            </form>
          )}

          {/* Customer Table */}
          <div id="customer-list-pane" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-4">Nama & PPPoE</th>
                    <th className="py-3 px-4">Kontak & Alamat</th>
                    <th className="py-3 px-4">Paket Internet</th>
                    <th className="py-3 px-4">Alamat IP</th>
                    <th className="py-3 px-4">Masa Aktif</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi / Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/85">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                        Tidak ada pelanggan yang cocok dengan kata pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(cust => {
                      const plan = plans.find(p => p.id === cust.activePlanId);
                      return (
                        <tr key={cust.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-100 block">{cust.name}</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-semibold">{cust.pppoeUsername}</span>
                          </td>
                          <td className="py-3 px-4 max-w-[180px]">
                            <span className="block text-slate-300">{cust.phone}</span>
                            <span className="text-[10px] text-slate-500 divide-y overflow-ellipsis overflow-hidden whitespace-nowrap block" title={cust.address}>{cust.address}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold block text-slate-200">{plan ? plan.name : 'Unknown Plan'}</span>
                            <span className="font-mono text-[10px] text-slate-400">{plan ? `${plan.speedMbps} Mbps` : ''} ({formatIDR(plan ? plan.price : 0)})</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {cust.ipAddress}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 select-none">
                            {cust.dueDate}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              cust.status === 'active'
                                ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                                : cust.status === 'suspended'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                                : 'bg-slate-600/10 text-slate-500 border border-slate-600/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cust.status === 'active' ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                              {cust.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 justify-center">
                              {/* Suspend or Reactivate button */}
                              {cust.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => onUpdateCustomerStatus(cust.id, 'suspended')}
                                  className="p-1 text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/25 transition-all"
                                  title="Isolir Jaringan / Suspend"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onUpdateCustomerStatus(cust.id, 'active')}
                                  className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded border border-transparent hover:border-emerald-500/25 transition-all"
                                  title="Aktifkan Kembali Jaringan"
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Upgrade speed selector */}
                              <select
                                value={cust.activePlanId}
                                onChange={e => onUpdateCustomerPlan(cust.id, e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded p-1"
                                title="Migrasi Kecepatan"
                              >
                                {plans.map(p => (
                                  <option key={p.id} value={p.id}>{p.speedMbps} Mb</option>
                                ))}
                              </select>

                              {/* Delete Client */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus pelanggan ${cust.name}? Data internet dan billing akan dibersihkan.`)) {
                                    onDeleteCustomer(cust.id);
                                  }
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-all"
                                title="Hapus Pelanggan Permanen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-4">
          
          {/* Billing Controls Row */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari ID tagihan, nama pelanggan..."
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 pl-9 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-sans"
              />
            </div>

            <button
              onClick={() => setShowAddInvoiceForm(!showAddInvoiceForm)}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Terbitkan Invoice Tagihan Baru
            </button>
          </div>

          {/* Form Manually Issue Invoice */}
          {showAddInvoiceForm && (
            <form onSubmit={handleManualInvoiceSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-lg animate-fade-in relative shadow-lg">
              <button 
                type="button" 
                onClick={() => setShowAddInvoiceForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Batal [x]
              </button>
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Terbitkan Invoice Pembayaran Internet</h4>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">Gunakan form ini untuk membuat invoice tertunda di sistem billing NusaNet.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Pilih Pelanggan Penerima</label>
                  <select
                    value={invCustomerId}
                    onChange={e => {
                      setInvCustomerId(e.target.value);
                      const currentCust = customers.find(c => c.id === e.target.value);
                      if (currentCust) {
                        const plan = plans.find(p => p.id === currentCust.activePlanId);
                        if (plan) setInvAmount(plan.price);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({plans.find(p => p.id === c.activePlanId)?.name})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Periode Tagihan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Juli 2026"
                      value={invPeriod}
                      onChange={e => setInvPeriod(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-sans"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Nominal Tagihan (IDR)</label>
                    <input
                      type="number"
                      value={invAmount}
                      onChange={e => setInvAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1 border-t border-slate-800/80">
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-all"
                >
                  Terbitkan Invoice Tagihan (Notify Client)
                </button>
              </div>
            </form>
          )}

          {/* Invoices List Panel Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-4">No. Invoice & Periode</th>
                    <th className="py-3 px-4">Nama Pelanggan</th>
                    <th className="py-3 px-4">Paket Rujukan</th>
                    <th className="py-3 px-4">Nominal Tagihan</th>
                    <th className="py-3 px-4">Tanggal Penerbitan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/85">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold font-sans">
                        Tidak ada riwayat invoice billing terekam di database.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold block text-slate-100">{inv.id}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{inv.period}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {inv.customerName}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {inv.planName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {formatIDR(inv.amount)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {inv.createdAt}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/25'
                              : inv.status === 'overdue'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          }`}>
                            {inv.status === 'paid' ? 'LUNAS / PAID' : inv.status === 'overdue' ? 'TELAT / OVERDUE' : 'BELUM BAYAR'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {inv.status !== 'paid' ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Simulasi Manual-Approve? Tagihan sebesar ${formatIDR(inv.amount)} untuk ${inv.customerName} akan ditandai LUNAS secara paksa.`)) {
                                  onApproveInvoiceManual(inv.id);
                                }
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 border border-slate-700/80 rounded font-bold text-[10px] transition-all text-slate-300"
                            >
                              Konfirmasi Lunas Manual
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono font-semibold block">Verified: {inv.paidAt?.split(' ')[1]}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[400px]">
          
          {/* Left panel: Ticket list */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Antrean Tiket Gangguan</h3>
            
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {tickets.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 font-medium">Tidak ada keluhan aktif. Semua koneksi hijau!</div>
              ) : (
                tickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedTicketId === t.id
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-inner'
                        : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono font-black text-slate-500">{t.id}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                        t.status === 'open'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : t.status === 'progress'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mt-1 pl-0.5 truncate">{t.title}</h4>
                    <p className="text-[10px] text-slate-400 pl-0.5 mt-0.5">{t.customerName}</p>
                    
                    <div className="flex justify-between items-center text-[9px] text-slate-500 mt-2 border-t border-slate-800 pt-1.5">
                      <span>Kat: {t.category}</span>
                      <span className="font-mono">{t.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Active chat thread conversation frame */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {selectedTicketId ? (
              (() => {
                const activeTicket = tickets.find(t => t.id === selectedTicketId);
                if (!activeTicket) return null;
                const client = customers.find(c => c.id === activeTicket.customerId);

                return (
                  <div className="flex flex-col flex-1">
                    
                    {/* Header bar of conversation */}
                    <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black font-mono text-slate-500">{activeTicket.id}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                            activeTicket.status === 'open' 
                              ? 'bg-amber-500/10 text-amber-500' 
                              : activeTicket.status === 'progress'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {activeTicket.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{activeTicket.title}</h4>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                          Pelanggan: <strong className="text-slate-300">{activeTicket.customerName}</strong> 
                          {client ? ` (PPPoE: ${client.pppoeUsername} • IP: ${client.ipAddress})` : ''}
                        </p>
                      </div>

                      {/* Ticket controls */}
                      <div className="flex gap-1.5">
                        {activeTicket.status !== 'progress' && activeTicket.status !== 'resolved' && (
                          <button
                            onClick={() => onUpdateTicketStatus(activeTicket.id, 'progress')}
                            className="text-[10px] font-bold bg-blue-500/10 border border-blue-500/25 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/15"
                          >
                            Tandai Diproses
                          </button>
                        )}
                        {activeTicket.status !== 'resolved' && (
                          <button
                            onClick={() => onUpdateTicketStatus(activeTicket.id, 'resolved')}
                            className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/15"
                          >
                            Selesaikan & Tutup
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scrollable conversation log */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[300px]">
                      {activeTicket.messages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[85%] ${
                            msg.sender === 'admin' ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5 select-none">
                            <span className="text-[9px] font-bold text-slate-400">{msg.senderName}</span>
                            <span className="text-[8px] font-mono text-slate-500">{msg.timestamp}</span>
                          </div>
                          <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                            msg.sender === 'admin'
                              ? 'bg-emerald-400 text-slate-950 font-medium rounded-tr-none'
                              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input row */}
                    {activeTicket.status !== 'resolved' ? (
                      <form onSubmit={(e) => handleSendTicketReplySubmit(e, activeTicket.id)} className="p-3 border-t border-slate-800 bg-slate-950/20 flex gap-2">
                        <input
                          type="text"
                          placeholder="Tuliskan umpan balik bantuan teknik atau jadwal visit teknisi..."
                          value={replyInput}
                          onChange={e => setReplyInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-lg focus:outline-none focus:border-slate-700 font-sans"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          Balas
                          <PaperPlaneIcon />
                        </button>
                      </form>
                    ) : (
                      <div className="text-center text-xs text-slate-500 py-3 bg-slate-950/40 border-t border-slate-800 font-medium">
                        🔒 Keluhan selesai. Thread percakapan telah ditutup secara administratif.
                      </div>
                    )}

                  </div>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 select-none">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-full mb-3 text-slate-400">
                  <Activity className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">NOC Communication Terminal</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">Pilih tiket gangguan di kolom kiri untuk mulai mentelaah kendala jaringan dan chat dengan customer.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

// Internal mini-icon SVG helper to bypass heavy export checks
const PaperPlaneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
