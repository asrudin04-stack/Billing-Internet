/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
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
  UserCheck,
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Customer, Invoice, Ticket, SpeedPlan, CustomerStatus } from '../types';

interface AdminPanelProps {
  customers: Customer[];
  plans: SpeedPlan[];
  invoices: Invoice[];
  tickets: Ticket[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>) => void;
  onImportCustomers: (customersList: Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>[]) => void;
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
  onImportCustomers,
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

  // Customer Import system states
  const [showImportForm, setShowImportForm] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- SYSTEM CUSTOMER BIG-DATA IMPORT HANDLERS ---
  const processImportText = (text: string, format: 'csv' | 'json') => {
    if (!text.trim()) {
      setImportPreview([]);
      setImportError(null);
      return;
    }
    try {
      if (format === 'json') {
        const parsed = JSON.parse(text);
        const dataArr = Array.isArray(parsed) ? parsed : [parsed];
        
        const validated: Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>[] = [];
        for (let i = 0; i < dataArr.length; i++) {
          const item = dataArr[i];
          if (!item.name || !item.email || !item.phone) {
            throw new Error(`Data pada baris/index ke-${i + 1} tidak lengkap. Kolom 'name', 'email', dan 'phone' wajib ada.`);
          }
          validated.push({
            name: String(item.name).trim(),
            email: String(item.email).trim(),
            phone: String(item.phone).trim(),
            address: String(item.address || '').trim(),
            activePlanId: String(item.activePlanId || plans[0]?.id || 'plan-lite').trim(),
            pppoeUsername: String(item.pppoeUsername || `${String(item.name).toLowerCase().replace(/[^a-z0-9]/g, '').split(' ')[0] || 'pppoe'}_user@anet`).trim(),
            dueDate: String(item.dueDate || '2026-07-01').trim()
          });
        }
        setImportPreview(validated);
        setImportError(null);
      } else {
        // CSV Parsing
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          throw new Error('CSV mendeteksi data kosong atau tidak ada header kolom.');
        }
        
        // Parse headers: support multi languages/variants
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const idxName = headers.findIndex(h => h.includes('name') || h === 'nama' || h.includes('lengkap'));
        const idxEmail = headers.findIndex(h => h.includes('email') || h === 'surel' || h.includes('mail'));
        const idxPhone = headers.findIndex(h => h.includes('phone') || h.includes('telp') || h.includes('wa') || h.includes('hp'));
        const idxAddress = headers.findIndex(h => h.includes('address') || h === 'alamat' || h.includes('lokasi'));
        const idxPlan = headers.findIndex(h => h.includes('plan') || h === 'paket' || h.includes('speed') || h.includes('package'));
        const idxPPPoE = headers.findIndex(h => h.includes('pppoe') || h.includes('username') || h.includes('user'));
        const idxDueDate = headers.findIndex(h => h.includes('due') || h.includes('tempo') || h.includes('tgl') || h.includes('date'));

        if (idxName === -1 || idxEmail === -1 || idxPhone === -1) {
          throw new Error('Format Header CSV salah. Wajib mencakup minimal kolom: name, email, phone (Bisa dipisahkan dengan koma).');
        }

        const validated: Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          // Simple split. In case of complex commas, we trim and split
          const row = lines[i].split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
          if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

          const name = row[idxName] || '';
          const email = row[idxEmail] || '';
          const phone = row[idxPhone] || '';
          
          if (!name || !email || !phone) {
            throw new Error(`Data baris ke-${i + 1} tidak lengkap. Pastikan kolom nama, email, dan phone terisi.`);
          }

          const address = idxAddress !== -1 ? row[idxAddress] || '' : '';
          const activePlanId = idxPlan !== -1 && row[idxPlan] ? row[idxPlan] : plans[0]?.id || 'plan-lite';
          const pppoeUsername = idxPPPoE !== -1 && row[idxPPPoE] 
            ? row[idxPPPoE] 
            : `${name.toLowerCase().replace(/[^a-z0-9]/g, '').split(' ')[0] || 'customer'}_user@anet`;
          const dueDate = idxDueDate !== -1 && row[idxDueDate] ? row[idxDueDate] : '2026-07-01';

          validated.push({
            name,
            email,
            phone,
            address,
            activePlanId,
            pppoeUsername,
            dueDate
          });
        }
        setImportPreview(validated);
        setImportError(null);
      }
    } catch (err: any) {
      setImportError(err.message || 'Format tidak valid. Silakan periksa kembali.');
      setImportPreview([]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setImportText(val);
    processImportText(val, importFormat);
  };

  const handleFormatChange = (format: 'csv' | 'json') => {
    setImportFormat(format);
    setImportPreview([]);
    setImportError(null);
    // Attempt re-processing with new format if text exists
    if (importText.trim()) {
      processImportText(importText, format);
    }
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    const isJson = file.name.endsWith('.json') || file.type === 'application/json';
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';
    
    if (!isJson && !isCsv) {
      setImportError('Tipe file salah! Lampirkan dokumen ber ekstensi .csv atau .json saja.');
      return;
    }
    
    const format = isJson ? 'json' : 'csv';
    setImportFormat(format);

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setImportText(text);
        processImportText(text, format);
      }
    };
    reader.onerror = () => {
      setImportError('Gagal membaca fail yang diunggah.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileRead(e.target.files[0]);
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let filename = '';

    if (format === 'csv') {
      content = 'name,email,phone,address,activePlanId,pppoeUsername,dueDate\n' +
                'Ahmad Subardjo,subardjo@gmail.com,0812345678,Jl. Merdeka No. 10,plan-lite,subardjo_lite@anet,2026-07-01\n' +
                'Rina Wijaya,rina@yahoo.com,0856112233,Perum Indah Blok C/3,plan-home,rina_home@anet,2026-07-05\n' +
                'Kusnadi Bakri,kusnadi@outlook.com,0811928374,Kavling Elit Blok A4 No 12,plan-pro,kusnadi_pro@anet,2026-07-10';
      mimeType = 'text/csv;charset=utf-8;';
      filename = 'template_import_anet.csv';
    } else {
      const sampleJSON = [
        {
          name: "Ahmad Subardjo",
          email: "subardjo@gmail.com",
          phone: "0812345678",
          address: "Jl. Merdeka No. 10",
          activePlanId: "plan-lite",
          pppoeUsername: "subardjo_lite@anet",
          dueDate: "2026-07-01"
        },
        {
          name: "Rina Wijaya",
          email: "rina@yahoo.com",
          phone: "0856112233",
          address: "Perum Indah Blok C/3",
          activePlanId: "plan-home",
          pppoeUsername: "rina_home@anet",
          dueDate: "2026-07-05"
        }
      ];
      content = JSON.stringify(sampleJSON, null, 2);
      mimeType = 'application/json;charset=utf-8;';
      filename = 'template_import_anet.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCommitImport = () => {
    if (importPreview.length === 0) return;
    onImportCustomers(importPreview);
    setImportSuccess(`Sukses meluncurkan import! ${importPreview.length} pelanggan baru kini telah aktif di system.`);
    setImportText('');
    setImportPreview([]);
    setImportError(null);
    setTimeout(() => {
      setImportSuccess(null);
      setShowImportForm(false);
    }, 4500);
  };

  const handleManualInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerId) return;
    const currentCust = customers.find(c => c.id === invCustomerId);
    if (!currentCust) return;

    onNewInvoice({
      customerId: invCustomerId,
      customerName: currentCust.name,
      planName: plans.find(p => p.id === currentCust.activePlanId)?.name || 'ANet Speed Plan',
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

            {/* Actions Panel Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Trigger Import */}
              <button
                onClick={() => {
                  setShowImportForm(!showImportForm);
                  setShowAddCustForm(false);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 ${
                  showImportForm 
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                Import Pelanggan (CSV/JSON)
              </button>

              {/* Trigger register plan */}
              <button
                onClick={() => {
                  setShowAddCustForm(!showAddCustForm);
                  setShowImportForm(false);
                }}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Pelanggan Baru
              </button>
            </div>
          </div>

          {/* Form Import Pelanggan */}
          {showImportForm && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 max-w-4xl animate-fade-in relative shadow-lg">
              <button 
                type="button" 
                onClick={() => setShowImportForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Batal [x]
              </button>
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Sistem Import Data Pelanggan (Massal)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Migrasi data base pelanggan ANet dari file CSV Microsoft Excel atau file JSON secara instan dan aman.
                </p>
              </div>

              {/* Format Guide Alert & Downloader */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Panduan & Unduh Template Contoh:
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-2xl">
                    Struktur kolom wajib: <code className="text-emerald-400 font-mono">name, email, phone</code>. Kolom opsional: <code className="text-slate-300 font-mono">address, activePlanId, pppoeUsername, dueDate</code>. Default rencana paket adalah <em className="text-amber-400">plan-lite</em> jika dikosongkan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-bold text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                    Unduh CSV
                  </button>
                  <button
                    onClick={() => downloadTemplate('json')}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-bold text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3 text-amber-400" />
                    Unduh JSON
                  </button>
                </div>
              </div>

              {/* Upload controls / textpaste selection pills */}
              <div className="flex items-center gap-4 border-b border-slate-800/60 pb-3">
                <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-850">
                  <button
                    onClick={() => handleFormatChange('csv')}
                    className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                      importFormat === 'csv'
                        ? 'bg-emerald-400 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Format CSV
                  </button>
                  <button
                    onClick={() => handleFormatChange('json')}
                    className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${
                      importFormat === 'json'
                        ? 'bg-emerald-400 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Format JSON
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  | Drag-and-drop didukung penuh!
                </span>
              </div>

              {/* DRAG AND DROP ZONE */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-400 bg-emerald-500/5' 
                    : 'border-slate-800 bg-slate-950/45 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept=".csv,.json" 
                  className="hidden" 
                />
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-300">
                  Seret & Drop File CSV / JSON di sini, atau <span className="text-emerald-400 underline decoration-dotted">Klik untuk Jelajahi Komputer</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Gunakan berkas template (.csv atau .json) yang diunduh di atas.</p>
              </div>

              {/* OR PASTE TEXTAREA AREA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">Atau Salin & Tempel (Paste) Teks Data Di Sini:</label>
                <textarea
                  value={importText}
                  onChange={handleTextChange}
                  placeholder={
                    importFormat === 'csv'
                      ? "name,email,phone,address,activePlanId,pppoeUsername,dueDate\nIndra Lesmana,indra@gmail.com,0814422233,Gg. Damai No. 8,plan-home,indra_lesmana,2026-07-15\nSari Puspa,sari@gmail.com,0855227711,Jl. Raya Barat,plan-lite,sari_puspa,2026-07-20"
                      : '[\n  {\n    "name": "Indra Lesmana",\n    "email": "indra@gmail.com",\n    "phone": "0814422233",\n    "address": "Gg. Damai No. 8",\n    "activePlanId": "plan-home",\n    "pppoeUsername": "indra_lesmana",\n    "dueDate": "2026-07-15"\n  }\n]'
                  }
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-300 font-mono focus:outline-none focus:border-slate-700 h-28 resize-y"
                />
              </div>

              {/* STATUS ERRORS OR ACTIONS */}
              {importError && (
                <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl flex items-start gap-2.5 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-[11px] font-bold text-rose-400">Ada Masalah Validasi Dokumen:</h5>
                    <p className="text-[10px] text-rose-300 font-mono mt-0.5">{importError}</p>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-2.5 animate-fade-in bg-slate-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-400">Sinkronisasi Selesai!</h5>
                    <p className="text-[11px] text-slate-300 mt-0.5">{importSuccess}</p>
                  </div>
                </div>
              )}

              {/* TABLE PREVIEW RECORDSET BEFORE IMPORTING */}
              {importPreview.length > 0 && (
                <div className="border border-slate-800/80 rounded-xl bg-slate-950 pointer-events-auto overflow-hidden animate-fade-in space-y-0.5">
                  <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                      Pratinjau Data Valid ({importPreview.length} Baris Terbaca)
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      Telah Lolos Sensor Validasi
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-left border-collapse font-sans text-[10px]">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 border-b border-slate-900 uppercase font-mono">
                          <th className="p-2">Nama</th>
                          <th className="p-2">Kontak Email / Telp</th>
                          <th className="p-2">Paket Speed</th>
                          <th className="p-2">Username PPPoE</th>
                          <th className="p-2">Alamat</th>
                          <th className="p-2 text-right">Jatuh Tempo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {importPreview.map((item, idx) => {
                          const matchingPlan = plans.find(p => p.id === item.activePlanId);
                          return (
                            <tr key={idx} className="hover:bg-slate-900/50 text-slate-300">
                              <td className="p-2 font-semibold text-slate-200">{item.name}</td>
                              <td className="p-2">
                                <div className="text-[10px]">{item.email}</div>
                                <div className="text-[9px] text-slate-500 italic font-mono">{item.phone}</div>
                              </td>
                              <td className="p-2">
                                <span className="bg-slate-850 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-400 border border-slate-800">
                                  {matchingPlan ? matchingPlan.name : item.activePlanId}
                                </span>
                              </td>
                              <td className="p-2 font-mono text-emerald-400 text-[9px]">{item.pppoeUsername}</td>
                              <td className="p-2 max-w-[120px] truncate" title={item.address}>{item.address || '-'}</td>
                              <td className="p-2 text-right font-mono text-amber-500">{item.dueDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleCommitImport}
                      className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-black rounded-lg shadow-lg flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      Konfirmasi Import ({importPreview.length} Pelanggan Baru)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
                    placeholder="Contoh: subardjo_lite@anet"
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
                <p className="text-xs text-slate-400 mt-0.5 font-sans">Gunakan form ini untuk membuat invoice tertunda di sistem billing ANet.</p>
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
