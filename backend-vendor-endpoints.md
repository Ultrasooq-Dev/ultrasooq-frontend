# Vendor Dashboard Backend API Endpoints

## Overview
This document outlines the backend API endpoints needed for the vendor dashboard functionality.

## Base URL
```
/api/order/vendor
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Get Vendor Order Statistics
**GET** `/order/vendor/order-stats`

**Description**: Get aggregated statistics for vendor orders

**Response**:
```json
{
  "status": true,
  "message": "Order statistics retrieved successfully",
  "data": {
    "totalOrders": 150,
    "pendingOrders": 25,
    "completedOrders": 120,
    "cancelledOrders": 5,
    "totalRevenue": 45000.50,
    "thisMonthOrders": 30,
    "lastMonthOrders": 28,
    "averageOrderValue": 300.00
  }
}
```

### 2. Get Vendor Recent Orders
**GET** `/order/vendor/recent-orders`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string, optional): Filter by order status
- `startDate` (string, optional): Start date (YYYY-MM-DD)
- `endDate` (string, optional): End date (YYYY-MM-DD)

**Response**:
```json
{
  "status": true,
  "message": "Recent orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": 12345,
        "orderNumber": "ORD-2024-001",
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "customerPhone": "+1234567890",
        "status": "pending",
        "totalAmount": 299.99,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "items": [
          {
            "id": 1,
            "name": "Product Name",
            "quantity": 2,
            "price": 149.99,
            "image": "https://example.com/image.jpg"
          }
        ],
        "shippingAddress": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        },
        "billingAddress": {
          "street": "123 Main St",
          "city": "New York",
          "state": "NY",
          "zipCode": "10001",
          "country": "USA"
        },
        "paymentMethod": "credit_card",
        "trackingNumber": null,
        "carrier": null,
        "notes": "Special delivery instructions"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalItems": 150,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Update Order Status
**PATCH** `/order/vendor/update-status`

**Request Body**:
```json
{
  "orderProductId": 12345,
  "status": "processing",
  "notes": "Order is being prepared for shipment"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Order status updated successfully",
  "data": {
    "orderId": 12345,
    "newStatus": "processing",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 4. Add Order Tracking
**POST** `/order/vendor/add-tracking`

**Request Body**:
```json
{
  "orderProductId": 12345,
  "trackingNumber": "1Z999AA1234567890",
  "carrier": "UPS",
  "notes": "Package shipped via UPS Ground"
}
```

**Response**:
```json
{
  "status": true,
  "message": "Tracking information added successfully",
  "data": {
    "orderId": 12345,
    "trackingNumber": "1Z999AA1234567890",
    "carrier": "UPS",
    "addedAt": "2024-01-15T12:00:00Z"
  }
}
```

## Database Schema Requirements

### Orders Table
```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id BIGINT NOT NULL,
  vendor_id BIGINT NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tracking_number VARCHAR(100),
  carrier VARCHAR(100),
  notes TEXT,
  status_notes TEXT,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_image VARCHAR(500),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

### Order Addresses Table
```sql
CREATE TABLE order_addresses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  type ENUM('shipping', 'billing') NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

## Implementation Notes

1. **Authentication**: Verify the vendor has access to the orders they're trying to manage
2. **Validation**: Validate order status transitions (e.g., can't go from delivered to pending)
3. **Notifications**: Send email/SMS notifications to customers when order status changes
4. **Audit Trail**: Log all status changes and tracking updates
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Error Handling**: Return appropriate HTTP status codes and error messages

## Status Flow
```
pending → processing → shipped → delivered
   ↓         ↓          ↓
cancelled  cancelled  cancelled
   ↓
refunded
```

## Security Considerations
1. Validate that the vendor can only access their own orders
2. Sanitize all input data
3. Use parameterized queries to prevent SQL injection
4. Implement proper CORS headers
5. Rate limit API calls per vendor
