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
  AlertTriangle,
  Lock,
  Key,
  Eye,
  EyeOff,
  LayoutDashboard,
  Server,
  Megaphone,
  Radio,
  HardDrive,
  RefreshCw,
  LogOut,
  Menu,
  X,
  Router,
  Wifi,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Settings,
  Layers,
  Calendar
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
  onUpdatePassword: (newPass: string) => void;
  currentPasswordValue: string;
  onLogout?: () => void;
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
  onUpdateTicketStatus,
  onUpdatePassword,
  currentPasswordValue,
  onLogout
}) => {
  // Tabs mapped to the ANet Left Sidebar
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'onu'
    | 'mikrotik'
    | 'whatsapp_status'
    | 'whatsapp_broadcast'
    | 'customers'
    | 'paket'
    | 'billing'
    | 'laporan'
    | 'tickets'
    | 'teknisi'
    | 'security'
  >('dashboard');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveUpdateActive, setLiveUpdateActive] = useState(true);
  
  // States for billing reports, Broadcaster, and ONU interactions
  const [onuRefreshSpin, setOnuRefreshSpin] = useState(false);
  const [rebootingOnuId, setRebootingOnuId] = useState<string | null>(null);
  const [broadcastTemplate, setBroadcastTemplate] = useState(
    'Halo {nama}, tagihan internet {paket} Anda sebesar {jumlah} untuk periode {periode} telah diterbitkan. Harap lakukan pembayaran sebelum tanggal jatuh tempo {jatuh_tempo} untuk menghindari isolir otomatis. Terima kasih.'
  );
  const [selectedBroadcastFilter, setSelectedBroadcastFilter] = useState<'all' | 'unpaid'>('unpaid');
  const [broadcastProgress, setBroadcastProgress] = useState<number | null>(null);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([
    '[WA DB] Sistem Broadcast Siap.'
  ]);
  const [waConnectedUser, setWaConnectedUser] = useState(true);
  const [waSendingTest, setWaSendingTest] = useState(false);
  const [waTestNumber, setWaTestNumber] = useState('');
  const [waTestMessage, setWaTestMessage] = useState('Tes Pesan dari ANET WEBPORTAL API Gateway.');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

  
  // Password change states
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Search inputs
  const [customerSearch, setCustomerSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');

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

  // Get available list of unique periods
  const uniquePeriods = Array.from(new Set(invoices.map(i => i.period))).sort();

  // Filter invoices for chart based on selected period
  const chartInvoices = selectedPeriodFilter === 'all'
    ? invoices
    : invoices.filter(i => i.period === selectedPeriodFilter);

  const paidChartInvoices = chartInvoices.filter(i => i.status === 'paid');
  const unpaidChartInvoices = chartInvoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');

  const totalPaidSum = paidChartInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalUnpaidSum = unpaidChartInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCombineSum = totalPaidSum + totalUnpaidSum;

  const countPaid = paidChartInvoices.length;
  const countUnpaid = unpaidChartInvoices.length;
  const countTotal = countPaid + countUnpaid;

  const recoveryEfficiency = totalCombineSum > 0 
    ? Math.round((totalPaidSum / totalCombineSum) * 100) 
    : 0;

  // Group invoices by period for reporting
  const periodsData = Array.from(new Set(invoices.map(i => i.period))).sort().map(pr => {
    const periodInvoices = invoices.filter(i => i.period === pr);
    const paidSum = periodInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
    const unpaidSum = periodInvoices.filter(i => i.status !== 'paid').reduce((acc, i) => acc + i.amount, 0);
    return {
      period: pr,
      paid: paidSum,
      unpaid: unpaidSum,
      total: paidSum + unpaidSum
    };
  });

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
    <div className="flex w-full min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* MOBILE HEADER BUTTON BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
            <Wifi className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-black text-xs tracking-wider text-slate-200">ANET WEBPORTAL</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 active:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDEBAR (Desktop Fixed, Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 select-none
        md:translate-x-0 md:static md:h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* LOGO & BRAND */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-indigo-500/10">
            <Wifi className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-wider text-slate-100 uppercase">ANET WEBPORTAL</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ADMIN PANEL</p>
            </div>
          </div>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          
          {/* GROUP 1: UTAMA */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 tracking-wider font-mono uppercase pl-2">UTAMA</h3>
            
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => { setActiveTab('onu'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'onu'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              Monitoring ONU
              <span className="ml-auto bg-rose-500/10 text-rose-400 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-lg border border-rose-500/10">11</span>
            </button>

            <button
              onClick={() => { setActiveTab('mikrotik'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'mikrotik'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <Server className="w-4 h-4" />
              Monitoring MikroTik
            </button>

            <button
              onClick={() => { setActiveTab('whatsapp_status'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'whatsapp_status'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Status WhatsApp
              <span className="ml-auto bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-emerald-500/10">LIVE</span>
            </button>

            <button
              onClick={() => { setActiveTab('whatsapp_broadcast'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'whatsapp_broadcast'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              Broadcast WA
            </button>
          </div>

          {/* GROUP 2: BILLING */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 tracking-wider font-mono uppercase pl-2">BILLING</h3>
            
            <button
              onClick={() => { setActiveTab('customers'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'customers'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4" />
              Pelanggan
            </button>

            <button
              onClick={() => { setActiveTab('paket'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'paket'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              Paket Internet
            </button>

            <button
              onClick={() => { 
                setActiveTab('billing'); 
                setMobileMenuOpen(false);
                if (customers.length > 0 && !invCustomerId) {
                  setInvCustomerId(customers[0].id);
                }
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'billing'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Tagihan
              {pendingInvoiceCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                  {pendingInvoiceCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('laporan'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'laporan'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Laporan Keuangan
            </button>
          </div>

          {/* GROUP 3: LAYANAN */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 tracking-wider font-mono uppercase pl-2">LAYANAN</h3>

            <button
              onClick={() => { setActiveTab('tickets'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              Keluhan Pelanggan
              {openTicketCount > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-950 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                  {openTicketCount}
                </span>
              )}
            </button>
          </div>

          {/* GROUP 4: MANAJEMEN */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-500 tracking-wider font-mono uppercase pl-2">MANAJEMEN</h3>

            <button
              onClick={() => { setActiveTab('teknisi'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'teknisi'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Teknisi Roster
            </button>

            <button
              onClick={() => { setActiveTab('security'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
              }`}
            >
              <Lock className="w-4 h-4" />
              Keamanan Sandi
            </button>
          </div>

        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-300">
              AD
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-300">Administrator</p>
              <p className="text-[9px] text-slate-500 font-mono">ID: anet_root</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition"
              title="Kunci Sesi"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30"
        />
      )}

      {/* RIGHT DISPLAY PANEL CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-950 overflow-y-auto w-full pt-14 md:pt-0">
        
        {/* TOP STATUS BAR HEADER */}
        <header className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold hidden sm:inline-block">Status Jaringan:</span>
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
              CORE GATEWAY OK
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Update Switcher */}
            <button 
              onClick={() => setLiveUpdateActive(!liveUpdateActive)}
              className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 p-1.5 px-3 rounded-lg border border-slate-800 text-[10px] font-bold transition duration-200"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveUpdateActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
              <span className={liveUpdateActive ? 'text-slate-300' : 'text-slate-500'}>Live Update</span>
            </button>

            <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Role: Admin
            </span>

            {onLogout && (
              <button
                onClick={onLogout}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 p-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Kunci Sesi</span>
              </button>
            )}
          </div>
        </header>

        {/* CONTAINER VIEWPORT WORKSPACE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto pb-12">
          
          {/* ================= tab: dashboard ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Header section with page title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                    Dashboard Utama
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Status real-time gateway ONU, billing interkoneksi, dan keluhan klien ANet.</p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-900 border border-slate-800/80 rounded-lg p-1.5 px-3 text-xs text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Juni 2026
                  </span>
                </div>
              </div>

              {/* SECTION: ONU STATUSES GRID IN THE SCREENSHOT */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-500 tracking-wider font-mono uppercase pl-1">STATUS KONEKSI TERMINAL GPON / ONU</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total ONU registered */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">TOTAL ONU</span>
                      <HardDrive className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-100 font-mono mt-1">115</div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Perangkat terdaftar di OLT</span>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-slate-800/10 rounded-full blur-2xl pointer-events-none" />
                  </div>

                  {/* Online ONUs */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">ONLINE</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-1">104</div>
                    <span className="text-[10px] text-emerald-500/80 mt-1 block">GPON aktif saat ini</span>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  </div>

                  {/* Offline ONUs */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">OFFLINE</span>
                      <button 
                        onClick={() => {
                          setOnuRefreshSpin(true);
                          setTimeout(() => setOnuRefreshSpin(false), 1200);
                        }}
                        className="text-slate-500 hover:text-slate-300 transition"
                        title="Perbarui data OLT"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${onuRefreshSpin ? 'animate-spin text-indigo-400' : ''}`} />
                      </button>
                    </div>
                    <div className="text-2xl font-black text-rose-500 font-mono mt-1">11</div>
                    <span className="text-[10px] text-rose-500/80 mt-1 block">LOS / Redaman kritis</span>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                  </div>

                  {/* Warnings */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">WARNING</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-amber-500 font-mono mt-1">0</div>
                    <span className="text-[10px] text-amber-500/80 mt-1 block">Perlu perhatian mekanis</span>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* SECTION: BILLING KPI SUMMARY */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-500 tracking-wider font-mono uppercase pl-1">RINGKASAN BILLING BULAN INI</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pendapatan Bulan Ini */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <TrendingUp className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 block font-bold">PENDAPATAN</span>
                      <span className="text-sm font-extrabold text-slate-100 font-mono">{formatIDR(totalPaidSum)}</span>
                      <span className="text-[9px] text-indigo-400 block mt-0.5">Sudah terkumpul (Lunas)</span>
                    </div>
                  </div>

                  {/* Pelanggan Aktif */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-emerald-400/15 border border-emerald-400/20 text-emerald-400 flex items-center justify-center">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 block font-bold">PELANGGAN AKTIF</span>
                      <span className="text-sm font-extrabold text-slate-100 font-mono">
                        {activeCustomers.length} <span className="text-[10px] font-normal text-slate-500">/{customers.length} total</span>
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Sesi PPPoE terinterkoneksi</span>
                    </div>
                  </div>

                  {/* Tagihan Belum Bayar */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                      <CreditCard className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 block font-bold">TAGIHAN AKTIF</span>
                      <span className="text-sm font-extrabold text-slate-100 font-mono">{countUnpaid}</span>
                      <span className="text-[9px] text-rose-500 block mt-0.5">Menunggu pembayaran</span>
                    </div>
                  </div>

                  {/* Total Piutang */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 block font-bold">TOTAL PIUTANG</span>
                      <span className="text-sm font-extrabold text-slate-100 font-mono">{formatIDR(totalUnpaidSum)}</span>
                      <span className="text-[9px] text-amber-500 block mt-0.5">Belum tertagih / Lunas parsial</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRID BOX FOR STATUS ONU DONUT AND ACTION CARDS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* ONU Donut Chart Box (90% online as shown in image) */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-indigo-400 rounded-sm inline-block"></span>
                      Status Koneksi ONU
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Visualisasi efisiensi interkoneksi terminal optik di lapangan.</p>
                  </div>

                  {/* Donut SVG container */}
                  <div className="my-5 flex justify-center items-center relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      {/* Trail circle (Offline 10%) */}
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        stroke="#f43f5e"
                        strokeWidth="10"
                        fill="transparent"
                        className="opacity-20"
                      />
                      {/* Active Circle (Online 90%) */}
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        stroke="#10b981"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray="326.7"
                        strokeDashoffset="32.67" /* 90% */
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    {/* Inner percentage metrics */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-mono text-slate-100">90.4%</span>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-black">ONLINE</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-1 bg-slate-950/40 rounded px-2">
                      <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Active ONUs
                      </span>
                      <span className="font-mono font-bold text-slate-200">104</span>
                    </div>
                    <div className="flex items-center justify-between p-1 bg-slate-950/40 rounded px-2">
                      <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Offline ONUs
                      </span>
                      <span className="font-mono font-bold text-slate-200">11</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions (Aksi Cepat) Grid in the screenshot */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-indigo-400 rounded-sm inline-block"></span>
                      Aksi Cepat Menu
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Pintasan administrasi untuk mempercepat manajemen interkoneksi router.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 my-4">
                    {/* Button 1: Tambah Pelanggan */}
                    <button 
                      onClick={() => { setActiveTab('customers'); setShowAddCustForm(true); }}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all duration-200 text-left group"
                    >
                      <Users className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-slate-200 block">Tambah Pelanggan</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Registrasi pppoe & OLT</span>
                    </button>

                    {/* Button 2: Kelola Paket */}
                    <button 
                      onClick={() => setActiveTab('paket')}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all duration-200 text-left group"
                    >
                      <Layers className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-slate-200 block">Kelola Paket</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Konfigurasi bandwidth</span>
                    </button>

                    {/* Button 3: Buat Tagihan */}
                    <button 
                      onClick={() => { setActiveTab('billing'); setShowAddInvoiceForm(true); }}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all duration-200 text-left group"
                    >
                      <FileText className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-slate-200 block">Buat Tagihan</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Penerbitan baru manual</span>
                    </button>

                    {/* Button 4: Laporan */}
                    <button 
                      onClick={() => setActiveTab('laporan')}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all duration-200 text-left group"
                    >
                      <TrendingUp className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-slate-200 block">Laporan</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Arus keuangan bulanan</span>
                    </button>

                    {/* Button 5: Monitor ONU */}
                    <button 
                      onClick={() => setActiveTab('onu')}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all duration-200 text-left group"
                    >
                      <HardDrive className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-slate-200 block">Monitor ONU</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Cek level signal laser</span>
                    </button>

                    {/* Button 6: Bulk Config */}
                    <button 
                      onClick={() => setActiveTab('security')}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-all duration-200 text-left group"
                    >
                      <Lock className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-slate-200 block">Keamanan Sandi</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Credential gating terminal</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SEKSI REKAP PEMBAYARAN & CHART (PAID VS UNPAID) - Placed directly on dashboard */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-805 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-emerald-400 rounded-sm inline-block"></span>
                      REKAP & VISUALISASI STATUS PEMBAYARAN
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Pantau total penerimaan lunas (Paid) dan piutang tagihan tertunda (Unpaid/Overdue) secara dinamis.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">Filter Periode:</span>
                    <select
                      value={selectedPeriodFilter}
                      onChange={e => setSelectedPeriodFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-slate-700 font-sans cursor-pointer"
                    >
                      <option value="all">Semua Periode ({invoices.length} Invoice)</option>
                      {uniquePeriods.map(p => (
                        <option key={p} value={p}>{p} ({invoices.filter(i => i.period === p).length} Invoice)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 py-2">
                  {/* LEFT: DONUT VISUALIZATION WITH HOVER EFFECTS */}
                  <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-805 pb-6 md:pb-0 md:pr-6">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* UNPAID RING (unpaid/overdue is red) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#ef4444" 
                          strokeWidth="10"
                          fill="transparent"
                          className="text-rose-500"
                        />
                        {/* PAID RING (paid is green) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#10b981" 
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * recoveryEfficiency) / 100}
                          className="transition-all duration-1000 ease-out text-emerald-400"
                        />
                      </svg>
                      {/* Percent badge overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black font-mono text-slate-50">{recoveryEfficiency}%</span>
                        <span className="text-[8px] uppercase tracking-widest font-bold text-slate-400">Efisiensi Kas</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: DETAILED METRICS AND STATS BLOCK */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Rasio Kolektibilitas Tagihan</span>
                        <span className="font-mono text-emerald-400 font-bold">{recoveryEfficiency}% Lunas</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 p-0.5 overflow-hidden">
                        <div 
                          className="bg-emerald-400 rounded-full h-full transition-all duration-1000 ease-out" 
                          style={{ width: `${recoveryEfficiency}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* CARTU PAID */}
                      <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 font-bold">Lunas (Paid)</span>
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                            {countPaid} Invoice
                          </span>
                        </div>
                        <div className="text-base font-black text-slate-100 font-mono">
                          {formatIDR(totalPaidSum)}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Aliran kas masuk yang berhasil diamankan.</p>
                      </div>

                      {/* CARTU UNPAID */}
                      <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/60 hover:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-rose-500 font-bold">Tertunggak (Belum Bayar)</span>
                          <span className="bg-rose-500/10 text-rose-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-rose-500/20">
                            {countUnpaid} Invoice
                          </span>
                        </div>
                        <div className="text-base font-black text-slate-100 font-mono">
                          {formatIDR(totalUnpaidSum)}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Target kolektibilitas penagihan gateway.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= tab: onu ================= */}
          {activeTab === 'onu' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-indigo-400" />
                    Monitoring Terminal ONU (Optic Network Unit)
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Status redaman, level laser, dan interkoneksi terminal pelanggan pada OLT GPON.</p>
                </div>
                <button 
                  onClick={() => {
                    setOnuRefreshSpin(true);
                    setTimeout(() => setOnuRefreshSpin(false), 1000);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold px-3.5 py-1.5 rounded-lg transition text-xs flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${onuRefreshSpin ? 'animate-spin' : ''}`} />
                  Refresh OLT
                </button>
              </div>

              {/* ONU stats summary panel */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">RATA-RATA REDAMAN</span>
                  <span className="text-lg font-bold text-slate-300 font-mono">-21.4 dBm</span>
                  <span className="text-[9px] text-emerald-400 block mt-0.5">Kondisi Normal/Optimal</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">PORT OLT TERPAKAI</span>
                  <span className="text-lg font-bold text-slate-300 font-mono">4 Port GPON</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">HUAWEI MA5608T</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">LOS WARNINGS</span>
                  <span className="text-lg font-bold text-rose-500 font-mono">11 Offline</span>
                  <span className="text-[9px] text-rose-500/80 block mt-0.5">FOC Kabel Terputus</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold">INDEX PEMBAGIAN</span>
                  <span className="text-lg font-bold text-slate-300 font-mono font-bold">ODP 1:8 / 1:16</span>
                  <span className="text-[9px] text-indigo-400 block mt-0.5">Rasio Optimal Bergaransi</span>
                </div>
              </div>

              {/* Table of ONUs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 bg-slate-950/20 text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Daftar Terminal Lasercut ONU</span>
                  <span className="font-mono text-[10px] text-slate-500">Total: {customers.length + 4} ONU Terdeteksi</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono text-[9px] uppercase">
                        <th className="p-3">Pelanggan</th>
                        <th className="p-3">Model ONU</th>
                        <th className="p-3 col-span-2">GPON Interface ID</th>
                        <th className="p-3">IP Node</th>
                        <th className="p-3">Rx Power (Signal)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-sans text-slate-300">
                      {customers.map((c, idx) => {
                        const isEven = idx % 2 === 0;
                        const rxPower = isEven ? '-19.45 dBm' : idx % 3 === 0 ? '-25.80 dBm' : '-22.10 dBm';
                        const signalColor = idx % 3 === 0 ? 'text-amber-500' : 'text-emerald-400';
                        return (
                          <tr key={c.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-slate-200">
                              {c.name}
                              <span className="block text-[9px] text-slate-500 font-mono">{c.pppoeUsername}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-400">{idx % 2 === 0 ? 'ZXHN F609 V5' : 'Huawei HG8245H'}</td>
                            <td className="p-3 font-mono text-slate-400">1/1/2:{idx + 1}</td>
                            <td className="p-3 font-mono text-slate-500">{c.ipAddress}</td>
                            <td className={`p-3 font-mono font-bold ${signalColor}`}>{rxPower}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-emerald-500/10 uppercase">
                                Active • On
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => {
                                  setRebootingOnuId(c.id);
                                  setTimeout(() => {
                                    setRebootingOnuId(null);
                                    alert(`ONU milik ${c.name} telah berhasil di-reboot jarak jauh (reboot system OK).`);
                                  }, 1800);
                                }}
                                disabled={rebootingOnuId !== null}
                                className="bg-slate-950 hover:bg-slate-800 hover:text-indigo-400 border border-slate-800 font-bold px-2 py-1 rounded text-[10px] transition"
                              >
                                {rebootingOnuId === c.id ? 'Rebooting...' : 'Reboot ONU'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Simulated offline/LOS ONUs for visual depth */}
                      <tr className="hover:bg-slate-800/40 bg-rose-500/5">
                        <td className="p-3 font-semibold text-slate-200">
                          Sudrajat Wibowo
                          <span className="block text-[9px] text-slate-500 font-mono">sudrajat_wifi</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">FiberHome HG6145F</td>
                        <td className="p-3 font-mono text-slate-400">1/1/3:4</td>
                        <td className="p-3 font-mono text-slate-500">10.20.30.155</td>
                        <td className="p-3 font-mono font-bold text-rose-500">LOS / Off</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-rose-500/10 uppercase">
                            OFFLINE • LOS
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[10px] text-rose-400 font-bold px-2 block">Kabel Terputus</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-800/40 bg-rose-500/5">
                        <td className="p-3 font-semibold text-slate-200">
                          Siti Aminah
                          <span className="block text-[9px] text-slate-500 font-mono">siti_aminah</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">Huawei HG8546M</td>
                        <td className="p-3 font-mono text-slate-400">1/1/4:18</td>
                        <td className="p-3 font-mono text-slate-500">10.20.30.198</td>
                        <td className="p-3 font-mono font-bold text-rose-400">-31.50 dBm</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 font-mono text-[9px] font-black px-1.5 py-0.5 rounded-lg border border-rose-500/10 uppercase">
                            OFFLINE • RE-D
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-[10px] text-slate-500 px-2 block">Damping Over</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= tab: mikrotik ================= */}
          {activeTab === 'mikrotik' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-400" />
                    Monitoring MikroTik RouterBOARD
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Status CPU, RAM, suhu internal, alokasi IP DHCP Leases, ddan traffic PPPoE aktif.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-mono">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  API CON: EX-TIK-01
                </div>
              </div>

              {/* MikroTik specs & meters */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* System Specs Left Panel */}
                <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 tracking-wider font-mono uppercase">Sistem Resources</h3>
                    <p className="text-[10px] text-slate-500">Detail hardware MikroTik CCR2004 Core Router.</p>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 font-bold">Router Model:</span>
                      <span className="text-slate-200 font-semibold">CCR2004-16G-2S+PC</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 font-bold">RouterOS Ver:</span>
                      <span className="text-slate-200 font-semibold">v7.12.1 (Stable)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 font-bold">Uptime System:</span>
                      <span className="text-slate-200 font-semibold">24d 18j 42m 11s</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 font-bold">Suhu CPU Core:</span>
                      <span className="text-amber-400 font-semibold">41°C</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 font-bold">Tegangan Listrik:</span>
                      <span className="text-slate-200 font-semibold">24.1 V</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Total Sesi PPPoE:</span>
                      <span className="text-indigo-400 font-bold">{customers.length} Terkoneksi</span>
                    </div>
                  </div>

                  {/* VISUALISASI TERKINI: ROUND DIAL COCKPIT GAUGES */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                    {/* CPU Radial Gauge */}
                    <div className="flex flex-col items-center justify-center bg-slate-950/45 p-4 rounded-xl border border-slate-805">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Outer track */}
                          <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                          {/* Active arc indicator with neon glow */}
                          <circle 
                            cx="50" cy="50" r="40" 
                            stroke="#818cf8" strokeWidth="8" fill="transparent" 
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * 14) / 100}
                            className="transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-sm font-black text-slate-100">14%</span>
                          <span className="text-[7px] uppercase text-indigo-400 font-bold tracking-wider">CPU Core</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold mt-2 uppercase">Load Average</span>
                    </div>

                    {/* RAM Radial Gauge */}
                    <div className="flex flex-col items-center justify-center bg-slate-950/45 p-4 rounded-xl border border-slate-805">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Outer track */}
                          <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                          {/* Active arc indicator with neon glow */}
                          <circle 
                            cx="50" cy="50" r="40" 
                            stroke="#059669" strokeWidth="8" fill="transparent" 
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * 13.8) / 100}
                            className="transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-sm font-black text-slate-100">13.8%</span>
                          <span className="text-[7px] uppercase text-emerald-400 font-bold tracking-wider">RAM Memory</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold mt-2 uppercase">142MB/1GB</span>
                    </div>
                  </div>
                </div>

                {/* Router Live interface list */}
                <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 tracking-wider font-mono uppercase">PPPoE Dial-In Active Sessions</h3>
                    <p className="text-[10px] text-slate-500">Sesi user pppoe yang saat ini sedang melakukan dial jaringan internet ANet.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                          <th className="p-2 pl-0">User Session</th>
                          <th className="p-2">IP Local IP Pool</th>
                          <th className="p-2">Paket Kecepatan</th>
                          <th className="p-2">Live Up-Rate</th>
                          <th className="p-2">Uptime Sesi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {customers.map((c, i) => {
                          const plan = plans.find(p => p.id === c.activePlanId);
                          const liveUp = i % 2 === 0 ? '1.54 Mbps' : '442 Kbps';
                          const liveDown = i % 2 === 0 ? '8.40 Mbps' : '2.10 Mbps';
                          return (
                            <tr key={c.id}>
                              <td className="p-2 pl-0 font-bold text-slate-200">{c.pppoeUsername}</td>
                              <td className="p-2 text-slate-400">{c.ipAddress}</td>
                              <td className="p-2 text-indigo-400 font-sans font-semibold">{plan ? plan.name : 'Unknown Plan'}</td>
                              <td className="p-2 text-emerald-400 font-bold">▲ {liveUp} <span className="text-[9px] text-indigo-400 ml-1">▼ {liveDown}</span></td>
                              <td className="p-2 text-slate-400">04:12:{i + 20}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================= tab: whatsapp_status ================= */}
          {activeTab === 'whatsapp_status' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Status WhatsApp Gateway API Bot
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Pantau konektivitas Baileys Node Engine dan kirim pesan manual pengujian.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Connection detail status panel */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold font-mono text-slate-300 uppercase">Engine Status</span>
                    {waConnectedUser ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg">
                        🟢 CONNECTED
                      </span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg">
                        🔴 DISCONNECTED
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Linked Phone:</span>
                      <span className="text-slate-200">+62 823-1122-3344 (ANet Bot)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Instance ID Secret:</span>
                      <span className="text-slate-200 font-bold">inst_anet_8432</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">API Gateway URL:</span>
                      <span className="text-indigo-400 underline">https://api.anetwifi.com/v1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Engine Core Base:</span>
                      <span className="text-slate-200">Whatapp-Baileys Multidevice v5.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Message Dispatched Today:</span>
                      <span className="text-slate-200 font-bold">51 SMS / Pesan WA</span>
                    </div>
                  </div>

                  {waConnectedUser ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs text-emerald-400 flex items-start gap-2 max-w-md">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Status Bot: Terhubung Sempurna</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 font-sans">Semua pengiriman invoice, isolir warning, dan tiket support akan dikirimkan otomatis ke handphone klien.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-slate-800 bg-slate-950/60 rounded-xl flex flex-col items-center justify-center text-center py-6">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg mb-3">
                        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 block">Menunggu Autentikasi Scan</span>
                      <span className="text-[10px] text-slate-500 block max-w-[240px] mt-1 font-sans">Silakan scan kode QR yang dihasilkan server dengan menu Link Device di app WhatsApp Anda.</span>
                    </div>
                  )}

                  <div className="pt-2 font-sans">
                    <button 
                      onClick={() => setWaConnectedUser(!waConnectedUser)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                        waConnectedUser 
                          ? 'bg-rose-500/15 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {waConnectedUser ? 'Matikan WhatsApp Gateway' : 'Hubungkan Kembali (Scan QR)'}
                    </button>
                  </div>
                </div>

                {/* Send test message manual box */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 tracking-wider font-mono uppercase">Kirim Pesan Uji Coba Manual</h3>
                    <p className="text-[10px] text-slate-500">Gunakan form ini untuk melakukan pengetesan integrasi API bot WhatsApp ANet.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setWaSendingTest(true);
                      setTimeout(() => {
                        setWaSendingTest(false);
                        setBroadcastLogs(prev => [
                          ...prev,
                          `[WA PENGETESAN] API trigger message dispatched to phone: ${waTestNumber}`
                        ]);
                        alert(`Sukses mengirimkan pesan uji coba manual ke nomor ${waTestNumber}`);
                        setWaTestNumber('');
                      }, 1000);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">No. WhatsApp Penerima</label>
                      <input 
                        type="tel" 
                        placeholder="Contoh: +628123456789" 
                        value={waTestNumber}
                        onChange={e => setWaTestNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-slate-700"
                        required
                      />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Draft Isi Pesan</label>
                      <textarea 
                        rows={3}
                        placeholder="Ketik isi pesan teks..." 
                        value={waTestMessage}
                        onChange={e => setWaTestMessage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 font-sans focus:outline-none focus:border-slate-700 leading-relaxed"
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={waSendingTest || !waConnectedUser}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-lg transition text-xs font-sans"
                    >
                      {waSendingTest ? 'Mengirimkan...' : 'Kirim Pesan Pengetesan'}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* ================= tab: whatsapp_broadcast ================= */}
          {activeTab === 'whatsapp_broadcast' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-indigo-400" />
                    WhatsApp Billing Reminder Broadcaster
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Kirim peringatan bill secara massal ke no WA terdaftar milik customer secara aman.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Broadcast Composer Form Left */}
                <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 tracking-wider font-mono uppercase">Template Composer (Template WA)</h3>
                    <p className="text-[10px] text-slate-500">Anda dapat menyematkan keyword macro dinamis: {'{nama}'}, {'{paket}'}, {'{jumlah}'}, {'{periode}'}, {'{jatuh_tempo}'}</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    
                    {/* Selector of Target Group */}
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Segmen Target Kirim</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input 
                            type="radio" 
                            name="target_b" 
                            value="unpaid"
                            checked={selectedBroadcastFilter === 'unpaid'}
                            onChange={() => setSelectedBroadcastFilter('unpaid')}
                            className="bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0" 
                          />
                          Pelanggan Belum Bayar ({countUnpaid} Orang)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input 
                            type="radio" 
                            name="target_b" 
                            value="all"
                            checked={selectedBroadcastFilter === 'all'}
                            onChange={() => setSelectedBroadcastFilter('all')}
                            className="bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0" 
                          />
                          Semua Pelanggan ({customers.length} Orang)
                        </label>
                      </div>
                    </div>

                    {/* Template draft box */}
                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono block">Isi Konten Broadcast</label>
                      <textarea
                        rows={6} 
                        value={broadcastTemplate}
                        onChange={e => setBroadcastTemplate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl block leading-relaxed text-slate-200 font-sans focus:outline-none focus:border-slate-700"
                        placeholder="Tuliskan draft template broadcast..."
                      />
                    </div>

                    {/* Simulation trigger */}
                    <div className="font-sans">
                      <button 
                        onClick={() => {
                          if (broadcastProgress !== null) return;
                          
                          setBroadcastProgress(0);
                          setBroadcastLogs(prev => [...prev, `[BROADCAST START] Menginisiasi pengiriman massal ke target WA...`]);
                          
                          const interval = setInterval(() => {
                            setBroadcastProgress(prev => {
                              if (prev === null) {
                                clearInterval(interval);
                                return null;
                              }
                              const next = prev + 20;
                              if (next >= 100) {
                                clearInterval(interval);
                                setTimeout(() => {
                                  setBroadcastProgress(null);
                                  setBroadcastLogs(l => [...l, `[BROADCAST COMPLETED] Pengiriman selesai sepenuhnya.`]);
                                  alert('Pengiriman broadcast peringatan tagihan massal telah selesai diproses.');
                                }, 500);
                                return 100;
                              }
                              
                              // Add simulated log
                              const custIndex = Math.min(Math.floor((next / 100) * customers.length), customers.length - 1);
                              const targetCust = customers[custIndex];
                              if (targetCust) {
                                setBroadcastLogs(l => [
                                  ...l,
                                  `[BROADCAST DISPATCH] Sent to +62 821-xxxx-${targetCust.id.substring(5,9)} [${targetCust.name}] - Delivered OK.`
                                ]);
                              }
                              return next;
                            });
                          }, 1000);
                        }}
                        disabled={broadcastProgress !== null}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-505 text-slate-100 font-bold rounded-xl text-xs active:scale-95 transition"
                      >
                        {broadcastProgress !== null ? `Mengeksekusi Broadcast (${broadcastProgress}%)` : `Mulai Jalankan Broadcast Tagihan massal WA`}
                      </button>
                    </div>

                    {/* Progress Bar indicator */}
                    {broadcastProgress !== null && (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-950 border border-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                          <div className="bg-indigo-400 h-full rounded-full transition-all duration-300" style={{ width: `${broadcastProgress}%` }} />
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Broadcast Live Logs Right */}
                <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between overflow-hidden">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 tracking-wider font-mono uppercase">Audit Logs Transparansi Dispatched</h3>
                    <p className="text-[10px] text-slate-500">Konsol log real-time transaksi broadcast dari node multidevice.</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 h-56 md:h-72 my-3 overflow-y-auto font-mono text-[10px] text-indigo-400 space-y-1 shadow-inner custom-scrollbar">
                    {broadcastLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed border-b border-slate-900/50 pb-1 last:border-b-0">
                        {log}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setBroadcastLogs(['[WA DB] Konsol log dibebaskan kembali. Sedia memantau.'])}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-bold border border-slate-850 rounded-lg transition font-sans"
                  >
                    Bersihkan Log Konsol
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================= tab: paket ================= */}
          {activeTab === 'paket' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Manajemen Paket Jasa Internet
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Konfigurasi bandwidth upload/download dan harga bulanan paket internet pelanggan ANet.</p>
                </div>
              </div>

              {/* Roster of Plans */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map(p => {
                  return (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-sm flex flex-col justify-between h-48 group hover:border-indigo-500/20 transition duration-300">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border border-indigo-500/20">
                            ID: {p.id}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">Fiber FTTH</span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-100 group-hover:text-indigo-400 transition">{p.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{p.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 gap-1 flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-slate-200 font-mono">{formatIDR(p.price)}</span>
                          <span className="text-[9px] text-slate-500">/bulan</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                          <span>Speed: <span className="text-indigo-400 font-bold">{p.speedMbps} Mbps</span></span>
                          <span className="text-slate-600">•</span>
                          <span>FUP: Unlimited</span>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-indigo-500/5 blur-xl group-hover:to-indigo-500/10 transition animate-pulse" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= tab: laporan ================= */}
          {activeTab === 'laporan' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Laporan Keuangan & Buku Ledger Kas
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Laporan komparasi invoice lunas, target penerimaan bulanan, dan audit slip pembayaran.</p>
                </div>
                <button 
                  onClick={() => alert('Mensimulasikan cetak printout ledger ke format Excel/CSV. File siap unduh.')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition font-sans"
                >
                  <Download className="w-3.5 h-3.5" />
                  Cetak Excel Laporan
                </button>
              </div>

              {/* Cash bookkeeping cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">PENDAPATAN LUNAS (CASH RECOVERED)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{formatIDR(totalPaidSum)}</span>
                  <span className="text-[9px] text-emerald-500 mt-1 block">Dari {countPaid} tagihan terselesaikan.</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">PIUTANG BERJALAN (RECEIVABLES ACCRUED)</span>
                  <span className="text-xl font-black text-rose-500 font-mono">{formatIDR(totalUnpaidSum)}</span>
                  <span className="text-[9px] text-rose-400 mt-1 block">Dari {countUnpaid} tagihan belum dibayar.</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">PENDAPATAN PROYEKSI MAKSIMAL (MRR CAP)</span>
                  <span className="text-xl font-black text-slate-200 font-mono">{formatIDR(totalCombineSum)}</span>
                  <span className="text-[9px] text-indigo-400 mt-1 block">Rasio lunas efisiensi: {recoveryEfficiency}%</span>
                </div>
              </div>

              {/* VISUALISASI TERKINI: BAR CHART REVENUE vs RECEIVABLES */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-emerald-400 rounded-sm inline-block"></span>
                      Grafik Aliran Kas Jaringan ANet (Paid vs Unpaid)
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">Studi komparasi penerimaan kas lunas dibandingkan piutang per periode rekening.</p>
                  </div>
                  <div className="flex gap-4 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-400"></span>
                      <span className="text-slate-400 font-bold">Lunas (Paid)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                      <span className="text-slate-400 font-bold">Piutang (Receivables)</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-56 bg-slate-950 border border-slate-805/85 rounded-xl p-4 flex items-end justify-around relative pt-12">
                  {/* Grid lines */}
                  <div className="absolute left-4 right-4 top-10 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-t border-slate-800 w-full"></div>
                    <div className="border-t border-slate-800 w-full"></div>
                    <div className="border-t border-slate-800 w-full"></div>
                    <div className="border-t border-slate-800 w-full"></div>
                  </div>

                  {periodsData.map((pd) => {
                    const maxAmount = Math.max(...periodsData.map(p => Math.max(p.paid, p.unpaid)), 100000);
                    const paidPercent = (pd.paid / maxAmount) * 100;
                    const unpaidPercent = (pd.unpaid / maxAmount) * 100;

                    return (
                      <button 
                        key={pd.period} 
                        onClick={() => setSelectedPeriodFilter(pd.period)}
                        className="flex flex-col items-center group relative z-15 hover:bg-slate-900/10 p-1.5 rounded-lg border border-transparent focus:outline-none focus:border-indigo-500/20"
                      >
                        {/* Interactive floating indicator */}
                        <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 backdrop-blur-md border border-slate-700/60 text-[10px] p-2.5 rounded-xl shadow-xl pointer-events-none text-center min-w-[130px] font-sans -left-1/2 -translate-x-1/8 z-50">
                          <p className="font-bold text-slate-100 mb-1 font-mono">{pd.period}</p>
                          <p className="text-emerald-400 font-mono font-bold flex items-center justify-between"><span>Lunas:</span> <span>{formatIDR(pd.paid)}</span></p>
                          <p className="text-rose-400 font-mono font-bold flex items-center justify-between"><span>Piutang:</span> <span>{formatIDR(pd.unpaid)}</span></p>
                        </div>

                        <div className="flex items-end gap-2 h-32">
                          {/* Paid Bar */}
                          <div 
                            className="w-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t border-t border-emerald-350 shadow-lg shadow-emerald-500/5 group-hover:scale-y-105 transition duration-300"
                            style={{ height: `${Math.max(paidPercent, 4)}%` }}
                          />
                          {/* Unpaid Bar */}
                          <div 
                            className="w-6 bg-gradient-to-t from-rose-600 to-rose-450 rounded-t border-t border-rose-400 shadow-lg shadow-rose-500/5 group-hover:scale-y-105 transition duration-350"
                            style={{ height: `${Math.max(unpaidPercent, 4)}%` }}
                          />
                        </div>

                        {/* Periode label */}
                        <span className="text-[10px] font-mono font-bold text-slate-405 mt-2.5">{pd.period}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Completed Payment Ledger Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 bg-slate-950/20 text-xs font-bold text-slate-300">
                  Riwayat Audit Penerimaan Lunas
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-mono text-[9px] uppercase">
                        <th className="p-3">Ref ID Tagihan</th>
                        <th className="p-3">Klien Pembayar</th>
                        <th className="p-3">Periode Rekening</th>
                        <th className="p-3">Jumlah Transaksi</th>
                        <th className="p-3">Metode Bayar</th>
                        <th className="p-3 text-right">Status Ledger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {invoices.filter(i => i.status === 'paid').map(i => {
                        return (
                          <tr key={i.id} className="hover:bg-slate-800/20">
                            <td className="p-3 font-mono font-bold text-indigo-400">{i.id}</td>
                            <td className="p-3 font-semibold text-slate-200">{i.customerName}</td>
                            <td className="p-3 text-slate-400 font-mono">{i.period}</td>
                            <td className="p-3 font-mono text-emerald-400 font-bold">{formatIDR(i.amount)}</td>
                            <td className="p-3 font-sans">
                              {i.id.endsWith('1') ? (
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 w-max">
                                  <Check className="w-3 h-3" /> GoPay Virtual Account
                                </span>
                              ) : (
                                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1 w-max">
                                  <Check className="w-3 h-3" /> Manual Persetujuan Admin
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <span className="inline-block bg-slate-950 border border-slate-850 text-slate-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                                CLOSED • SETTLED
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {invoices.filter(i => i.status === 'paid').length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-slate-500 font-sans">
                            Belum ada transaksi lunas terdaftar dalam riwayat pembayaran.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= tab: teknisi ================= */}
          {activeTab === 'teknisi' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-2">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-400" />
                    Manajemen Roster & Penugasan Teknisi
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Daftar personil maintenance lapangan, sektor operasional area, ddan status kelayakan penanganan.</p>
                </div>
              </div>

              {/* Roster database of staff */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'tech-bambang',
                    name: 'Bambang Santoso',
                    skills: 'Splicing FO Core, OPM Trace, OSP Overhead',
                    zone: 'Sektor Barat (ANet Utara)',
                    phone: '+62 821-2233-1100',
                    status: 'Tersedia',
                    currentTask: 'None'
                  },
                  {
                    id: 'tech-andi',
                    name: 'Andi Kuswira',
                    skills: 'Setting Mikrotik PPPoE, Dynamic Routing DHCP',
                    zone: 'Sektor Pusat (ANet Tengah)',
                    phone: '+62 819-4560-8800',
                    status: 'Selesai Tugas',
                    currentTask: 'Maintenance Redaman di ODP Seroja'
                  },
                  {
                    id: 'tech-hendra',
                    name: 'Hendra Saputra',
                    skills: 'Splicing Dropcore, CATV Cable, ONU Configuration',
                    zone: 'Sektor Selatan (ANet Selatan)',
                    phone: '+62 858-9900-1122',
                    status: 'Di Lapangan',
                    currentTask: 'Penarikan Dropcore Baru Klien Lestari'
                  }
                ].map(tech => {
                  const statusColors = 
                    tech.status === 'Tersedia' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : tech.status === 'Selesai Tugas'
                        ? 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  return (
                    <div key={tech.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative shadow-sm flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between mb-3 font-sans">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${statusColors}`}>
                            {tech.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">TK-ID: {tech.id}</span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-100 group-hover:text-indigo-400 transition">{tech.name}</h3>
                        <p className="text-[11px] text-indigo-400 mt-1 font-semibold font-sans">{tech.zone}</p>
                        
                        <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px] leading-relaxed">
                          <div>
                            <span className="text-slate-500 block">Keahlian Lapangan:</span>
                            <span className="text-slate-300 block">{tech.skills}</span>
                          </div>
                          <div className="pt-1.5">
                            <span className="text-slate-500 block font-sans">Penugasan Aktif:</span>
                            <span className="text-slate-400 block font-mono">{tech.currentTask}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-801 mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">{tech.phone}</span>
                        <button 
                          onClick={() => alert(`Sistem men-trigger WhatsApp direct message ke teknisi ${tech.name}`)}
                          className="p-1 px-3.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800 rounded transition font-sans"
                        >
                          Hubungi Teknisi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= tab: customers (existing customers panel) ================= */}
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

      {activeTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-xl mx-auto mt-4 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Ubah Kredensial Administrator</h3>
              <p className="text-[11px] text-slate-400">Pastikan sandi baru Anda aman dan disimpan dengan baik.</p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            setPassError(null);
            setPassSuccess(null);

            if (oldPasswordInput !== currentPasswordValue) {
              setPassError('Kata sandi lama tidak cocok!');
              return;
            }
            if (newPasswordInput.length < 4) {
              setPassError('Kata sandi baru harus minimal 4 karakter!');
              return;
            }
            if (newPasswordInput !== confirmPasswordInput) {
              setPassError('Konfirmasi kata sandi baru tidak cocok!');
              return;
            }

            onUpdatePassword(newPasswordInput);
            setPassSuccess('Kata sandi admin berhasil diperbarui!');
            setOldPasswordInput('');
            setNewPasswordInput('');
            setConfirmPasswordInput('');
          }} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Kata Sandi Saat Ini</label>
              <input
                type="password"
                placeholder="Masukkan kata sandi saat ini..."
                value={oldPasswordInput}
                onChange={e => setOldPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block col-span-2 font-sans">Kata Sandi Baru</label>
              <input
                type="password"
                placeholder="Masukkan kata sandi baru (min. 4 karakter)..."
                value={newPasswordInput}
                onChange={e => setNewPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Konfirmasi Kata Sandi Baru</label>
              <input
                type="password"
                placeholder="Ulangi kata sandi baru..."
                value={confirmPasswordInput}
                onChange={e => setConfirmPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                required
              />
            </div>

            {passError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 p-3 rounded-lg flex items-center gap-2 font-sans">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{passSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-500/5 hover:scale-[1.01] active:scale-95"
            >
              Simpan Sandi Baru
            </button>
          </form>
        </div>
      )}

          </main>
        </div>
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
