import { SpeedPlan, Customer, Invoice, Ticket } from '../types';

export const INITIAL_PLANS: SpeedPlan[] = [
  {
    id: 'plan-lite',
    name: 'NusaNet Lite Fiber',
    speedMbps: 20,
    price: 220000,
    type: 'Fiber',
    ratio: '1:4',
    description: 'Cocok untuk kebutuhan harian, streaming HD ringan, dan belajar online 1-3 perangkat.'
  },
  {
    id: 'plan-home',
    name: 'NusaNet Home Premium',
    speedMbps: 50,
    price: 360000,
    type: 'Fiber',
    ratio: '1:4',
    description: 'Pilihan keluarga terbaik! Lancar 4K streaming, gaming stabil, untuk 4-8 perangkat.'
  },
  {
    id: 'plan-pro',
    name: 'NusaNet Pro Symmetric',
    speedMbps: 100,
    price: 580000,
    type: 'Fiber',
    ratio: '1:1',
    description: 'Internet simetris tanpa FUP. Ideal untuk content creator, WFH intensif, streaming 4K lancar.'
  },
  {
    id: 'plan-ultra',
    name: 'NusaNet Corporate Star',
    speedMbps: 250,
    price: 1350000,
    type: 'Fiber',
    ratio: '1:1',
    description: 'Bandwidth tanpa kompromi, prioritas SLA 99.9%, free IP statis untuk kelancaran bisnis.'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-budi',
    name: 'Ahmad Budi Santoso',
    email: 'budi.santoso@gmail.com',
    phone: '081234567890',
    address: 'Jl. Kemang Raya No. 42, Jakarta Selatan',
    status: 'active',
    activePlanId: 'plan-home',
    pppoeUsername: 'budi_home@nusanet',
    ipAddress: '10.20.104.51',
    currentBalance: 0,
    dueDate: '2026-06-15'
  },
  {
    id: 'cust-lestari',
    name: 'Lestari Handayani',
    email: 'lestari.handayani@yahoo.com',
    phone: '085698765432',
    address: 'Perum Gading Serpong Blok A5/12, Tangerang',
    status: 'active',
    activePlanId: 'plan-pro',
    pppoeUsername: 'lestari_pro@nusanet',
    ipAddress: '10.20.104.98',
    currentBalance: 580000, // Unpaid balance
    dueDate: '2026-06-10'
  },
  {
    id: 'cust-joko',
    name: 'Joko Raharjo',
    email: 'joko.raharjo@outlook.com',
    phone: '087711223344',
    address: 'Sleman Indah Residence No. 8, Sleman, Yogyakarta',
    status: 'suspended', // Suspended customer to show state
    activePlanId: 'plan-lite',
    pppoeUsername: 'joko_lite@nusanet',
    ipAddress: '10.20.101.12',
    currentBalance: 220000,
    dueDate: '2026-06-05' // Overdue
  },
  {
    id: 'cust-clara',
    name: 'Clara Angelica',
    email: 'clara.angelica@gmail.com',
    phone: '082144556677',
    address: 'Jl. Dharmahusada Indah No. 15, Surabaya',
    status: 'active',
    activePlanId: 'plan-lite',
    pppoeUsername: 'clara_lite@nusanet',
    ipAddress: '10.20.102.44',
    currentBalance: 0,
    dueDate: '2026-06-25'
  },
  {
    id: 'cust-sinar',
    name: 'PT Sinar Abadi Raya',
    email: 'info@sinarabadi.co.id',
    phone: '0215556677',
    address: 'Kawasan Industri Cikarang Blok C6, Bekasi',
    status: 'active',
    activePlanId: 'plan-ultra',
    pppoeUsername: 'sinar_corp@nusanet',
    ipAddress: '182.253.12.185',
    currentBalance: 0,
    dueDate: '2026-06-20'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  // Ahmad Budi Santoso
  {
    id: 'INV-202605-001',
    customerId: 'cust-budi',
    customerName: 'Ahmad Budi Santoso',
    planName: 'NusaNet Home Premium',
    amount: 360000,
    period: 'Mei 2026',
    status: 'paid',
    createdAt: '2026-05-01',
    paidAt: '2026-05-03 08:30',
    paymentMethod: 'GoPay / QRIS'
  },
  {
    id: 'INV-202606-001',
    customerId: 'cust-budi',
    customerName: 'Ahmad Budi Santoso',
    planName: 'NusaNet Home Premium',
    amount: 360000,
    period: 'Juni 2026',
    status: 'paid',
    createdAt: '2026-06-01',
    paidAt: '2026-06-02 14:15',
    paymentMethod: 'Transfer Mandiri VA'
  },
  // Lestari Handayani
  {
    id: 'INV-202605-002',
    customerId: 'cust-lestari',
    customerName: 'Lestari Handayani',
    planName: 'NusaNet Pro Symmetric',
    amount: 580000,
    period: 'Mei 2026',
    status: 'paid',
    createdAt: '2026-05-01',
    paidAt: '2026-05-05 10:00',
    paymentMethod: 'BCA Virtual Account'
  },
  {
    id: 'INV-202606-002',
    customerId: 'cust-lestari',
    customerName: 'Lestari Handayani',
    planName: 'NusaNet Pro Symmetric',
    amount: 580000,
    period: 'Juni 2026',
    status: 'unpaid',
    createdAt: '2026-06-01'
  },
  // Joko Raharjo (Suspended/Overdue)
  {
    id: 'INV-202605-003',
    customerId: 'cust-joko',
    customerName: 'Joko Raharjo',
    planName: 'NusaNet Lite Fiber',
    amount: 220000,
    period: 'Mei 2026',
    status: 'paid',
    createdAt: '2026-05-01',
    paidAt: '2026-05-05 11:24',
    paymentMethod: 'Alfamart'
  },
  {
    id: 'INV-202606-003',
    customerId: 'cust-joko',
    customerName: 'Joko Raharjo',
    planName: 'NusaNet Lite Fiber',
    amount: 220000,
    period: 'Juni 2026',
    status: 'overdue',
    createdAt: '2026-05-25'
  },
  // PT Sinar Abadi Raya
  {
    id: 'INV-202605-004',
    customerId: 'cust-sinar',
    customerName: 'PT Sinar Abadi Raya',
    planName: 'NusaNet Corporate Star',
    amount: 1350000,
    period: 'Mei 2026',
    status: 'paid',
    createdAt: '2026-05-01',
    paidAt: '2026-05-02 09:12',
    paymentMethod: 'BNI Virtual Account'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-202606-001',
    customerId: 'cust-budi',
    customerName: 'Ahmad Budi Santoso',
    title: 'Koneksi Sering Putus Saat Hujan',
    category: 'Putus',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-06-07 14:24',
    messages: [
      {
        id: 'msg-1',
        sender: 'client',
        senderName: 'Ahmad Budi Santoso',
        message: 'Halo, kenapa internet wifi di rumah saya sering tiba-tiba RTO (Request Time Out) atau putus jika di luar sedang hujan deras? Apakah kabel FO nya ada yang longgar?',
        timestamp: '2026-06-07 14:24'
      }
    ]
  },
  {
    id: 'TCK-202606-002',
    customerId: 'cust-lestari',
    customerName: 'Lestari Handayani',
    title: 'Kecepatan Download Lambat di Sore Hari',
    category: 'Lambat',
    priority: 'low',
    status: 'progress',
    createdAt: '2026-06-06 18:10',
    messages: [
      {
        id: 'msg-1',
        sender: 'client',
        senderName: 'Lestari Handayani',
        message: 'Selamat sore tim NusaNet. Speedtest saya sore ini jam 18:00 hanya dapat sekitar 12 Mbps, seharusnya paket Pro saya 100 Mbps. Mohon dicek apakah ada pemeliharaan jaringan.',
        timestamp: '2026-06-06 18:10'
      },
      {
        id: 'msg-2',
        sender: 'admin',
        senderName: 'NusaNet Admin Support',
        message: 'Selamat sore Ibu Lestari. Mohon maaf atas ketidaknyamanannya. Kami melihat ada sirkulasi link redaman optik agak kurang stabil di area Gading Serpong. Teknisi kami sedang menelusuri gardu ODP terdekat. Kami informasikan perkembangannya.',
        timestamp: '2026-06-06 19:00'
      }
    ]
  }
];

export const generateLiveTraffic = (downloadLimit: number, uploadLimit: number) => {
  const points = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5000);
    const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
    
    // Gen random download and upload below limits
    const download = Math.max(0.2, Number((downloadLimit * (0.4 + Math.random() * 0.55)).toFixed(1)));
    const upload = Math.max(0.1, Number((uploadLimit * (0.2 + Math.random() * 0.45)).toFixed(1)));
    
    points.push({ time: timeStr, download, upload });
  }
  return points;
};
