import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Printer, Download, Send, Check } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, customers, updateInvoiceStatus } = useBusiness();
  const { profile } = useAuth();
  
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return <div style={{ padding: 40, textAlign: 'center' }}>Invoice not found</div>;

  const customer = customers.find(c => c.id === invoice.customerId);

  const subtotal = invoice.lineItems.reduce((acc, i) => acc + (i.qty * i.rate), 0);

  const generatePDF = () => {
    // Basic jsPDF setup
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${invoice.createdAt ? format(invoice.createdAt.toDate(), 'dd MMM yyyy') : ''}`, 14, 36);
    doc.text(`Due Date: ${invoice.dueDate}`, 14, 42);

    // Business Details
    doc.text(`From:`, 120, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(profile?.businessId || 'Your Business', 120, 35);
    doc.setFont('helvetica', 'normal');
    
    // Customer Details
    doc.text(`Bill To:`, 14, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customerName, 14, 60);
    doc.setFont('helvetica', 'normal');
    if (customer?.address) doc.text(customer.address, 14, 65);
    if (customer?.gstin) doc.text(`GSTIN: ${customer.gstin}`, 14, 70);

    // Table
    const tableBody = invoice.lineItems.map(item => [
      item.name,
      item.qty.toString(),
      formatINR(item.rate),
      `${item.tax}%`,
      formatINR(item.qty * item.rate)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Item Description', 'Qty', 'Rate', 'GST', 'Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] },
      styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 85;

    // Totals
    doc.text(`Subtotal: ${formatINR(subtotal)}`, 140, finalY + 10);
    doc.text(`Tax Amount: ${formatINR(invoice.taxAmount)}`, 140, finalY + 16);
    doc.text(`Discount: -${formatINR(invoice.discount)}`, 140, finalY + 22);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${formatINR(invoice.totalAmount)}`, 140, finalY + 30);

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handleMarkPaid = async () => {
    try {
      await updateInvoiceStatus(invoice.id, 'paid');
      toast.success('Invoice marked as paid');
    } catch {
      toast.error('Could not update status');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/billing')}>
          <ArrowLeft size={18} />
        </button>
        <div className="page-header-left" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Invoice {invoice.invoiceNumber}</h2>
          <span className={`badge ${
            invoice.status === 'paid' ? 'badge-success' :
            invoice.status === 'overdue' ? 'badge-danger' :
            invoice.status === 'sent' ? 'badge-brand' : 'badge-neutral'
          }`}>
            {invoice.status.toUpperCase()}
          </span>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-secondary" onClick={generatePDF}>
            <Download size={16} /> Download
          </button>
          {invoice.status !== 'paid' && (
            <button className="btn btn-primary" onClick={handleMarkPaid}>
              <Check size={16} /> Mark as Paid
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '48px 48px', background: 'white', color: 'black' }}>
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#111' }}>INVOICE</h1>
            <p style={{ margin: '4px 0 0', color: '#666' }}>#{invoice.invoiceNumber}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.displayName} Business</div>
            <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
              Encrypted Billing System
            </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48, borderTop: '2px solid #eee', borderBottom: '2px solid #eee', padding: '24px 0' }}>
          <div>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>Billed To</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{invoice.customerName}</div>
            {customer?.address && <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>{customer.address}</div>}
            {customer?.gstin && <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>GSTIN: {customer.gstin}</div>}
          </div>
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>Date Issued</div>
              <div style={{ fontWeight: 500 }}>{invoice.createdAt ? format(invoice.createdAt.toDate(), 'dd MMM yyyy') : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>Due Date</div>
              <div style={{ fontWeight: 500 }}>{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</div>
            </div>
          </div>
        </div>

        {/* Line Items Grid */}
        <table style={{ width: '100%', marginBottom: 48, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '12px 0', textAlign: 'left', color: '#444', fontWeight: 600 }}>Description</th>
              <th style={{ padding: '12px 0', textAlign: 'right', color: '#444', fontWeight: 600 }}>Rate</th>
              <th style={{ padding: '12px 0', textAlign: 'right', color: '#444', fontWeight: 600 }}>Qty</th>
              <th style={{ padding: '12px 0', textAlign: 'right', color: '#444', fontWeight: 600 }}>Tax</th>
              <th style={{ padding: '12px 0', textAlign: 'right', color: '#444', fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '16px 0', fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: '16px 0', textAlign: 'right', color: '#666' }}>{formatINR(item.rate)}</td>
                <td style={{ padding: '16px 0', textAlign: 'right', color: '#666' }}>{item.qty}</td>
                <td style={{ padding: '16px 0', textAlign: 'right', color: '#666' }}>{item.tax}%</td>
                <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 500 }}>{formatINR(item.qty * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#666' }}>
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#666' }}>
              <span>Total Tax (GST)</span>
              <span>{formatINR(invoice.taxAmount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#666' }}>
                <span>Discount</span>
                <span>-{formatINR(invoice.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid #111', marginTop: 8, fontSize: 18, fontWeight: 700 }}>
              <span>Total Amount</span>
              <span>{formatINR(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
