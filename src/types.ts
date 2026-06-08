/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpeedPlan {
  id: string;
  name: string;
  speedMbps: number;
  price: number;
  type: 'Fiber' | 'Wireless';
  ratio: '1:1' | '1:4' | '1:8';
  description: string;
}

export type CustomerStatus = 'active' | 'suspended' | 'inactive';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  activePlanId: string;
  pppoeUsername: string;
  ipAddress: string;
  currentBalance: number;
  dueDate: string;
}

export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue';

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  planName: string;
  amount: number;
  period: string; // Formatting like "Juni 2026"
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
}

export interface TicketMessage {
  id: string;
  sender: 'client' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

export type TicketCategory = 'Lambat' | 'Putus' | 'Tagihan' | 'Lainnya';
export type TicketStatus = 'open' | 'progress' | 'resolved';

export interface Ticket {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  category: TicketCategory;
  priority: 'low' | 'medium' | 'high';
  status: TicketStatus;
  createdAt: string;
  messages: TicketMessage[];
}

export interface UsagePoint {
  time: string;
  download: number;
  upload: number;
}
