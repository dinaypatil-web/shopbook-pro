import React from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { format } from 'date-fns';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
}

export default function JournalPage() {
  const { transactions } = useBusiness();

  // In a real accounting system, each transaction creates at least two journal entries.
  // Our simple form has: type, account, amount, category.
  // If Type = Income (Credit), DR Account (e.g. Cash), CR Category (e.g. Sales)
  // If Type = Expense (Debit), DR Category (e.g. Supplies), CR Account (e.g. Cash)

  const entries = transactions.flatMap(txn => {
    if (txn.type === 'credit') {
      return [
        { id: `${txn.id}-dr`, date: txn.timestamp, account: txn.account, debit: txn.amount, credit: 0, ref: txn.reference, notes: txn.notes },
        { id: `${txn.id}-cr`, date: txn.timestamp, account: txn.category, debit: 0, credit: txn.amount, ref: txn.reference, notes: '' },
      ];
    } else {
      return [
        { id: `${txn.id}-dr`, date: txn.timestamp, account: txn.category, debit: txn.amount, credit: 0, ref: txn.reference, notes: txn.notes },
        { id: `${txn.id}-cr`, date: txn.timestamp, account: txn.account, debit: 0, credit: txn.amount, ref: txn.reference, notes: '' },
      ];
    }
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Journal Entries</h2>
          <p>Chronological record of double-entry transactions.</p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 120 }}>Date</th>
                <th>Account / Particulars</th>
                <th style={{ width: 150 }}>Ref</th>
                <th style={{ textAlign: 'right', width: 150 }}>Debit (Dr)</th>
                <th style={{ textAlign: 'right', width: 150 }}>Credit (Cr)</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No journal entries found.
                  </td>
                </tr>
              )}
              {entries.map((en, i) => {
                const showDate = i === 0 || en.date !== entries[i - 1].date;
                const isCr = en.credit > 0;
                return (
                  <tr key={en.id} style={{ background: isCr ? 'transparent' : 'var(--bg-secondary)' }}>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {(showDate && en.date) ? format(en.date.toDate(), 'dd MMM yyyy') : ''}
                    </td>
                    <td style={{ paddingLeft: isCr ? 32 : 16 }}>
                      <div style={{ fontWeight: 500 }}>{isCr ? 'To ' : ''}{en.account}</div>
                      {en.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>[{en.notes}]</div>}
                    </td>
                    <td style={{ fontSize: 12 }}>{en.ref || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{en.debit > 0 ? formatINR(en.debit) : ''}</td>
                    <td style={{ textAlign: 'right' }}>{en.credit > 0 ? formatINR(en.credit) : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
