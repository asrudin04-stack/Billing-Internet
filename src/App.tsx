/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Settings, 
  Activity, 
  User, 
  RefreshCw, 
  ChevronRight, 
  Layers, 
  TrendingUp,
  Globe,
  Lock,
  Key,
  ShieldAlert,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { Customer, Invoice, Ticket, SpeedPlan, CustomerStatus } from './types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_PLANS, 
  INITIAL_INVOICES, 
  INITIAL_TICKETS 
} from './data/mockData';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  // Database local states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SpeedPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Navigation states
  const [currentView, setCurrentView] = useState<'client' | 'admin'>('client');
  const [activeCustomerId, setActiveCustomerId] = useState<string>('cust-lestari'); // default to Lestari to show unpaid invoice flow first

  // Security authentication states
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('anet_admin_authenticated') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('anet_admin_password') || 'admin';
  });
  const [typedPassword, setTypedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);

  // Initial load effect
  useEffect(() => {
    const rawCust = localStorage.getItem('anet_customers');
    const rawPlans = localStorage.getItem('anet_plans');
    const rawInvoices = localStorage.getItem('anet_invoices');
    const rawTickets = localStorage.getItem('anet_tickets');

    if (rawCust) setCustomers(JSON.parse(rawCust));
    else {
      setCustomers(INITIAL_CUSTOMERS);
      localStorage.setItem('anet_customers', JSON.stringify(INITIAL_CUSTOMERS));
    }

    if (rawPlans) setPlans(JSON.parse(rawPlans));
    else {
      setPlans(INITIAL_PLANS);
      localStorage.setItem('anet_plans', JSON.stringify(INITIAL_PLANS));
    }

    if (rawInvoices) setInvoices(JSON.parse(rawInvoices));
    else {
      setInvoices(INITIAL_INVOICES);
      localStorage.setItem('anet_invoices', JSON.stringify(INITIAL_INVOICES));
    }

    if (rawTickets) setTickets(JSON.parse(rawTickets));
    else {
      setTickets(INITIAL_TICKETS);
      localStorage.setItem('anet_tickets', JSON.stringify(INITIAL_TICKETS));
    }
  }, []);

  // Sync to local storage on changes helper
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // CLIENT ACTION: Pay Invoice
  const handlePayInvoice = (invoiceId: string, paymentMethod: string) => {
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'paid' as const,
          paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          paymentMethod
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    saveState('anet_invoices', updatedInvoices);

    // After updating invoices, find the matching customer and reset their due balance & status if suspended
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (targetInvoice) {
      const updatedCustomers = customers.map(cust => {
        if (cust.id === targetInvoice.customerId) {
          // Reset balance to zero and restore network to active!
          return {
            ...cust,
            currentBalance: 0,
            status: (cust.status === 'suspended' ? 'active' : cust.status) as CustomerStatus,
            dueDate: '2026-07-10' // prolong subscription
          };
        }
        return cust;
      });
      setCustomers(updatedCustomers);
      saveState('anet_customers', updatedCustomers);
    }
  };

  // CLIENT ACTION: Add support ticket
  const handleAddTicket = (title: string, category: Ticket['category'], text: string) => {
    const activeCust = customers.find(c => c.id === activeCustomerId);
    if (!activeCust) return;

    const newTicket: Ticket = {
      id: `TCK-${new Date().getFullYear()}06-${String(tickets.length + 1).padStart(3, '0')}`,
      customerId: activeCustomerId,
      customerName: activeCust.name,
      title,
      category,
      priority: 'medium',
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          senderName: activeCust.name,
          message: text,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    };

    const updatedTickets = [newTicket, ...tickets];
    setTickets(updatedTickets);
    saveState('anet_tickets', updatedTickets);
  };

  // CLIENT & ADMIN CHAT ENGINE ACTION: Send Message
  const handleSendTicketMessage = (ticketId: string, messageText: string, sender: 'client' | 'admin') => {
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        const actingCustomer = customers.find(c => c.id === ticket.customerId);
        const nameOfSender = sender === 'client' ? (actingCustomer?.name || 'Customer') : 'ANet Admin Support';
        
        return {
          ...ticket,
          // If admin replies, change ticket status to in-progress automatically
          status: (sender === 'admin' && ticket.status === 'open' ? 'progress' : ticket.status) as Ticket['status'],
          messages: [
            ...ticket.messages,
            {
              id: `msg-${Date.now()}`,
              sender,
              senderName: nameOfSender,
              message: messageText,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
            }
          ]
        };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    saveState('anet_tickets', updatedTickets);
  };

  // ADMIN ACTION: Send Ticket Reply Wrapper
  const handleSendTicketReply = (ticketId: string, replyMessage: string) => {
    handleSendTicketMessage(ticketId, replyMessage, 'admin');
  };

  // ADMIN ACTION: Update Ticket Status Directly
  const handleUpdateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status };
      }
      return t;
    });
    setTickets(updatedTickets);
    saveState('anet_tickets', updatedTickets);
  };

  // ADMIN ACTION: Add New Customer
  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>) => {
    const newId = `cust-${custData.name.toLowerCase().split(' ')[0]}-${Math.floor(100 + Math.random() * 900)}`;
    const randomIP = `10.20.103.${Math.floor(10 + Math.random() * 240)}`;
    
    const newCustomer: Customer = {
      ...custData,
      id: newId,
      status: 'active',
      currentBalance: 0,
      ipAddress: randomIP
    };

    const updatedCusts = [...customers, newCustomer];
    setCustomers(updatedCusts);
    saveState('anet_customers', updatedCusts);
  };

  // ADMIN ACTION: Import Customers (Bulk)
  const handleImportCustomers = (customersList: Omit<Customer, 'id' | 'status' | 'currentBalance' | 'ipAddress'>[]) => {
    const newCustomers: Customer[] = customersList.map((custData, index) => {
      const nameParts = custData.name.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
      const prefix = nameParts[0] || 'imported';
      const newId = `cust-${prefix}-${Math.floor(100 + Math.random() * 899) + 100}-${index}`;
      const randomIP = `10.20.103.${Math.floor(10 + Math.random() * 240)}`;
      return {
        ...custData,
        id: newId,
        status: 'active',
        currentBalance: 0,
        ipAddress: randomIP
      };
    });

    const updatedCusts = [...customers, ...newCustomers];
    setCustomers(updatedCusts);
    saveState('anet_customers', updatedCusts);
  };

  // ADMIN ACTION: Change Customer Status (e.g. suspend / unsupend)
  const handleUpdateCustomerStatus = (id: string, status: CustomerStatus) => {
    const updatedCusts = customers.map(c => {
      if (c.id === id) {
        return { ...c, status };
      }
      return c;
    });
    setCustomers(updatedCusts);
    saveState('anet_customers', updatedCusts);
  };

  // ADMIN ACTION: Update Customer Speed Plan Package
  const handleUpdateCustomerPlan = (id: string, planId: string) => {
    const updatedCusts = customers.map(c => {
      if (c.id === id) {
        return { ...c, activePlanId: planId };
      }
      return c;
    });
    setCustomers(updatedCusts);
    saveState('anet_customers', updatedCusts);
  };

  // ADMIN ACTION: Delete Customer
  const handleDeleteCustomer = (id: string) => {
    const updatedCusts = customers.filter(c => c.id !== id);
    setCustomers(updatedCusts);
    saveState('anet_customers', updatedCusts);

    // Purge their corresponding invoices & tickets
    const updatedInvoices = invoices.filter(i => i.customerId !== id);
    setInvoices(updatedInvoices);
    saveState('anet_invoices', updatedInvoices);

    const updatedTickets = tickets.filter(t => t.customerId !== id);
    setTickets(updatedTickets);
    saveState('anet_tickets', updatedTickets);
  };

  // ADMIN ACTION: Issue Manual Invoice
  const handleNewInvoice = (invoiceData: Omit<Invoice, 'id' | 'status' | 'createdAt'>) => {
    const newInvId = `INV-202606-${String(invoices.length + 1).padStart(3, '0')}`;
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id: newInvId,
      status: 'unpaid',
      createdAt: new Date().toISOString().substring(0, 10)
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveState('anet_invoices', updatedInvoices);

    // Increase customer due balance
    const updatedCusts = customers.map(c => {
      if (c.id === invoiceData.customerId) {
        return { ...c, currentBalance: c.currentBalance + invoiceData.amount };
      }
      return c;
    });
    setCustomers(updatedCusts);
    saveState('anet_customers', updatedCusts);
  };

  // ADMIN ACTION: Manual Approval Overdue/Unpaid Invoice
  const handleApproveInvoiceManual = (invoiceId: string) => {
    handlePayInvoice(invoiceId, 'Persetujuan Manual Admin');
  };

  // ADMIN ACTION: Update Admin Login Password
  const handleUpdatePassword = (newPass: string) => {
    localStorage.setItem('anet_admin_password', newPass);
    setAdminPassword(newPass);
  };

  // ADMIN ACTION: Logout / Lock session
  const handleLogout = () => {
    sessionStorage.removeItem('anet_admin_authenticated');
    setAdminAuthenticated(false);
    setTypedPassword('');
    setLoginError(null);
    setLoginSuccess(false);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('anet_admin_password') || 'admin';
    if (typedPassword === storedPass) {
      sessionStorage.setItem('anet_admin_authenticated', 'true');
      setLoginError(null);
      setLoginSuccess(true);
      setTimeout(() => {
        setAdminAuthenticated(true);
        setLoginSuccess(false);
      }, 700);
    } else {
      setLoginError('Kata sandi administrator salah! Mohon coba kembali.');
      setLoginSuccess(false);
    }
  };

  // Reset Storage back to default to test fresh sandbox
  const handleResetSandbox = () => {
    if (confirm('Atur ulang kembali semua database dan transaksi ANet ke pengaturan awal?')) {
      localStorage.removeItem('anet_customers');
      localStorage.removeItem('anet_plans');
      localStorage.removeItem('anet_invoices');
      localStorage.removeItem('anet_tickets');

      setCustomers(INITIAL_CUSTOMERS);
      setPlans(INITIAL_PLANS);
      setInvoices(INITIAL_INVOICES);
      setTickets(INITIAL_TICKETS);
      
      setActiveCustomerId('cust-lestari');
      setCurrentView('client');
    }
  };

  const activeCustomerObj = customers.find(c => c.id === activeCustomerId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none selection:bg-emerald-500/20 antialiased">
      
      {/* GLOBAL BILLING BARROW HEADER */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-400 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/10">
                <Wifi className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 text-slate-100">
                  ANET
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h1>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">ISP BILLING INTERNET</p>
              </div>
            </div>

            {/* PORTAL VIEW SWAP SWITCH */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCurrentView('client')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentView === 'client'
                    ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Portal Pelanggan
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentView === 'admin'
                    ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Dashboard Admin
              </button>
            </div>

            {/* RESET BUTTON */}
            <div className="hidden md:flex items-center gap-3">
              {currentView === 'admin' && adminAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Lock Sesi Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Kunci Sesi
                </button>
              )}
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <Globe className="w-3 h-3 text-emerald-400" />
                SERVER OK
              </span>
              <button
                onClick={handleResetSandbox}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 border border-slate-800 rounded-lg transition-colors flex items-center gap-1"
                title="Atur ulang database billing ke default"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Data
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* PORTAL ACTIVE SUBBAR (Only visible when client mode is selected) */}
      {currentView === 'client' && (
        <div className="bg-slate-900 border-b border-slate-800/60 p-2.5">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 py-1 px-2.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="font-semibold text-[10px] uppercase font-mono">Simulasi Sandbox:</span>
              <span className="text-slate-300 text-[11px]">Anda bisa berpindah akun pelanggan untuk mensimulasikan kondisi billing.</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-mono text-slate-400 text-right block whitespace-nowrap">Pilih Akun Login:</label>
              <select
                value={activeCustomerId}
                onChange={e => setActiveCustomerId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-slate-700 min-w-[200px]"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status === 'suspended' ? '🚫 Suspended' : '🟢 Active'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {currentView === 'client' ? (
          activeCustomerObj ? (
            <CustomerPortal 
              customer={activeCustomerObj} 
              plans={plans} 
              invoices={invoices} 
              tickets={tickets} 
              onAddTicket={handleAddTicket}
              onPayInvoice={handlePayInvoice}
              onSendTicketMessage={handleSendTicketMessage}
            />
          ) : (
            <div className="text-center py-20 text-slate-500">
              Profil pelanggan terpilih tidak ditemukan. Atur ulang database Anda.
            </div>
          )
        ) : !adminAuthenticated ? (
          <div className="py-12 flex items-center justify-center">
            <form onSubmit={handleLoginSubmit} className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  {loginSuccess ? (
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  ) : (
                    <Lock className="w-6 h-6 stroke-[2]" />
                  )}
                </div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-100">Otentikasi Administrator</h2>
                <p className="text-xs text-slate-400">Masukkan kata sandi untuk mengakses halaman manajemen gateway & invoice ANet.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block col-span-2">Kata Sandi</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={typedPassword}
                      onChange={(e) => setTypedPassword(e.target.value)}
                      placeholder="Masukkan kata sandi admin..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-xl p-3 pr-10 text-xs text-slate-200 focus:outline-none transition-all placeholder-slate-600 font-mono tracking-widest"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 py-2.5 px-3 rounded-lg flex items-start gap-2 leading-relaxed">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {loginSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 py-2.5 px-3 rounded-lg flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Sandi dikonfirmasi! Sedang mempersiapkan panel admin...</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginSuccess}
                  className={`w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                    loginSuccess 
                      ? 'bg-emerald-500 text-slate-950 scale-[0.98]' 
                      : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98]'
                  }`}
                >
                  {loginSuccess ? 'Memuat...' : 'Masuk Ke Panel'}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-slate-800/60">
                <p className="text-[10px] text-slate-500 font-mono">
                  Sandi Default: <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-emerald-400">admin</span>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <AdminPanel 
            customers={customers} 
            plans={plans} 
            invoices={invoices} 
            tickets={tickets} 
            onAddCustomer={handleAddCustomer}
            onImportCustomers={handleImportCustomers}
            onUpdateCustomerStatus={handleUpdateCustomerStatus}
            onUpdateCustomerPlan={handleUpdateCustomerPlan}
            onDeleteCustomer={handleDeleteCustomer}
            onNewInvoice={handleNewInvoice}
            onApproveInvoiceManual={handleApproveInvoiceManual}
            onSendTicketReply={handleSendTicketReply}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onUpdatePassword={handleUpdatePassword}
            currentPasswordValue={adminPassword}
          />
        )}

      </main>

      {/* FOOTER SYSTEM SUMMARY */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 font-sans">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-500">ANet ISP Billing System • v1.4.0 Stable</p>
          <p>Didesain secara elegan untuk mengapresiasi manajemen core jaringan fiber optik & billing Indonesia.</p>
          <p className="text-[10px] text-slate-700 font-mono pt-1">
            Running in Sandboxed Node Env • Port 3000 Secured Ingress
          </p>
        </div>
      </footer>

    </div>
  );
}
