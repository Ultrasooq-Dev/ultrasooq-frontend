# Comprehensive Notification System Implementation Guide

This document outlines the complete notification system implementation covering all scenarios where customers and vendors should be notified.

## Notification Types

The system supports the following notification types:

1. **ORDER** - Order-related notifications
2. **MESSAGE** - Chat/message notifications
3. **RFQ** - RFQ quote notifications
4. **REVIEW** - Product review notifications
5. **SYSTEM** - System-wide notifications
6. **PAYMENT** - Payment-related notifications
7. **SHIPMENT** - Shipping/delivery notifications
8. **ACCOUNT** - Account-related notifications
9. **PRODUCT** - Product-related notifications (NEW)
10. **BUYGROUP** - Buygroup sale notifications (NEW)
11. **STOCK** - Stock level notifications (NEW)
12. **PRICE** - Price change notifications (NEW)

## Notification Scenarios

### 1. Order Notifications

#### For Vendors:
- ✅ **New Order Received** - When a buyer places an order
- ✅ **Order Status Changed** - When buyer changes order status

#### For Buyers:
- ✅ **Order Confirmed** - When vendor confirms the order
- ✅ **Order Shipped** - When vendor ships the order
- ✅ **Order Delivered** - When order is delivered
- ✅ **Order Cancelled** - When order is cancelled
- ✅ **Payment Received** - When payment is processed
- ✅ **Payment Failed** - When payment fails
- ✅ **Refund Processed** - When refund is processed

**Backend Implementation:**
- Already implemented in `backend/src/order/order.service.ts`
- Add payment and refund notifications in payment service

### 2. Buygroup Sale Notifications

#### For Buyers (who have product in wishlist or viewed):
- ⏰ **Sale Coming Soon** - 24h, 12h, 1h before sale starts
- 🔥 **Sale Started** - When buygroup sale starts
- ⏰ **Sale Ending Soon** - 1h, 30m, 10m before sale ends
- ❌ **Sale Ended** - When sale ends

**Backend Implementation Required:**

```typescript
// backend/src/product/product.service.ts

// Add method to get users who should receive buygroup notifications
async getUsersForBuygroupNotification(productPriceId: number): Promise<number[]> {
  // Get users who:
  // 1. Have product in wishlist
  // 2. Have viewed the product recently
  // 3. Have purchased similar products
  // 4. Have subscribed to product notifications
  
  const wishlistUsers = await this.prisma.productWishlist.findMany({
    where: { productPriceId },
    select: { userId: true },
    distinct: ['userId'],
  });
  
  // Add other user sources...
  
  return wishlistUsers.map(u => u.userId);
}

// Schedule buygroup notifications
async scheduleBuygroupNotifications(productPriceId: number) {
  const productPrice = await this.prisma.productPrice.findUnique({
    where: { id: productPriceId },
    include: { product: true },
  });
  
  if (!productPrice || productPrice.sellType !== 'BUYGROUP') return;
  
  const startTime = new Date(`${productPrice.dateOpen} ${productPrice.startTime}`);
  const endTime = new Date(`${productPrice.dateClose} ${productPrice.endTime}`);
  
  const users = await this.getUsersForBuygroupNotification(productPriceId);
  
  // Schedule notifications
  const notifications = [
    // Coming soon: 24h, 12h, 1h before
    { time: startTime - 24*60*60*1000, type: 'coming_soon_24h' },
    { time: startTime - 12*60*60*1000, type: 'coming_soon_12h' },
    { time: startTime - 1*60*60*1000, type: 'coming_soon_1h' },
    // Started
    { time: startTime, type: 'started' },
    // Ending soon: 1h, 30m, 10m before
    { time: endTime - 1*60*60*1000, type: 'ending_soon_1h' },
    { time: endTime - 30*60*1000, type: 'ending_soon_30m' },
    { time: endTime - 10*60*1000, type: 'ending_soon_10m' },
  ];
  
  // Use a job scheduler (e.g., Bull, Agenda) to schedule these
  for (const notification of notifications) {
    for (const userId of users) {
      await this.scheduleNotification({
        userId,
        type: NotificationType.BUYGROUP,
        scheduledTime: notification.time,
        // ... notification data
      });
    }
  }
}
```

**Cron Job Setup:**
```typescript
// backend/src/scheduler/buygroup-notifications.scheduler.ts
@Injectable()
export class BuygroupNotificationScheduler {
  constructor(
    private notificationService: NotificationService,
    private productService: ProductService,
  ) {}

  @Cron('*/5 * * * *') // Run every 5 minutes
  async checkBuygroupSales() {
    // Get all active buygroup sales
    const buygroupSales = await this.productService.getActiveBuygroupSales();
    
    for (const sale of buygroupSales) {
      await this.checkAndSendNotifications(sale);
    }
  }
  
  async checkAndSendNotifications(sale: any) {
    const now = Date.now();
    const startTime = new Date(`${sale.dateOpen} ${sale.startTime}`).getTime();
    const endTime = new Date(`${sale.dateClose} ${sale.endTime}`).getTime();
    
    // Check for coming soon (1 hour before)
    if (now >= startTime - 60*60*1000 && now < startTime) {
      await this.sendComingSoonNotification(sale);
    }
    
    // Check for started
    if (now >= startTime && now < startTime + 5*60*1000) {
      await this.sendStartedNotification(sale);
    }
    
    // Check for ending soon
    const endingTimes = [60*60*1000, 30*60*1000, 10*60*1000];
    for (const timeBefore of endingTimes) {
      if (now >= endTime - timeBefore && now < endTime - timeBefore + 5*60*1000) {
        await this.sendEndingSoonNotification(sale, timeBefore);
      }
    }
  }
}
```

### 3. Stock Notifications

#### For Buyers (who have product in wishlist):
- 📦 **Product Out of Stock** - When product stock reaches 0
- ✅ **Product Back in Stock** - When product is restocked
- ⚠️ **Low Stock Alert** - When stock is below threshold (e.g., 10 items)

**Backend Implementation:**

```typescript
// backend/src/product/product.service.ts

async updateProductStock(productPriceId: number, newStock: number) {
  const productPrice = await this.prisma.productPrice.findUnique({
    where: { id: productPriceId },
    include: { product: true },
  });
  
  const oldStock = productPrice.stock;
  
  // Update stock
  await this.prisma.productPrice.update({
    where: { id: productPriceId },
    data: { stock: newStock },
  });
  
  // Check for stock notifications
  if (oldStock > 0 && newStock === 0) {
    // Out of stock
    await this.notifyProductOutOfStock(productPriceId);
  } else if (oldStock === 0 && newStock > 0) {
    // Back in stock
    await this.notifyProductBackInStock(productPriceId, newStock);
  } else if (newStock > 0 && newStock <= 10 && oldStock > 10) {
    // Low stock
    await this.notifyProductLowStock(productPriceId, newStock);
  }
}

async notifyProductOutOfStock(productPriceId: number) {
  const wishlistUsers = await this.prisma.productWishlist.findMany({
    where: { productPriceId },
    select: { userId: true },
    distinct: ['userId'],
  });
  
  for (const user of wishlistUsers) {
    await this.notificationService.createNotification({
      userId: user.userId,
      type: NotificationType.STOCK,
      title: "Product Out of Stock",
      message: `${productPrice.product.productName} is now out of stock.`,
      data: { productId: productPrice.productId, productPriceId },
      link: `/trending/${productPrice.productId}`,
    });
  }
}
```

### 4. Price Change Notifications

#### For Buyers (who have product in wishlist):
- 📊 **Price Changed** - When product price changes
- 💰 **Price Drop** - When price decreases (special highlight)

**Backend Implementation:**

```typescript
async updateProductPrice(productPriceId: number, newPrice: number) {
  const productPrice = await this.prisma.productPrice.findUnique({
    where: { id: productPriceId },
    include: { product: true },
  });
  
  const oldPrice = productPrice.offerPrice;
  
  // Update price
  await this.prisma.productPrice.update({
    where: { id: productPriceId },
    data: { offerPrice: newPrice },
  });
  
  // Notify price change
  if (oldPrice !== newPrice) {
    await this.notifyPriceChange(productPriceId, oldPrice, newPrice);
  }
}

async notifyPriceChange(productPriceId: number, oldPrice: number, newPrice: number) {
  const wishlistUsers = await this.prisma.productWishlist.findMany({
    where: { productPriceId },
    select: { userId: true },
    distinct: ['userId'],
  });
  
  const isPriceDrop = newPrice < oldPrice;
  
  for (const user of wishlistUsers) {
    await this.notificationService.createNotification({
      userId: user.userId,
      type: NotificationType.PRICE,
      title: isPriceDrop ? "Price Drop!" : "Price Changed",
      message: isPriceDrop
        ? `Great news! The price has dropped to ${newPrice}`
        : `The price has changed from ${oldPrice} to ${newPrice}`,
      data: { productPriceId, oldPrice, newPrice, isPriceDrop },
      link: `/trending/${productPrice.productId}`,
    });
  }
}
```

### 5. RFQ Notifications

#### For Vendors:
- 📝 **New RFQ Received** - When buyer submits RFQ

#### For Buyers:
- ✅ **RFQ Quote Submitted** - When quote is submitted
- ✅ **RFQ Quote Accepted** - When vendor accepts quote
- ❌ **RFQ Quote Rejected** - When vendor rejects quote

**Backend Implementation:**

```typescript
// backend/src/rfq/rfq.service.ts

async createRfqQuote(data: CreateRfqQuoteDto) {
  const rfqQuote = await this.prisma.rfqQuotes.create({ data });
  
  // Notify vendors
  const vendors = await this.getVendorsForRfq(rfqQuote.rfqId);
  for (const vendor of vendors) {
    await this.notificationService.createNotification({
      userId: vendor.id,
      type: NotificationType.RFQ,
      title: "New RFQ Request",
      message: "You have received a new RFQ request",
      data: { rfqId: rfqQuote.rfqId },
      link: `/seller-rfq-request`,
    });
  }
  
  // Notify buyer
  await this.notificationService.createNotification({
    userId: rfqQuote.buyerId,
    type: NotificationType.RFQ,
    title: "RFQ Quote Submitted",
    message: "Your RFQ quote has been submitted successfully",
    data: { rfqId: rfqQuote.rfqId },
    link: `/rfq-quotes`,
  });
  
  return rfqQuote;
}

async updateRfqRequestStatus(rfqRequestId: number, status: 'APPROVED' | 'REJECTED') {
  const rfqRequest = await this.prisma.rfqPriceRequest.update({
    where: { id: rfqRequestId },
    data: { status },
    include: { rfqQuotesProduct: { include: { rfqQuotes: true } } },
  });
  
  const buyerId = rfqRequest.rfqQuotesProduct.rfqQuotes.buyerId;
  
  await this.notificationService.createNotification({
    userId: buyerId,
    type: NotificationType.RFQ,
    title: status === 'APPROVED' ? "RFQ Quote Accepted" : "RFQ Quote Rejected",
    message: status === 'APPROVED'
      ? "Your RFQ quote has been accepted by the buyer"
      : "Your RFQ quote has been rejected",
    data: { rfqRequestId, rfqId: rfqRequest.rfqQuotesProduct.rfqQuotesId },
    link: `/rfq-quotes`,
  });
}
```

### 6. Review Notifications

#### For Vendors:
- ⭐ **New Review Received** - When buyer leaves a review

**Backend Implementation:**

```typescript
// backend/src/review/review.service.ts

async createReview(data: CreateReviewDto) {
  const review = await this.prisma.productReview.create({ data });
  
  // Get product owner
  const product = await this.prisma.product.findUnique({
    where: { id: data.productId },
    include: { product_productPrice: { include: { seller: true } } },
  });
  
  const vendorId = product.product_productPrice[0]?.seller?.userId;
  
  if (vendorId) {
    await this.notificationService.createNotification({
      userId: vendorId,
      type: NotificationType.REVIEW,
      title: "New Review",
      message: `You have received a new review for ${product.productName}`,
      data: { productId: product.id, reviewId: review.id },
      link: `/trending/${product.id}#reviews`,
    });
  }
  
  return review;
}
```

### 7. Message/Chat Notifications

#### For Both:
- 💬 **New Message Received** - When new message arrives

**Backend Implementation:**
- Already handled in chat gateway via socket.io
- Add database notification for offline users

### 8. Account/System Notifications

#### For Users:
- ✅ **Account Verified** - When account is verified
- 🔄 **Account Status Changed** - When account status changes
- 🔒 **Password Changed** - When password is changed
- 👤 **Profile Updated** - When profile is updated
- 👥 **Team Member Added** - When team member is added
- 👥 **Team Member Removed** - When team member is removed
- 🔐 **Permission Changed** - When permissions change

**Backend Implementation:**

```typescript
// Add to respective services (auth, user, team, etc.)

async verifyAccount(userId: number) {
  // ... verification logic
  
  await this.notificationService.createNotification({
    userId,
    type: NotificationType.ACCOUNT,
    title: "Account Verified",
    message: "Your account has been verified successfully",
    link: `/profile`,
  });
}
```

## Frontend Integration

The frontend notification system is already set up with:
- `NotificationContext` - Manages notification state
- `NotificationBell` - Displays notification icon with badge
- `NotificationDropdown` - Shows recent notifications
- `/notifications` page - Full notification list

## Testing Checklist

- [ ] Order notifications (vendor and buyer)
- [ ] Buygroup sale notifications (coming soon, started, ending soon)
- [ ] Stock notifications (out of stock, back in stock, low stock)
- [ ] Price change notifications
- [ ] RFQ notifications (new, submitted, accepted, rejected)
- [ ] Review notifications
- [ ] Message notifications
- [ ] Account notifications

## Next Steps

1. **Backend Implementation:**
   - Add notification creation methods to all relevant services
   - Set up cron job for buygroup sale notifications
   - Add stock monitoring in product service
   - Add price change monitoring in product service

2. **Database:**
   - Ensure Notification table exists (already created)
   - Add indexes for performance

3. **Testing:**
   - Test all notification scenarios
   - Verify real-time delivery via socket.io
   - Test notification preferences

4. **Optimization:**
   - Batch notifications where possible
   - Add notification preferences/permissions
   - Add email notification support
   - Add push notification support
