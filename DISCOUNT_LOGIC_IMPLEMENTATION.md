# Discount Logic Implementation - Backend Status

## Overview
This document outlines the backend requirements for the category-based discount logic implementation.

## Frontend Implementation Status
✅ **COMPLETED** - All frontend changes have been implemented:
- Created `utils/categoryConnection.ts` utility function
- Created `hooks/useVendorBusinessCategories.ts` hook
- Updated all product card components with new discount logic
- Updated type definitions to include category fields

## Backend Status Check

### ✅ Already Implemented

1. **Category Connection Endpoints** (`/category/findOne`)
   - ✅ Returns `category_categoryIdDetail` with `connectToDetail` (lines 201-205 in `category.service.ts`)
   - ✅ Endpoints exist for creating/deleting connections (`createCategoryConnectTo`, `deleteCategoryConnectTo`)

2. **User Business Categories** (`/user/findUnique`)
   - ✅ Returns `userBusinesCategoryDetail` with `categoryDetail` (lines 1235-1250 in `user.service.ts`)

3. **Product Data Structure**
   - ✅ Products have `categoryId` and `categoryLocation` fields in the database
   - ✅ `getAllProduct` includes `category` relation (line 4046 in `product.service.ts`)
   - ✅ `getAllProduct` includes `product_productPrice` with `consumerType` (lines 4072-4116)

### ⚠️ Potential Issues to Verify

1. **Product Response Fields**
   - **Check**: Ensure `categoryId` and `categoryLocation` are returned as **direct fields** on the product object (not just nested in `category` object)
   - **Location**: `product.service.ts` - `getAllProduct` method (line 4042-4124)
   - **Action**: Verify the Prisma query returns these fields directly from the product model

2. **ConsumerType in ProductPrice**
   - **Check**: Ensure `consumerType` is included in the `product_productPrice` array response
   - **Location**: `product.service.ts` - `getAllProduct` method (line 4072-4116)
   - **Action**: Verify `consumerType` is not filtered out and is included in the response

3. **Product Details Endpoint** (`/product/findOne` or similar)
   - **Check**: Ensure product details endpoint also returns `categoryId`, `categoryLocation`, and `consumerType`
   - **Action**: Verify all product detail endpoints include these fields

## Required Backend Changes (If Needed)

### 1. Ensure Product Responses Include Direct Fields

If `categoryId` and `categoryLocation` are not returned as direct fields, update the product queries to explicitly include them:

```typescript
// In product.service.ts - getAllProduct method
let productDetailList = await prisma.product.findMany({
  where: whereCondition,
  select: {
    // ... existing fields
    categoryId: true,  // Ensure this is included
    categoryLocation: true,  // Ensure this is included
    // ... rest of fields
  },
  // OR if using include, ensure these are at the root level
});
```

### 2. Ensure ConsumerType is Returned

Verify that `consumerType` is included in the `product_productPrice` response:

```typescript
// In product.service.ts - getAllProduct method
product_productPrice: {
  where: {
    status: 'ACTIVE',
  },
  select: {
    // ... existing fields
    consumerType: true,  // Ensure this is included
    // ... rest of fields
  },
  // ...
}
```

### 3. Update Product Details Endpoints

Ensure all product detail endpoints (like `getOneProduct`, `findOneProduct`, etc.) also return:
- `categoryId`
- `categoryLocation`
- `consumerType` (from `product_productPrice`)

## Testing Checklist

- [ ] Verify `/category/findOne?categoryId=X` returns `category_categoryIdDetail` with connections
- [ ] Verify `/user/findUnique` returns `userBusinesCategoryDetail` for vendors
- [ ] Verify `/product/getAllProduct` returns `categoryId` and `categoryLocation` as direct fields
- [ ] Verify `/product/getAllProduct` returns `consumerType` in `product_productPrice` array
- [ ] Verify product details endpoints return all required fields
- [ ] Test discount calculation with matching categories
- [ ] Test discount calculation with non-matching categories
- [ ] Test discount calculation for "EVERYONE" consumer type
- [ ] Test discount calculation for "VENDORS" consumer type
- [ ] Test discount calculation for "CONSUMER" consumer type

## Notes

- The frontend implementation assumes the backend already returns the required fields
- If fields are missing, the discount logic will fall back to the old behavior (vendor discount if available, otherwise consumer discount)
- The category connection check uses the `category_categoryIdDetail` array from the category API response

