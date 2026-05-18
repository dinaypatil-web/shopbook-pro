# ShopBook Pro — Firestore Schema

All business data is rooted under the `/businesses/{businessId}/` path.

## `users` Collection
Path: `/users/{userId}`
- `uid`: string
- `email`: string
- `displayName`: string
- `businessId`: string (reference to the business they belong to)
- `salt`: string (random salt used with PBKDF2 to derive encryption key)
- `role`: "admin" | "staff"

## `businesses` Collection
Path: `/businesses/{businessId}`
- `name`: string
- `gstNumber`: string
- `ownerId`: string
- `members`: array of string (uids)
- `createdAt`: timestamp

## `accounts` Collection
Path: `/businesses/{businessId}/accounts/{accountId}`
- `name`: string
- `type`: "cash" | "bank" | "credit"
- `balance_enc`: Base64 string (AES-256 encrypted balance)

## `transactions` Collection
Path: `/businesses/{businessId}/transactions/{txnId}`
- `type`: "credit" | "debit"
- `account`: string 
- `amount_enc`: string (encrypted)
- `notes_enc`: string (encrypted)
- `reference_enc`: string (encrypted)
- `category`: string
- `timestamp`: timestamp

## `inventory` Collection
Path: `/businesses/{businessId}/inventory/{itemId}`
- `name`: string
- `sku`: string
- `barcode`: string
- `category`: string
- `unit`: string
- `quantity`: number
- `reorderLevel`: number
- `costPrice_enc`: string (encrypted)
- `sellingPrice_enc`: string (encrypted)

## `customers` & `vendors` Collections
Path: `/businesses/{businessId}/customers/{custId}`
- `name`: string
- `phone_enc`: string (encrypted)
- `email_enc`: string (encrypted)
- `address_enc`: string (encrypted)
- `gstin_enc`: string (encrypted)
- `balance_enc`: string (encrypted)

## `invoices` Collection
Path: `/businesses/{businessId}/invoices/{invoiceId}`
- `invoiceNumber`: string
- `customerId`: string
- `customerName`: string
- `lineItems_enc`: string (encrypted JSON array)
- `totalAmount_enc`: string (encrypted)
- `taxAmount_enc`: string (encrypted)
- `discount_enc`: string (encrypted)
- `status`: "draft" | "sent" | "paid" | "overdue"
- `dueDate`: date string
- `createdAt`: timestamp
