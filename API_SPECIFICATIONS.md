# API Specifications for Backend Implementation

This document contains the request/response structures for the new API endpoints that need to be implemented in the Java backend.

## 1. Contact Us Query Endpoint

### Endpoint
`POST /api/contact/query`

### Request Headers
```
Content-Type: application/json
Authorization: Bearer {token} (optional, for authenticated users)
```

### Request Body
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your products..."
}
```

### Request Schema
```typescript
interface ContactQueryRequest {
  name: string;        // Required, min 2 characters
  email: string;       // Required, valid email format
  subject: string;     // Required, min 3 characters
  message: string;     // Required, min 10 characters
}
```

### Response (Success - 200 OK)
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your products...",
  "createdAt": "2024-01-15T10:30:00Z",
  "status": "PENDING"  // Optional: PENDING, RESPONDED, CLOSED
}
```

### Response Schema
```typescript
interface ContactQueryResponse {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;  // ISO 8601 format
  status?: string;    // Optional status field
}
```

### Error Responses
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Server error

---

## 2. Unified Order Submit Endpoint (Single & Multi-Item)

### Endpoint
`POST /api/orders/submit`

### Request Headers
```
Content-Type: application/json
Authorization: Bearer {token} (required)
```

### Request Body
```json
{
  "buyerId": 123,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 499.00,
    },
    {
      "productId": 2,
      "quantity": 1,
      "price": 999.00,
    }
  ],
  "totalAmount": 1997.00,
  "paymentProofUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "deliveryAddress": "123 Main St, Area, Landmark, City, District - 123456",
  "deliveryPhone": "9876543210",
  "deliveryName": "John Doe",
  "deliveryEmail": "john.doe@example.com",
  "affiliateCode": "AFF123"  // Optional: affiliate code if applicable
}
```

### Request Schema
```typescript
interface CreateOrderRequest {
  buyerId?: number;                    // Optional: ID of the buyer/user (can be extracted from auth token)
  items: OrderItem[];                  // Required: Array of order items (single item = array of length 1)
  totalAmount: number;                // Required: Total order amount
  paymentProofUrl: string;             // Required: Base64 encoded image or URL
  deliveryAddress: string;              // Required: Full delivery address
  deliveryPhone: string;               // Required: 10-digit phone number
  deliveryName: string;                // Required: Recipient name
  deliveryEmail: string;               // Required: Valid email address
  affiliateCode: string | null;        // Optional: Affiliate code (can be null)
}

interface OrderItem {
  productId: number;                   // Required: Product ID
  quantity: number;                    // Required: Quantity (min 1)
  price: number;                       // Required: Unit price at time of order
  sellerId: number | null;             // Optional: Seller ID (can be null)
}
```

### Response (Success - 200 OK)
```json
{
  "orderId": 789,
  "buyerId": 123,
  "totalAmount": 1997.00,
  "status": "PENDING",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 499.00,
      "orderId": 789
    },
    {
      "productId": 2,
      "quantity": 1,
      "price": 999.00,
      "orderId": 789
    }
  ],
  "deliveryAddress": "123 Main St, Area, Landmark, City, District - 123456",
  "deliveryPhone": "9876543210",
  "deliveryName": "John Doe",
  "deliveryEmail": "john.doe@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Response Schema
```typescript
interface OrderResponse {
  orderId: number;                     // Generated order ID
  buyerId: number;                     // Buyer/user ID
  totalAmount: number;                 // Total order amount
  status: string;                      // Order status: PENDING, APPROVED, SHIPPED, DELIVERED, CANCELLED
  items: OrderItemResponse[];          // Array of order items
  deliveryAddress: string;             // Delivery address
  deliveryPhone: string;                // Delivery phone
  deliveryName: string;                // Delivery name
  deliveryEmail: string;               // Delivery email
  paymentProofUrl: string | null;       // Payment proof URL (after backend processing)
  affiliateCode: string | null;         // Affiliate code used
  createdAt: string;                   // ISO 8601 format
}

interface OrderItemResponse {
  productId: number;
  quantity: number;
  price: number;
  sellerId: number | null;             // Seller ID (can be null)
  orderId: number;                     // Reference to parent order
}
```

### Error Responses
- `400 Bad Request`: Invalid input data (missing fields, invalid format)
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Product(s) not found
- `422 Unprocessable Entity`: Business logic errors (insufficient stock, invalid quantities)
- `500 Internal Server Error`: Server error

### Business Logic Notes

1. **Order Creation**: The backend should:
   - Validate all products exist and are available
   - Check product quantities are available
   - Create a single order record with multiple order items
   - Store payment proof (save base64 image to file system or cloud storage)
   - Update product inventory if applicable
   - Handle affiliate code if provided

2. **Payment Proof**: 
   - Accept base64 encoded image string (format: `data:image/jpeg;base64,...`)
   - Save to file system or cloud storage (S3, etc.)
   - Store the URL/path in the order record
   - Validate image format and size on backend

3. **Order Items**:
   - Each item should reference the parent order
   - Store individual item prices at time of order (for historical accuracy)
   - Handle seller IDs if multi-seller marketplace

4. **Status Flow**:
   - Initial status: `PENDING` (awaiting payment approval)
   - After admin approval: `APPROVED`
   - When shipped: `SHIPPED`
   - When delivered: `DELIVERED`
   - If cancelled: `CANCELLED`

---

## Validation Rules

### Contact Query
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `subject`: Required, 3-200 characters
- `message`: Required, 10-5000 characters

### Cart Order
- `buyerId`: Required, must exist in users table
- `items`: Required, array with at least 1 item
- `items[].productId`: Required, must exist in products table
- `items[].quantity`: Required, minimum 1, maximum based on stock
- `items[].price`: Required, must match current product price (or allow override for discounts)
- `totalAmount`: Required, must equal sum of (price × quantity) for all items
- `paymentProofUrl`: Required, valid base64 image or URL
- `deliveryPhone`: Required, 10 digits
- `deliveryEmail`: Required, valid email format
- `deliveryAddress`: Required, 5-500 characters
- `deliveryName`: Required, 2-100 characters

---

## Example Java Entity Classes (Reference)

```java
// ContactQuery.java
@Entity
@Table(name = "contact_queries")
public class ContactQuery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false, length = 200)
    private String subject;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private String status; // PENDING, RESPONDED, CLOSED
    
    // Getters and setters
}

// CartOrder.java
@Entity
@Table(name = "cart_orders")
public class CartOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;
    
    @Column(nullable = false)
    private Long buyerId;
    
    @Column(nullable = false)
    private BigDecimal totalAmount;
    
    @Column(nullable = false)
    private String status; // PENDING, APPROVED, etc.
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String deliveryAddress;
    
    @Column(nullable = false, length = 10)
    private String deliveryPhone;
    
    @Column(nullable = false, length = 100)
    private String deliveryName;
    
    @Column(nullable = false)
    private String deliveryEmail;
    
    private String paymentProofUrl;
    private String affiliateCode;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<CartOrderItem> items;
    
    // Getters and setters
}

// CartOrderItem.java
@Entity
@Table(name = "cart_order_items")
public class CartOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private CartOrder order;
    
    @Column(nullable = false)
    private Long productId;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    private Long sellerId;
    
    // Getters and setters
}
```

---

## Testing Examples

### cURL Examples

#### Contact Query
```bash
curl -X POST http://localhost:8080/api/contact/query \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Product Inquiry",
    "message": "I would like to know more about your products."
  }'
```

#### Unified Order Submit (Single Item)
```bash
curl -X POST http://localhost:8080/api/orders/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "buyerId": 123,
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "price": 499.00,
        "sellerId": null
      }
    ],
    "totalAmount": 998.00,
    "paymentProofUrl": "data:image/jpeg;base64,...",
    "deliveryAddress": "123 Main St, City - 123456",
    "deliveryPhone": "9876543210",
    "deliveryName": "John Doe",
    "deliveryEmail": "john@example.com",
    "affiliateCode": null
  }'
```

#### Unified Order Submit (Multi-Item)
```bash
curl -X POST http://localhost:8080/api/orders/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "buyerId": 123,
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "price": 499.00,
        "sellerId": 456
      },
      {
        "productId": 2,
        "quantity": 1,
        "price": 999.00,
        "sellerId": null
      }
    ],
    "totalAmount": 1997.00,
    "paymentProofUrl": "data:image/jpeg;base64,...",
    "deliveryAddress": "123 Main St, City - 123456",
    "deliveryPhone": "9876543210",
    "deliveryName": "John Doe",
    "deliveryEmail": "john@example.com",
    "affiliateCode": "AFF123"
  }'
```

---

## Notes for Backend Team

1. **Payment Proof Storage**: Consider storing payment proof images in cloud storage (AWS S3, Azure Blob, etc.) and storing URLs in the database rather than base64 strings.

2. **Order Processing**: You may want to implement async processing for order creation, especially if you need to:
   - Send confirmation emails
   - Update inventory
   - Process affiliate commissions
   - Send notifications

3. **Validation**: Implement comprehensive validation on the backend side, even though frontend validation exists.

4. **Error Messages**: Return descriptive error messages to help with debugging:
   ```json
   {
     "error": "VALIDATION_ERROR",
     "message": "Invalid delivery phone number",
     "field": "deliveryPhone"
   }
   ```

5. **Security**: 
   - Validate that `buyerId` matches the authenticated user
   - Sanitize all input data
   - Validate image file types and sizes
   - Implement rate limiting for order creation

