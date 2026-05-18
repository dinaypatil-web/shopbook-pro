import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { decryptDocument, decryptNumber, ENCRYPTED_FIELDS } from '../lib/crypto';
import { addDocument, updateDocument, deleteDocument, collectionPath, writeBatch, increment } from '../lib/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit';
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  account: string;
  amount: number;
  notes: string;
  reference: string;
  category: string;
  timestamp: Timestamp;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  gstin: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
  bankAccount: string;
  balance: number;
  gstin: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  vendorId: string;
  vendorName: string;
  lineItems: Array<{ itemId?: string; name: string; qty: number; rate: number; tax: number }>;
  totalAmount: number;
  taxAmount: number;
  discount: number;
  status: 'draft' | 'received' | 'paid';
  date: string;
  createdAt: Timestamp;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  lineItems: Array<{ itemId?: string; name: string; qty: number; rate: number; tax: number }>;
  totalAmount: number;
  taxAmount: number;
  discount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: Timestamp;
}

interface BusinessContextType {
  accounts: Account[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  customers: Customer[];
  vendors: Vendor[];
  invoices: Invoice[];
  purchases: Purchase[];
  loading: boolean;
  lowStockCount: number;
  totalReceivables: number;
  totalPayables: number;
  cashBalance: number;
  bankBalance: number;

  // Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  addInventoryItem: (data: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
  addVendor: (data: Omit<Vendor, 'id'>) => Promise<void>;
  addInvoice: (data: Omit<Invoice, 'id' | 'createdAt'>) => Promise<void>;
  addPurchase: (data: Omit<Purchase, 'id' | 'createdAt'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { profile, encryptionKey } = useAuth();
  const businessId = profile?.businessId || '';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time listeners ───────────────────────────────────────────────────

  useEffect(() => {
    if (!businessId || !encryptionKey) {
      setLoading(false);
      return;
    }

    const unsubs: Array<() => void> = [];
    const key = encryptionKey;

    // Accounts
    const acctRef = collection(db, collectionPath(businessId, 'accounts'));
    unsubs.push(
      onSnapshot(acctRef, snap => {
        setAccounts(snap.docs.map(d => {
          const raw = { id: d.id, ...d.data() };
          const dec = decryptDocument(raw, ENCRYPTED_FIELDS.accounts as unknown as string[], key) as unknown as Account;
          return { ...dec, balance: decryptNumber((raw as any).balance_enc, key) };
        }));
      })
    );

    // Transactions (latest 100)
    const txnRef = query(
      collection(db, collectionPath(businessId, 'transactions')),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    unsubs.push(
      onSnapshot(txnRef, snap => {
        setTransactions(snap.docs.map(d => {
          const raw = { id: d.id, ...d.data() } as any;
          return {
            id: raw.id,
            type: raw.type,
            account: raw.account,
            category: raw.category || 'Other',
            timestamp: raw.timestamp,
            amount: decryptNumber(raw.amount_enc, key),
            notes: raw.notes_enc ? (decryptDocument(raw, ['notes'], key) as any).notes : '',
            reference: raw.reference_enc ? (decryptDocument(raw, ['reference'], key) as any).reference : '',
          } as Transaction;
        }));
        setLoading(false);
      })
    );

    // Inventory
    const invRef = collection(db, collectionPath(businessId, 'inventory'));
    unsubs.push(
      onSnapshot(invRef, snap => {
        setInventory(snap.docs.map(d => {
          const raw = { id: d.id, ...d.data() } as any;
          return {
            ...raw,
            costPrice: decryptNumber(raw.costPrice_enc, key),
            sellingPrice: decryptNumber(raw.sellingPrice_enc, key),
          } as InventoryItem;
        }));
      })
    );

    // Customers
    const custRef = collection(db, collectionPath(businessId, 'customers'));
    unsubs.push(
      onSnapshot(custRef, snap => {
        setCustomers(snap.docs.map(d => {
          const raw = { id: d.id, ...d.data() } as any;
          return decryptDocument(raw, ENCRYPTED_FIELDS.customers as unknown as string[], key) as unknown as Customer;
        }));
      })
    );

    // Vendors
    const vendRef = collection(db, collectionPath(businessId, 'vendors'));
    unsubs.push(
      onSnapshot(vendRef, snap => {
        setVendors(snap.docs.map(d => {
          const raw = { id: d.id, ...d.data() } as any;
          return decryptDocument(raw, ENCRYPTED_FIELDS.vendors as unknown as string[], key) as unknown as Vendor;
        }));
      })
    );

    // Invoices
    const invQuery = query(
      collection(db, collectionPath(businessId, 'invoices')),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    unsubs.push(
      onSnapshot(invQuery, snap => {
        setInvoices(snap.docs.map(d => {
          const raw = { id: d.id, ...d.data() } as any;
          return {
            ...raw,
            totalAmount: decryptNumber(raw.totalAmount_enc, key),
            taxAmount: decryptNumber(raw.taxAmount_enc, key),
            discount: decryptNumber(raw.discount_enc, key),
            lineItems: raw.lineItems_enc
              ? JSON.parse(decryptDocument(raw, ['lineItems'], key).lineItems as string || '[]')
              : [],
          } as Invoice;
        }));
      })
    );

    // Purchases
    const purchQuery = query(
      collection(db, collectionPath(businessId, 'purchases')),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    unsubs.push(
      onSnapshot(purchQuery, snap => {
        setPurchases(snap.docs.map(d => {
          const raw = { id: d.id, ...d.data() } as any;
          return {
            ...raw,
            totalAmount: decryptNumber(raw.totalAmount_enc, key),
            taxAmount: decryptNumber(raw.taxAmount_enc, key),
            discount: decryptNumber(raw.discount_enc, key),
            lineItems: raw.lineItems_enc
              ? JSON.parse(decryptDocument(raw, ['lineItems'], key).lineItems as string || '[]')
              : [],
          } as Purchase;
        }));
      })
    );

    return () => unsubs.forEach(u => u());
  }, [businessId, encryptionKey]);

  // ── Computed values ───────────────────────────────────────────────────────

  const lowStockCount = inventory.filter(i => i.quantity <= i.reorderLevel).length;
  const totalReceivables = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const totalPayables = vendors.reduce((s, v) => s + Math.max(0, v.balance), 0);
  const cashBalance = accounts.find(a => a.type === 'cash')?.balance || 0;
  const bankBalance = accounts
    .filter(a => a.type === 'bank')
    .reduce((s, a) => s + a.balance, 0);

  // ── Actions ───────────────────────────────────────────────────────────────

  const col = (name: string) => collectionPath(businessId, name);
  const key = encryptionKey || '';

  const addTransaction = async (data: Omit<Transaction, 'id' | 'timestamp'>) => {
    await addDocument(col('transactions'), {
      type: data.type,
      account: data.account,
      category: data.category,
      amount_enc: (await import('../lib/crypto')).encryptValue(data.amount, key),
      notes_enc: (await import('../lib/crypto')).encryptValue(data.notes, key),
      reference_enc: (await import('../lib/crypto')).encryptValue(data.reference, key),
      timestamp: Timestamp.now(),
    });
  };

  const addInventoryItem = async (data: Omit<InventoryItem, 'id'>) => {
    const { encryptValue } = await import('../lib/crypto');
    await addDocument(col('inventory'), {
      name: data.name, sku: data.sku, barcode: data.barcode,
      category: data.category, unit: data.unit,
      quantity: data.quantity, reorderLevel: data.reorderLevel,
      costPrice_enc: encryptValue(data.costPrice, key),
      sellingPrice_enc: encryptValue(data.sellingPrice, key),
    });
  };

  const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
    const { encryptValue } = await import('../lib/crypto');
    const payload: Record<string, unknown> = { ...data };
    if (data.costPrice !== undefined) { payload.costPrice_enc = encryptValue(data.costPrice, key); delete payload.costPrice; }
    if (data.sellingPrice !== undefined) { payload.sellingPrice_enc = encryptValue(data.sellingPrice, key); delete payload.sellingPrice; }
    await updateDocument(col('inventory'), id, payload);
  };

  const deleteInventoryItem = async (id: string) => {
    const { deleteDocument } = await import('../lib/firestore');
    await deleteDocument(col('inventory'), id);
  };

  const addCustomer = async (data: Omit<Customer, 'id'>) => {
    const { encryptDocument } = await import('../lib/crypto');
    const encrypted = encryptDocument(data, ENCRYPTED_FIELDS.customers as any, key);
    await addDocument(col('customers'), encrypted);
  };

  const addVendor = async (data: Omit<Vendor, 'id'>) => {
    const { encryptDocument } = await import('../lib/crypto');
    const encrypted = encryptDocument(data, ENCRYPTED_FIELDS.vendors as any, key);
    await addDocument(col('vendors'), encrypted);
  };

  const addInvoice = async (data: Omit<Invoice, 'id' | 'createdAt'>) => {
    const { encryptValue } = await import('../lib/crypto');
    const batch = writeBatch(db);
    
    // Create invoice document
    const invoiceRef = doc(collection(db, col('invoices')));
    batch.set(invoiceRef, {
      invoiceNumber: data.invoiceNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      lineItems_enc: encryptValue(JSON.stringify(data.lineItems), key),
      totalAmount_enc: encryptValue(data.totalAmount, key),
      taxAmount_enc: encryptValue(data.taxAmount, key),
      discount_enc: encryptValue(data.discount, key),
      status: data.status,
      dueDate: data.dueDate,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Deduct inventory
    for (const item of data.lineItems) {
      if (item.itemId && item.qty > 0) {
        const invRef = doc(db, col('inventory'), item.itemId);
        batch.update(invRef, { quantity: increment(-item.qty), updatedAt: Timestamp.now() });
      }
    }

    await batch.commit();
  };

  const addPurchase = async (data: Omit<Purchase, 'id' | 'createdAt'>) => {
    const { encryptValue } = await import('../lib/crypto');
    const batch = writeBatch(db);
    
    // Create purchase document
    const purchaseRef = doc(collection(db, col('purchases')));
    batch.set(purchaseRef, {
      purchaseNumber: data.purchaseNumber,
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      lineItems_enc: encryptValue(JSON.stringify(data.lineItems), key),
      totalAmount_enc: encryptValue(data.totalAmount, key),
      taxAmount_enc: encryptValue(data.taxAmount, key),
      discount_enc: encryptValue(data.discount, key),
      status: data.status,
      date: data.date,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Increase inventory
    for (const item of data.lineItems) {
      if (item.itemId && item.qty > 0) {
        const invRef = doc(db, col('inventory'), item.itemId);
        batch.update(invRef, { quantity: increment(item.qty), updatedAt: Timestamp.now() });
      }
    }

    await batch.commit();
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    await updateDocument(col('invoices'), id, { status });
  };

  return (
    <BusinessContext.Provider value={{
      accounts, transactions, inventory, customers, vendors, invoices, purchases,
      loading, lowStockCount, totalReceivables, totalPayables, cashBalance, bankBalance,
      addTransaction, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addCustomer, addVendor, addInvoice, addPurchase, updateInvoiceStatus,
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within <BusinessProvider>');
  return ctx;
}
