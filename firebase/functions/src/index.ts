import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled Cloud Function (Runs Daily at 9:00 AM IST)
 * Checks for overdue invoices and low stock, and could send FCM push notifications.
 */
export const dailyBusinessChecks = functions.region('asia-south1').pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('Running daily overarching checks...');

    // In a real implementation:
    // 1. We'd fetch businesses
    // 2. Fetch their overdue invoices
    // 3. We cannot decrypt fields without the user's PBKDF2 derived key!
    // -> This is the trade-off of client-side E2E encryption. 
    // The server only knows the invoice is overdue based on 'status' and 'dueDate' (which are NOT encrypted so queries work).
    
    const overdueSnap = await db.collectionGroup('invoices').where('status', '==', 'overdue').get();
    
    console.log(`Found ${overdueSnap.size} overdue invoices across all businesses.`);
    // Action: Trigger emails/SMS (would require third part service integration like Twilio/SendGrid)

    return null;
  });

/**
 * On Invoice Status Update
 * Example of a Firestore trigger. Notice how the encrypted data (amount_enc, etc) is inaccessible.
 */
export const onInvoiceUpdated = functions.region('asia-south1').firestore
  .document('businesses/{businessId}/invoices/{invoiceId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    if (before.status !== 'paid' && after.status === 'paid') {
      console.log(`Invoice ${context.params.invoiceId} was marked as PAID.`);
      // Could automatically update related ledger/transaction here if we had plaintext access
      // But because we use E2E encryption, the CLIENT handles adding the 'Transaction' to the DB when marking as paid.
    }
  });
