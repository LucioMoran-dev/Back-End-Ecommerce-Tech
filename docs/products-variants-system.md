# Products & Variants System — Backend Reference

> **Purpose:** Reference for frontend developers implementing Create/Edit flows for Products and Variants.

---

## Table of Contents
1. [Entities](#entities)
2. [Enums](#enums)
3. [DTOs — Request Bodies](#dtos--request-bodies)
4. [DTOs — Responses](#dtos--responses)
5. [API Endpoints](#api-endpoints)
6. [Business Logic](#business-logic)
7. [Relationships](#relationships)
8. [Common Errors & Validations](#common-errors--validations)

---

## Entities

### Product (`products` table)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `name` | varchar(200) | required, indexed | Unique check done in service |
| `description` | text | required | |
| `brand` | varchar(50) | required, indexed | |
| `model` | varchar(100) | nullable | |
| `basePrice` | decimal(10,2) | required | Price without variants/discounts |
| `baseStock` | integer | required | Used when `hasVariants = false` |
| `imgUrls` | text[] | default: `[]` | Array of image URLs |
| `specifications` | json | nullable | Free-form object (see Specs section) |
| `isActive` | boolean | default: `true` | Soft-delete flag |
| `hasVariants` | boolean | default: `false` | Auto-set when variants are added |
| `featured` | boolean | default: `false` | |
| `createdAt` | timestamp | auto | |
| `updatedAt` | timestamp | auto | |
| `deletedAt` | timestamp | nullable | Soft delete, hidden from queries |

**Relations:**
- `category` → ManyToOne `Category`
- `variants` → OneToMany `ProductVariant` (cascade: true)
- `files` → OneToMany `File`
- `reviews` → OneToMany `Review`
- `discounts` → OneToMany `ProductDiscount`

---

### ProductVariant (`product_variants` table)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `type` | enum `TechVariantType` | required | e.g. `ram`, `storage`, `color` |
| `name` | string(100) | required | e.g. "16GB", "512GB", "Black" |
| `description` | string(200) | nullable | |
| `priceModifier` | decimal(10,2) | default: `0` | Added to basePrice |
| `stock` | integer | default: `0` | |
| `isAvailable` | boolean | default: `true` | |
| `sortOrder` | integer | default: `0` | Display order within type group |
| `product_id` | UUID FK | required | Cascade delete from product |
| `createdAt` | timestamp | auto | |
| `updatedAt` | timestamp | auto | |

**Uniqueness rule:** Within a product, `(type + name)` must be unique.

---

### Category (`categories` table)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `category_name` | varchar(50), unique | Used as identifier in create product |

---

### ProductDiscount (`product_discounts` table)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `discountType` | `'percentage'` \| `'fixed'` | |
| `value` | decimal(10,2) | % or fixed amount |
| `startDate` | timestamp | nullable |
| `endDate` | timestamp | nullable |
| `isActive` | boolean | default: `true` |
| `product_id` | UUID FK | |

---

## Enums

### TechVariantType

```ts
enum TechVariantType {
  RAM          = 'ram',
  STORAGE      = 'storage',
  PROCESSOR    = 'processor',
  VRAM         = 'vram',
  COLOR        = 'color',
  CONNECTIVITY = 'connectivity',
  SCREEN_SIZE  = 'screen_size',
  RESOLUTION   = 'resolution',
  REFRESH_RATE = 'refresh_rate',
  WARRANTY     = 'warranty',
  CONDITION    = 'condition',
  SWITCH       = 'switch',
}
```

### DiscountType

```ts
enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED      = 'fixed',
}
```

---

## DTOs — Request Bodies

### CreateProductDto

```ts
{
  name:           string          // required, length 3–200
  description:    string          // required, length 10–500
  brand:          string          // required, length 2–50
  model?:         string          // optional, length 2–100
  basePrice:      number          // required, min 0.01
  baseStock:      number          // required, min 0
  category_name:  string          // required, length 3–50 — must match existing category
  imgUrls?:       string[]        // optional, array of URL strings
  featured?:      boolean         // optional, default false
  specifications?: object         // optional, free-form JSON (see Specs section)
  hasVariants?:   boolean         // optional, default false
  variants?:      CreateVariantDto[]  // optional, validated nested
}
```

### UpdateProductDto

Identical to `CreateProductDto` but **all fields are optional**, plus:

```ts
{
  isActive?: boolean   // optional — used to re-activate a soft-deleted product
}
```

**Sent to:** `PUT /products/:id`

---

### CreateVariantDto

```ts
{
  type:          TechVariantType  // required, must be valid enum value
  name:          string           // required, length 1–100
  description?:  string           // optional, length 0–200
  priceModifier: number           // required (can be 0 or negative)
  stock:         number           // required, min 0
  isAvailable?:  boolean          // optional, default true
  sortOrder?:    number           // optional, min 0, default 0
}
```

**Sent to:**
- Inline in `CreateProductDto.variants[]` when creating a product
- `POST /products/:id/variants` to add to an existing product
- `PUT /products/variants/:variantId` (all fields optional) to update

---

### Specifications Object (free-form JSON)

The `specifications` field accepts any JSON. Common shape used by the seed data:

```ts
{
  screenSize?:    string   // e.g. "15.6 inches"
  resolution?:    string   // e.g. "1920x1080"
  batteryLife?:   string   // e.g. "10 hours"
  weight?:        string   // e.g. "1.8 kg"
  ports?:         string   // e.g. "USB-C, HDMI, USB-A x3"
  socket?:        string   // CPU socket
  chipset?:       string
  tdp?:           string   // e.g. "65W"
  dpi?:           string   // mouse DPI
  switches?:      string   // keyboard switch type
  warranty?:      string
  dimensions?:    string
  includedItems?: string
  // ... any other custom key
}
```

---

## DTOs — Responses

### ResponseProductDto

```ts
{
  id:                  string
  name:                string
  description:         string
  brand:               string
  model?:              string
  basePrice:           number
  baseStock:           number
  finalPrice:          number        // basePrice after discount
  originalPrice:       number        // basePrice + cheapest variant priceModifier
  totalStock:          number        // sum of all variant stocks (or baseStock)
  category_name:       string
  imgUrls:             string[]      // combined imgUrls + file URLs
  specifications?:     object
  hasVariants:         boolean
  isActive:            boolean
  featured:            boolean
  variants:            ResponseVariantDto[]
  hasActiveDiscount:   boolean
  discountAmount:      number
  discountPercentage:  number | null
  discountEndDate:     Date | null
  createdAt:           Date
  updatedAt:           Date
}
```

### ResponseVariantDto

```ts
{
  id:            string
  type:          TechVariantType
  name:          string
  description?:  string
  priceModifier: number
  stock:         number
  isAvailable:   boolean
  sortOrder:     number
  createdAt:     Date
  updatedAt:     Date
}
```

### PaginatedProductsDto

```ts
{
  items: ResponseProductDto[]
  total: number
  pages: number
}
```

---

## API Endpoints

### Admin — Products (requires JWT + ADMIN role)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| `POST` | `/products` | `CreateProductDto` | `201 ResponseProductDto` | Creates product + optional variants in one transaction |
| `PUT` | `/products/:id` | `UpdateProductDto` | `200 ResponseProductDto` | Partial update |
| `DELETE` | `/products/:id` | — | `{id, message}` | Soft-delete (sets `isActive = false`) |

### Admin — Variants (requires JWT + ADMIN role)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| `POST` | `/products/:id/variants` | `CreateVariantDto` | `201 ProductVariant` | Add variant to existing product; auto-sets `hasVariants = true` |
| `PUT` | `/products/variants/:variantId` | `Partial<CreateVariantDto>` | `200 ProductVariant` | Update variant fields |
| `DELETE` | `/products/variants/:variantId` | — | `{id, message}` | If last variant removed, sets `hasVariants = false` |

### Public — Read-only

| Method | Path | Query Params | Response |
|---|---|---|---|
| `GET` | `/products` | See search params below | `PaginatedProductsDto` |
| `GET` | `/products/:id` | — | `ResponseProductDto` |
| `GET` | `/products/:id/variants-grouped` | — | `Record<TechVariantType, ResponseVariantDto[]>` |
| `GET` | `/products/featured` | `limit` (default 10) | `ResponseProductDto[]` |
| `GET` | `/products/brand/:brand` | `limit` (default 20) | `ResponseProductDto[]` |
| `GET` | `/products/category/:categoryId` | `limit` (default 20) | `ResponseProductDto[]` |
| `GET` | `/products/:id/related` | `limit` (default 6) | `ResponseProductDto[]` |
| `GET` | `/products/:id/price` | `variants` (comma-sep IDs) | `{productId, variantIds, finalPrice}` |
| `GET` | `/products/:id/stock` | `variants` (comma-sep IDs) | `{productId, variantIds, availableStock}` |
| `GET` | `/products/search/hybrid` | `q=string` | SSE stream `{source, results, message?}` |

#### Search Query Params (`GET /products`)

```
page          number    default 1
limit         number    default 10
name          string    min 3 chars
brand         string    min 2 chars
categoryId    UUID
minPrice      number    min 0
maxPrice      number    min 0
basePrice     number    triggers ±10% range search
featured      boolean
inStock       boolean
discounted    boolean
color         string
ram           string
storage       string
processor     string
vram          string
screen_size   string
resolution    string
refresh_rate  string
connectivity  string
condition     string
```

---

## Business Logic

### Creating a Product with Variants (single transaction)

1. Check `category_name` exists → `NotFoundException` if not
2. Check no product with same `name` exists → `ConflictException` if duplicate
3. Validate variants array: no two variants can share `(type + name)` → `ConflictException`
4. Creates `Product` + all `ProductVariant` records inside one DB transaction
5. If variants provided → `hasVariants` is set to `true` automatically

### Adding a Variant to Existing Product

1. Validates product exists
2. Checks uniqueness: same `(type + name)` combo cannot already exist on that product
3. Sets `product.hasVariants = true` if this is the first variant

### Removing a Variant

- If the deleted variant was the **last one**, `product.hasVariants` is set to `false`

### Price Calculation

```
base display price = basePrice + cheapest variant priceModifier
final price        = base price after discount

Discount types:
  PERCENTAGE → finalPrice = base * (1 - value/100)
  FIXED      → finalPrice = base - value
```

- `GET /products/:id/price?variants=id1,id2` calculates exact price for a variant selection
- Multiple variants of the **same type** are **not allowed** in one selection

### Stock Calculation

| Scenario | Stock returned |
|---|---|
| Product without variants | `baseStock` |
| Product with variants, no selection | Sum of all `isAvailable` variant stocks |
| Product with variants, selection provided | Minimum stock among selected variants |

### Soft Delete

`DELETE /products/:id` sets `isActive = false` — product is not physically removed.  
Re-activate with `PUT /products/:id` sending `{ isActive: true }`.

---

## Relationships

```
Product
 ├── ManyToOne  ──► Category
 ├── OneToMany  ──► ProductVariant  (cascade delete)
 ├── OneToMany  ──► File
 ├── OneToMany  ──► Review
 └── OneToMany  ──► ProductDiscount (cascade delete)

ProductVariant
 ├── ManyToOne  ──► Product
 ├── ManyToMany ──► OrderItem
 └── ManyToMany ──► CartItem
```

---

## Common Errors & Validations

| HTTP | Trigger |
|---|---|
| `400` | Validation failure (missing required field, wrong type, length out of range) |
| `404` | Product not found / Category not found / Variant not found |
| `409` | Duplicate product name / Duplicate variant `(type + name)` within product |
| `401` | Missing or invalid JWT for admin endpoints |
| `403` | Authenticated but not ADMIN role |

### Validation Pipe Config (admin create/update)

All admin POST/PUT endpoints use:
```ts
new ValidationPipe({
  whitelist: true,           // strips unknown properties
  forbidNonWhitelisted: true, // throws 400 on unknown properties
  transform: true,           // auto-converts types
})
```

---

## Frontend Form Checklist

### Create Product Form

- [ ] `name` — text input, 3–200 chars, required
- [ ] `description` — textarea, 10–500 chars, required
- [ ] `brand` — text input, 2–50 chars, required
- [ ] `model` — text input, 2–100 chars, optional
- [ ] `basePrice` — number input, min 0.01, required
- [ ] `baseStock` — number input, min 0, required (disable/hide if hasVariants)
- [ ] `category_name` — select from `GET /categories`, required
- [ ] `imgUrls` — multi-URL input or file upload, optional
- [ ] `featured` — checkbox, optional
- [ ] `hasVariants` — checkbox; when checked, show variants section
- [ ] `specifications` — key-value editor or JSON textarea, optional
- [ ] `variants[]` — dynamic list (see Variant Form below)

### Create / Edit Variant Form (per variant row)

- [ ] `type` — select from `TechVariantType` enum values, required
- [ ] `name` — text input, 1–100 chars, required
- [ ] `description` — text input, 0–200 chars, optional
- [ ] `priceModifier` — number input (allows negatives), required
- [ ] `stock` — number input, min 0, required
- [ ] `isAvailable` — checkbox, default true
- [ ] `sortOrder` — number input, min 0, optional

### Edit Product Form

Same as Create but:
- Pre-populate all fields from `ResponseProductDto`
- Show `isActive` toggle to re-activate soft-deleted products
- Variants managed separately via individual PUT/DELETE calls
- Add new variants via `POST /products/:id/variants`

---

## File locations

| File | Path |
|---|---|
| Product entity | [src/modules/products/entities/products.entity.ts](../src/modules/products/entities/products.entity.ts) |
| Variant entity | [src/modules/products/entities/products_variant.entity.ts](../src/modules/products/entities/products_variant.entity.ts) |
| Enums | [src/modules/products/enum/product.enum.ts](../src/modules/products/enum/product.enum.ts) |
| Create DTO | [src/modules/products/dto/product.create.dto.ts](../src/modules/products/dto/product.create.dto.ts) |
| Response DTO | [src/modules/products/dto/product.response.dto.ts](../src/modules/products/dto/product.response.dto.ts) |
| Variant DTO | [src/modules/products/dto/product.variant.dto.ts](../src/modules/products/dto/product.variant.dto.ts) |
| Search Query DTO | [src/modules/products/dto/PaginationQueryDto.ts](../src/modules/products/dto/PaginationQueryDto.ts) |
| Interfaces | [src/modules/products/interface/products.interface.ts](../src/modules/products/interface/products.interface.ts) |
| Controller | [src/modules/products/products.controller.ts](../src/modules/products/products.controller.ts) |
| Service | [src/modules/products/products.service.ts](../src/modules/products/products.service.ts) |
| Validator/Mapper | [src/modules/products/validate/products.validate.ts](../src/modules/products/validate/products.validate.ts) |
| Module | [src/modules/products/products.module.ts](../src/modules/products/products.module.ts) |
