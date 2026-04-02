# Vendor Storefront UI Design Specification

This document captures the current frontend UI design and behavior of the vendor storefront so it can be replicated in the Admin application with the same visual structure and interaction patterns.

Source of truth in this repo: `src/pages/Vendor/VendorStorefrontPage.tsx`

---

## 1) Page Purpose

Render a public-facing vendor storefront page that:
- shows vendor identity and trust markers,
- lists products belonging to one vendor,
- supports quick discovery via category + search + sort,
- highlights best sellers when no filters are active.

Route parameter:
- `vendorId` (required): used to filter products client-side.

---

## 2) Data Dependencies and View Model

### Data Sources
- `useRealProductsList({ page: 1, perPage: 1000 })`
- `useAllRealCategories()` -> `getMainCategories()`

### Vendor-Derived UI Model
Vendor information is derived from the first product belonging to `vendorId`:
- `name` / `businessName`: `firstProduct.storeName` fallback `"Unknown Vendor"`
- `logo` / `avatarUrl`: `firstProduct.vendorLogo`
- `location`: hardcoded `"Nigeria"` fallback

### Product Collections
- `vendorProducts`: all products where `product.vendorId === vendorId`
- `bestSellers`: up to 4 items
  - preferred: products with `flags?.bestseller`
  - fallback: first 4 `vendorProducts`
- `filteredProducts`: `vendorProducts` after category + search + sort

---

## 3) Layout Blueprint

## Top-Level Container
- Centered layout with responsive max width:
  - base: `max-w-[960px]`
  - large: `lg:max-w-7xl`
  - xxl: `2xl:max-w-[1550px]`
- Global spacing:
  - page top: `pt-8`
  - side gutters: `px-4 md:px-6`
  - bottom spacing: `pb-20`
- Base style: white background, sans font.

## Section Order (Visual Hierarchy)
1. Header Section (vendor identity + copy link action)
2. Filter Bar (product count + category + search + sort)
3. Fast Selling grid (shown only when no filters)
4. All vendor Products grid (shown only when no filters)
5. Filtered Result Grid (shown only when filters are active)

---

## 4) Header Section Design

### Structure
- Flex layout:
  - mobile: stacked (`flex-col`)
  - desktop: row with spaced ends (`md:flex-row`, `justify-between`)
- Bottom divider: `border-b border-gray-100`
- Section spacing: `pb-8 mb-8`

### Left Side: Vendor Identity Block
- Circular avatar:
  - size `w-16 h-16`, `rounded-full`, `overflow-hidden`
  - border `border-2 border-gray-100`, fallback bg `bg-gray-200`
- Avatar fallback behavior:
  - if image missing/fails, show first uppercase letter of vendor name.

### Text Stack
- Vendor name:
  - typography: `text-2xl font-bold`
  - color: `#182F38`
- Location row:
  - `MapPin` icon (3x3 equivalent via `w-3 h-3`)
  - text style: `text-sm text-gray-500`
- Trust/reputation row:
  - rating block: fixed `5.0` + filled star icon, yellow accent
  - review count: fixed `144 Reviews`
  - verification chip: check icon + `Verified` in dark green accent (`#1E4700`)

### Right Side: Primary Action
- Button text: `Copy Store Link`
- Icon: `Copy`
- Styling:
  - fill: `#8DEB6E`
  - border: `#2ac12a`
  - text color uses theme primary class
  - medium radius + hover darken
- Behavior:
  - copies canonical URL: `config.app.url + current path/query`
  - success notification: `"Store link copied to clipboard!"`
  - error notification: `"Failed to copy link. Please try again."`

---

## 5) Filter Bar Design and Behavior

### Outer Layout
- Responsive horizontal stack:
  - mobile: vertical stacked controls
  - desktop: title left, controls right
- Gap and spacing: `gap-4 mb-10`

### Left: Product Count
- Label: `Products`
- Count rendered from `filteredProducts.length`
- Count style: muted gray smaller type.

### Right Controls (in order)
1. Category dropdown
2. Search input
3. Sort toggle button

### Category Dropdown
- Button:
  - min width `160px`
  - selected state: green border + green text + `bg-green-50`
  - default state: gray border/text
- Menu:
  - absolute positioned under button
  - white panel, rounded, shadow, max height with vertical scroll
  - includes `All Categories` + one item per main category
- Interaction:
  - selecting same category toggles it off (resets to all)
  - click-outside closes menu

### Search Input
- Placeholder: `Search products...`
- Filtering:
  - case-insensitive match against `product.name`
- Visual:
  - rounded input with right-side `Search` icon
  - focused border changes to green accent (`#1E4700`)

### Sort Control
- Button label: `Sort by` + `ArrowUpDown` icon
- Cycling behavior on each click:
  - `default -> price-low -> price-high -> name -> default`
- Sorting rules:
  - `price-low`: ascending `price.current`
  - `price-high`: descending `price.current`
  - `name`: alphabetic by `name`
  - missing values fallback to `0` or empty string

---

## 6) Product Content Sections

## A) Fast Selling
Visible only when:
- `bestSellers.length > 0`
- no active category filter
- search query is empty

Design:
- Left accent bar (`w-4 h-10 bg-primary rounded`)
- Heading: `Fast Selling` (large bold type)
- Subtitle: `Popular items selling out quickly`
- Grid:
  - responsive 2 columns on small screens, 4 on large
  - product renderer: `ProductCard`
  - uses `normalizeProductImages(product)` before rendering.

## B) All vendor Products
Visible only when:
- `vendorProducts.length > 0`
- no active category filter
- search query is empty

Design:
- Same title pattern as Fast Selling with accent bar
- Heading: `All vendor Products`
- Subtitle: `Explore everything from {vendorName} Store`
- Grid:
  - same 2/4 column behavior
  - if sort != default, sorted copy of `vendorProducts`

## C) Filtered Result Grid
Visible only when:
- category is selected OR search query is not empty.

Empty result state:
- soft gray panel with dashed border
- centered search icon
- text:
  - `No products found`
  - `Try adjusting your search or filters.`
- CTA link-style button: `Clear all filters` resets category + search.

Non-empty state:
- same product grid layout as other sections.

---

## 7) Page States (Non-Content)

### Loading
- Full page white background
- centered large loading spinner.

### Error
- Full page wrapper with destructive `Alert`
- title: `Error`
- body: API error text.

### Missing `vendorId`
- Full page centered message:
  - title: `Vendor Not Found`
  - subtitle: `Invalid store link.`

### Vendor with zero products
- In-page centered text:
  - `No products found for this vendor`

---

## 8) Visual System Notes (for Admin parity)

To closely mirror storefront appearance in Admin:
- Keep exact section order and conditional rendering logic.
- Preserve spacing rhythm (`mb-8`, `mb-10`, `gap-4`, `py-2` patterns).
- Reuse color accents:
  - deep text: `#182F38`
  - dark green accent: `#1E4700`
  - CTA green: `#8DEB6E`
  - CTA border: `#2ac12a`
- Maintain icon set (Lucide): `Star`, `MapPin`, `Copy`, `CheckCircle`, `Search`, `ChevronDown`, `ArrowUpDown`.
- Reuse same card component contract (or compatible wrapper):
  - each item shaped for `ProductCard`
  - images normalized before render.

---

## 9) Replication Checklist for Admin Repo

- [ ] Route receives or derives `vendorId`.
- [ ] Product source includes `vendorId`, `storeName`, `vendorLogo`, `flags.bestseller`, `price.current`, `categoryId`, `name`.
- [ ] Vendor identity header copied with avatar fallback behavior.
- [ ] Copy link action uses Admin canonical URL policy.
- [ ] Category dropdown supports click-outside close.
- [ ] Search is case-insensitive by product name.
- [ ] Sort cycles exactly through four options.
- [ ] Fast Selling + All vendor Products visibility rules match current storefront.
- [ ] Filtered state includes empty-result panel and clear-filters CTA.
- [ ] Loading, error, missing vendorId, and no-products states are implemented.

---

## 10) Non-Functional Constraint

This document is intentionally descriptive only and introduces no runtime code changes, ensuring existing product functionality is unaffected in this repository.
