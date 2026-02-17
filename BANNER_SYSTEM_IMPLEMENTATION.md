# Dynamic Banner System Implementation Guide

## Overview
This document provides a complete guide for implementing the dynamic banner/ad system in your Ultrasooq application. The system allows unlimited banners with full CRUD operations, scheduling, analytics, and more.

## Frontend Implementation Status
✅ **COMPLETED** - All frontend files have been created:
- `apis/requests/banner.requests.ts` - API request functions
- `apis/queries/banner.queries.ts` - React Query hooks
- `components/modules/home/HeroBanner.tsx` - Dynamic banner display component
- `utils/types/banner.types.ts` - TypeScript type definitions
- `app/home/page.tsx` - Updated to use dynamic banners

## Backend Implementation Required

### 1. Database Migration

Create a migration file to add the `banner` table:

```sql
CREATE TABLE `banner` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `image` VARCHAR(500) NOT NULL COMMENT 'URL to banner image',
  `link` VARCHAR(500) NULL COMMENT 'Redirect URL when clicked',
  `buttonText` VARCHAR(100) NULL DEFAULT 'Shop Now',
  `position` ENUM('main', 'side-top', 'side-bottom', 'full-width', 'popup') NOT NULL DEFAULT 'main',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `priority` INT NOT NULL DEFAULT 0 COMMENT 'Higher number = higher priority',
  `startDate` DATETIME NULL COMMENT 'Scheduled start date',
  `endDate` DATETIME NULL COMMENT 'Scheduled end date',
  `targetUrl` VARCHAR(500) NULL COMMENT 'Target page/category',
  `clicks` INT DEFAULT 0 COMMENT 'Click tracking',
  `views` INT DEFAULT 0 COMMENT 'View tracking',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_position` (`position`),
  INDEX `idx_isActive` (`isActive`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_dates` (`startDate`, `endDate`),
  INDEX `idx_active_position` (`isActive`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Backend API Endpoints

Implement the following endpoints in your backend:

#### GET `/api/banner/active` (Public)
- Returns all active banners filtered by date range
- Optional query param: `position` (main, side-top, side-bottom, etc.)
- Response: `{ status: true, data: IBanner[] }`
- Logic: Filter by `isActive = true` and current date between `startDate` and `endDate` (if set)
- Sort by `priority DESC`

#### GET `/api/banner` (Admin)
- Returns all banners with pagination
- Query params: `page`, `limit`, `position`
- Response: `{ status: true, data: { banners: IBanner[], total: number, page: number, limit: number } }`

#### GET `/api/banner/:id` (Admin)
- Returns single banner by ID
- Response: `{ status: true, data: IBanner }`

#### POST `/api/banner` (Admin)
- Creates a new banner
- Request body: `ICreateBanner`
- Response: `{ status: true, message: string, data: IBanner }`

#### PUT `/api/banner/:id` (Admin)
- Updates existing banner
- Request body: `Partial<ICreateBanner>`
- Response: `{ status: true, message: string, data: IBanner }`

#### DELETE `/api/banner/:id` (Admin)
- Deletes a banner
- Response: `{ status: true, message: string }`

#### PATCH `/api/banner/:id/status` (Admin)
- Toggles banner active status
- Request body: `{ isActive: boolean }`
- Response: `{ status: true, message: string, data: IBanner }`

#### PATCH `/api/banner/:id/priority` (Admin)
- Updates banner priority
- Request body: `{ priority: number }`
- Response: `{ status: true, message: string, data: IBanner }`

#### POST `/api/banner/:id/track-click` (Public)
- Tracks banner click
- Increments `clicks` counter
- Response: `{ status: true }`

#### POST `/api/banner/:id/track-view` (Public)
- Tracks banner view
- Increments `views` counter
- Response: `{ status: true }`

#### GET `/api/banner/analytics` (Admin)
- Returns banner analytics
- Response: `{ status: true, data: IBannerAnalytics }`

### 3. Backend Service Logic

#### Active Banners Filter Logic:
```typescript
// Pseudocode
const activeBanners = await db.banner.findMany({
  where: {
    isActive: true,
    AND: [
      {
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } }
        ]
      },
      {
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    ],
    ...(position ? { position } : {})
  },
  orderBy: {
    priority: 'desc'
  }
});
```

## Migration from Old System (No Data Loss)

### Option 1: Migrate Existing Page Settings Data

If you have existing banner data in `page-settings`, create a migration script:

```sql
-- If you have existing banner data in page_settings table
INSERT INTO banner (title, subtitle, image, link, buttonText, position, isActive, priority, createdAt, updatedAt)
SELECT 
  JSON_EXTRACT(settings, '$.banner1.title') as title,
  JSON_EXTRACT(settings, '$.banner1.subtitle') as subtitle,
  JSON_EXTRACT(settings, '$.banner1.image') as image,
  JSON_EXTRACT(settings, '$.banner1.link') as link,
  JSON_EXTRACT(settings, '$.banner1.buttonText') as buttonText,
  'main' as position,
  true as isActive,
  1 as priority,
  NOW() as createdAt,
  NOW() as updatedAt
FROM page_settings
WHERE JSON_EXTRACT(settings, '$.banner1.image') IS NOT NULL;

-- Repeat for banner2 and banner3 with appropriate positions
```

### Option 2: Keep Both Systems Running

1. Keep the old `/admin/page-settings/update` endpoint working
2. Add new banner endpoints alongside
3. Gradually migrate data
4. Update admin panel to use new endpoints

## Admin Panel Implementation

### Required Features:

1. **Banner List Page** (`/admin/banners`)
   - Table/grid view of all banners
   - Filters: Position, Active/Inactive, Date range
   - Search by title
   - Bulk actions: Delete, Activate, Deactivate
   - Sort by: Priority, Date, Clicks, Views
   - Drag-and-drop to reorder priority

2. **Create/Edit Banner Form**
   - Image upload with preview
   - All fields from `ICreateBanner`
   - Position selector
   - Priority slider (0-100)
   - Date range picker
   - Active toggle
   - Live preview
   - Validation

3. **Analytics Dashboard**
   - Total banners count
   - Active banners count
   - Total clicks/views
   - Click-through rate
   - Top performing banners
   - Charts/graphs

## Testing Checklist

- [ ] Backend endpoints return correct data
- [ ] Active banners filter correctly by date
- [ ] Priority sorting works
- [ ] Click/view tracking increments correctly
- [ ] Frontend displays banners correctly
- [ ] Carousel works with multiple banners
- [ ] Side banners display correctly
- [ ] No errors when no banners exist
- [ ] Image loading works
- [ ] Links redirect correctly
- [ ] Analytics endpoint returns data

## Future Enhancements

The system is designed to be extensible. Future features can include:

1. **A/B Testing**: Multiple variants per position
2. **Targeting**: Show banners based on user location, device, etc.
3. **Advanced Analytics**: Conversion tracking, revenue attribution
4. **Banner Templates**: Pre-designed templates
5. **Scheduled Publishing**: Auto-publish at specific times
6. **Multi-language Support**: Different banners per language
7. **Banner Rotation**: Weighted random rotation
8. **Performance Optimization**: Image optimization, lazy loading

## API Response Format

All endpoints should follow this format:

```typescript
// Success Response
{
  status: true,
  message: "Success message",
  data: IBanner | IBanner[] | { banners: IBanner[], total: number, page: number, limit: number }
}

// Error Response
{
  status: false,
  message: "Error message",
  error?: any
}
```

## Notes

- The frontend is ready and will work once backend endpoints are implemented
- The system gracefully handles missing banners (shows nothing)
- All API calls include proper error handling
- Click/view tracking is non-blocking
- The system is designed to scale to thousands of banners

