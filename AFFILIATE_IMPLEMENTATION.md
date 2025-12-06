# Affiliate Link System Implementation

## Overview
This document describes the complete affiliate link system implementation for the Divaksha e-commerce referral application.

## Frontend Implementation

### 1. Affiliate Utilities (`src/utils/affiliate.ts`)
- **`setAffiliate(affiliateUserId, affiliateCode)`**: Stores affiliate info in cookie (30 days) and localStorage
- **`getAffiliate()`**: Retrieves affiliate info from cookie/localStorage, validates 30-day TTL
- **`clearAffiliate()`**: Removes affiliate tracking
- **`hasAffiliate()`**: Checks if affiliate tracking is active

### 2. Affiliate Service (`src/api/affiliateService.ts`)
- **`validateAffiliateCode(code)`**: Calls `GET /api/affiliate/:code` to validate affiliate code

### 3. Affiliate Page (`src/pages/Affiliate/Affiliate.tsx`)
- Route: `/affiliate/:code`
- Validates affiliate code with backend
- Stores affiliate info in cookie/localStorage
- Redirects to `/products` page

### 4. Updated Components

#### OrderPage (`src/pages/OrderPage/OrderPage.tsx`)
- Reads affiliate info from cookie/localStorage
- Includes `affiliateUserId` in sale creation request
- Shows alert when affiliate tracking is active
- Clears affiliate after successful purchase

#### RegisterUser (`src/pages/RegisterUser/RegisterUser.tsx`)
- Checks for affiliate cookie on registration
- If user came via affiliate link and registers, affiliate owner becomes their parent
- Uses affiliate code as referral code if no referral code in URL

#### SaleCreate (`src/pages/SaleCreate/SaleCreate.tsx`)
- Includes `affiliateUserId` in sale creation (for admin/testing)

#### Dashboard (`src/pages/Dashboard/Dashboard.tsx`)
- Displays affiliate link: `${origin}/affiliate/${user.affiliateCode}`
- Copy button for affiliate link
- Shows both referral link and affiliate link side-by-side

### 5. Type Updates (`src/types/index.ts`)
- `User`: Added `affiliateCode?: string`
- `Sale`: Added `affiliateUserId: number | null`
- `CreateSaleRequest`: Added `affiliateUserId?: number`

## Backend Implementation

### 1. Database Migration (`backend/migration_add_affiliate_code.sql`)
```sql
-- Add affiliate_code to users table (UNIQUE, NOT NULL)
ALTER TABLE users ADD COLUMN affiliate_code VARCHAR(50);
UPDATE users SET affiliate_code = CONCAT('AFF', LPAD(CAST(id AS VARCHAR), 8, '0')) WHERE affiliate_code IS NULL;
ALTER TABLE users ALTER COLUMN affiliate_code SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_affiliate_code UNIQUE (affiliate_code);

-- Add affiliate_user_id to sales table
ALTER TABLE sales ADD COLUMN affiliate_user_id BIGINT;
ALTER TABLE sales ADD CONSTRAINT fk_sales_affiliate_user FOREIGN KEY (affiliate_user_id) REFERENCES users(id);
```

### 2. Entity Updates

#### User Entity (`backend/UserEntityUpdate.java`)
```java
@Column(name = "affiliate_code", unique = true, nullable = false, length = 50)
private String affiliateCode;
```

#### Sale Entity (`backend/SaleEntityUpdate.java`)
```java
@Column(name = "affiliate_user_id")
private Long affiliateUserId;
```

### 3. Repository Updates (`backend/UserRepositoryUpdate.java`)
```java
Optional<User> findByAffiliateCode(String affiliateCode);
```

### 4. Controller (`backend/AffiliateController.java`)
- **GET `/api/affiliate/:code`**: Validates affiliate code and returns user info
- Returns `AffiliateInfoResponse` with `affiliateUserId`, `code`, `username`

### 5. Service (`backend/AffiliateService.java`)
- Validates affiliate code exists
- Returns affiliate user information

### 6. Sale Service Update (`backend/SaleServiceUpdate.java`)
- Accepts `affiliateUserId` in `SaleRequest`
- Distributes single-level commission (10%) to affiliate user
- Records commission in `commission_ledger` table
- Marks affiliate user as active

### 7. DTOs

#### AffiliateInfoResponse (`backend/AffiliateInfoResponse.java`)
```java
{
  "affiliateUserId": 123,
  "code": "AFF00000123",
  "username": "john_doe"
}
```

#### SaleRequest (`backend/SaleRequest.java`)
- Added `affiliateUserId` field (optional)

## How It Works

### Flow 1: Anonymous Visitor Purchase
1. Visitor clicks affiliate link: `https://myapp.com/affiliate/ABC123`
2. Frontend validates code via `GET /api/affiliate/ABC123`
3. Stores `{affiliateUserId, affiliateCode, timestamp}` in cookie (30 days)
4. Visitor browses products
5. Visitor registers/logs in and purchases
6. Sale creation includes `affiliateUserId`
7. Backend distributes 10% commission to affiliate user
8. Affiliate cookie cleared after purchase

### Flow 2: Registration via Affiliate Link
1. Visitor clicks affiliate link: `https://myapp.com/affiliate/ABC123`
2. Affiliate info stored in cookie
3. Visitor registers (no referral code in URL)
4. Frontend checks affiliate cookie
5. Uses affiliate code as referral code during registration
6. New user's `parentId` = affiliate user's ID
7. Affiliate cookie cleared after registration

### Flow 3: Direct Registration (No Affiliate)
1. User registers without affiliate cookie
2. Normal registration flow
3. No affiliate tracking

## Key Features

1. **Cookie-based Tracking**: 30-day TTL, works across sessions
2. **localStorage Backup**: Fallback if cookies disabled
3. **Single-level Commission**: 10% commission to affiliate user only
4. **Automatic Attribution**: No manual tracking needed
5. **Registration Integration**: Affiliate link can create referral relationship

## Testing

### Test Affiliate Link Flow
1. Register a user (gets affiliate code)
2. Copy affiliate link from dashboard
3. Open in incognito/private window
4. Browse products
5. Register new account
6. Make purchase
7. Verify commission ledger shows affiliate commission

### Test Cookie Persistence
1. Click affiliate link
2. Close browser
3. Reopen browser
4. Verify affiliate tracking still active (check cookie/localStorage)

## Environment Variables
No additional environment variables needed. Uses existing `REACT_APP_API_BASE_URL`.

## Notes
- Affiliate code is generated automatically on user registration
- Affiliate code format: `AFF` + padded user ID (e.g., `AFF00000123`)
- Commission percentage: 10% (single-level only)
- Cookie TTL: 30 days
- Affiliate tracking works for both registered and anonymous users

