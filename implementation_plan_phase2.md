# Implementation Plan — Phase 2: Publication Cost & Workflow Management

This plan covers all work needed to transform the AÇI ERP from a user-management-only system into a functional **Publishing Cost & Workflow Tracking** platform, inspired by the Takipaci reference application.

---

## Current State (What We Have)

| Layer | What Exists |
|-------|-------------|
| **Backend Models** | `User`, `Role` (in [ErpDbContext.cs](file:///c:/Users/ippae/Desktop/erp/backend/ErpApi/Data/ErpDbContext.cs)) |
| **Backend Controllers** | `AuthController`, `UsersController`, `RolesController` |
| **Backend Services** | `AuthService`, `UserService` |
| **Frontend Pages (in use)** | `index.html` (Dashboard), `app-user-list.html`, `app-access-roles.html`, `app-access-permission.html`, `auth-login-cover.html` |
| **Frontend Pages (template bloat)** | ~140 unused HTML files (eCommerce, Academy, Logistics, Charts, etc.) |
| **Localization** | [tr.json](file:///c:/Users/ippae/Desktop/erp/frontend/assets/json/locales/tr.json) — translates menu labels but includes many unused entries |
| **Left Menu** | Massive template default with Dashboards (5 sub-items), Layouts, Front Pages, eCommerce, Academy, Logistics, Invoice, Users, Roles & Permissions, Pages, Components, Forms & Tables, Charts & Maps |

---

## Step 0: Left Menu Cleanup & Restructuring

> [!IMPORTANT]
> This step happens **first** because every subsequent HTML page we create will include the new menu. Doing it upfront avoids duplicating the old bloated menu into new pages.

### Target Menu Structure

```
── Ana Sayfa (Dashboard)                    [ti-smart-home]
   └── index.html

── YÖNETIM (section header)
── Kullanıcı Yönetimi (User Management)    [ti-users]
   ├── Kullanıcı Listesi → app-user-list.html
   ├── Roller → app-access-roles.html
   └── Yetkiler → app-access-permission.html

── YAYINCILIK (section header)
── Yayıncılık (Publishing)                 [ti-book-2]
   ├── Maliyet & İş Takibi → pub-dashboard.html  (category selector + grid)
   ├── Ürün Yönetimi → pub-product-management.html
   ├── Fiyat Tarifesi → pub-price-tariff.html
   └── Yazar Ara → pub-author-search.html
```

### Files to Modify
- **Every active HTML page** (`index.html`, `app-user-list.html`, `app-access-roles.html`, `app-access-permission.html`): Replace the `<ul class="menu-inner">` block with the new slim menu.
- **[tr.json](file:///c:/Users/ippae/Desktop/erp/frontend/assets/json/locales/tr.json)**: Strip unused translations, add new Publishing keys (`Publishing`, `Cost & Tracking`, `Product Management`, `Price Tariff`, `Author Search`, etc.)

### What Happens to Unused Template Files?
- We will **NOT delete** them (they are part of the Sneat template and may be useful for future reference).
- They simply won't appear in the menu anymore.

---

## Step 1: Backend — Domain Models & Database

### New Models (all under `backend/ErpApi/Models/`)

#### [NEW] `Category.cs`
- `Id` (int, PK)
- `Name` (string, e.g., "SORU BANKASI", "YAPRAK TEST")
- `Icon` (string, nullable — for future menu icons)
- `SortOrder` (int)
- Navigation: `ICollection<Product> Products`

#### [NEW] `Product.cs`
- `Id` (int, PK)
- `Name` (string, e.g., "TYT KUR SB")
- `CategoryId` (int, FK → Category)
- `SortOrder` (int)
- Navigation: `Category Category`, `ICollection<ProductBranch> ProductBranches`

#### [NEW] `Branch.cs`
- `Id` (int, PK)
- `Name` (string, e.g., "Matematik", "Fizik")
- Navigation: `ICollection<ProductBranch> ProductBranches`

#### [NEW] `ProductBranch.cs` (Join Table)
- `Id` (int, PK)
- `ProductId` (int, FK → Product)
- `BranchId` (int, FK → Branch)
- Navigation: `Product Product`, `Branch Branch`, `ICollection<PublicationTask> Tasks`

#### [NEW] `TariffItem.cs`
- `Id` (int, PK)
- `Name` (string, e.g., "Geleneksel Soru", "Kavram Temelli")
- `UnitPrice` (decimal)
- `Unit` (string, e.g., "soru", "sayfa")
- `SortOrder` (int)

#### [NEW] `PublicationTask.cs`
- `Id` (int, PK)
- `ProductBranchId` (int, FK → ProductBranch)
- `AuthorId` (int?, FK → User, nullable)
- `TypesetterId` (int?, FK → User, nullable)
- **Cost Metrics**: `PageCount`, `TestCount`, `TraditionalCount`, `ConceptCount`, `ContextCount`, `TopicPageCount` (all int, default 0)
- **Workflow**: `AuthorStartDate`, `TypesetterStartDate`, `Proofread1Date`, `Proofread2Date`, `Proofread3Date` (all DateTime?, nullable)
- `Description` (string, nullable — notes/açıklama)
- Navigation: `ProductBranch ProductBranch`, `User Author`, `User Typesetter`

### Database Changes

#### [MODIFY] [ErpDbContext.cs](file:///c:/Users/ippae/Desktop/erp/backend/ErpApi/Data/ErpDbContext.cs)
- Add `DbSet` for each new entity.
- Configure relationships, indexes, and constraints in `OnModelCreating`.

#### [NEW] EF Migration
- Run `dotnet ef migrations add AddPublishingModule` and `dotnet ef database update`.

#### [NEW] `PublishingSeedData.cs`
- Seed the 6 default categories (SORU BANKASI, YAPRAK TEST, DİD, DEFTER, ÖTD, DENEME).
- Seed the default branches (Matematik, Geometri, Fizik, Kimya, Biyoloji, Türkçe, Tarih, Coğrafya, Felsefe, Din).
- Seed the default tariff items (Geleneksel Soru: 175, Kavram Temelli: 245, Bağlam Temelli: 500, Konu Anlatım Sayfa: 910, Revize: 175, Çapraz: 147, Video Çözümü: 25, ÖTD Revize: 35).

---

## Step 2: Backend — API Controllers & Services

### New Services (under `backend/ErpApi/Services/`)

#### [NEW] `CategoryService.cs`
- `GetAllAsync()` — returns categories with products and branches
- `CreateAsync()`, `DeleteAsync()`

#### [NEW] `ProductService.cs`
- `GetByCategoryAsync(categoryId)` — returns products with their branches
- `CreateAsync()`, `DeleteAsync()`
- `AddBranchAsync(productId, branchName)`
- `RemoveBranchAsync(productBranchId)`

#### [NEW] `TariffService.cs`
- `GetAllAsync()` — returns all tariff items
- `UpdateAsync(id, newPrice)` — updates a single tariff price

#### [NEW] `PublicationTaskService.cs`
- `GetByCategoryAsync(categoryId, branchFilter?, productFilter?)` — returns the task grid data
- `UpdateCostMetricsAsync(taskId, metrics)` — updates page/test/question counts
- `UpdateWorkflowAsync(taskId, workflowData)` — updates dates and assignments
- `SearchByAuthorAsync(authorName)` — search tasks by author name
- `GetCategoryTotalAsync(categoryId)` — calculates the total cost for a category
- `GetGrandTotalAsync()` — calculates the grand total across all categories

### New Controllers (under `backend/ErpApi/Controllers/`)

#### [NEW] `CategoriesController.cs`
- `GET /api/categories` — list all with nested products/branches
- `POST /api/categories` — create category (Admin+)
- `DELETE /api/categories/{id}` — delete category (Admin+)

#### [NEW] `ProductsController.cs`
- `GET /api/products?categoryId=` — list products by category
- `POST /api/products` — create product (Admin+)
- `DELETE /api/products/{id}` — delete product (Admin+)
- `POST /api/products/{id}/branches` — add branch to product (Admin+)
- `DELETE /api/products/{id}/branches/{branchId}` — remove branch (Admin+)

#### [NEW] `TariffController.cs`
- `GET /api/tariff` — list all tariff items
- `PUT /api/tariff/{id}` — update tariff price (Admin+)

#### [NEW] `PublicationTasksController.cs`
- `GET /api/tasks?categoryId=&branchId=&productId=` — get task grid
- `PUT /api/tasks/{id}/cost` — update cost metrics
- `PUT /api/tasks/{id}/workflow` — update workflow dates/assignments
- `GET /api/tasks/search?author=` — search by author
- `GET /api/tasks/totals?categoryId=` — get cost totals

---

## Step 3: Frontend — Configuration UI

### [NEW] `pub-product-management.html`
- Accordion-style interface (one accordion per Category).
- Expanding a category shows its products.
- Each product shows its branches as removable tags/chips.
- "Yeni branş ekle..." input field + "+ Branş" button per product.
- "Sil" button per product.
- "Yeni Ürün Ekle" button per category.

### [NEW] `pub-price-tariff.html`
- Table with columns: Kalem (item name), Birim Fiyat (₺), Birim (unit).
- Inline-editable price fields.
- Auto-save on blur or a "Kaydet" button.
- Footer note: "⚡ Değişiklik anında tüm hesaplamalara yansır."

### [NEW] `assets/js/erp/product-management.js`
- API calls to `CategoriesController` and `ProductsController`.
- Dynamic accordion rendering.

### [NEW] `assets/js/erp/price-tariff.js`
- API calls to `TariffController`.
- Inline edit save logic.

---

## Step 4: Frontend — Core Cost & Workflow Grid

### [NEW] `pub-dashboard.html`
This is the main working page — the heart of the system.

- **Top bar**: Category dropdown, Branch filter dropdown, Product filter dropdown.
- **Two tabs**: "Maliyet" (Cost) and "İş Takibi" (Workflow).
- **Maliyet tab**: DataTable with columns — Ürün, Branş, Yazar, Sayfa, Test, Geleneksel, Kavram, Bağlam, Konu Anl. All numeric fields are inline-editable. Yazar is a dropdown populated from the Users API.
- **İş Takibi tab**: DataTable with columns — Ürün, Branş, Yazar, Yazar Başlama, Dizgici, Dizgici Başlama, Açıklama, 1. Tashih, 2. Tashih, 3. Tashih. Date fields use date pickers. Dizgici is a dropdown from Users API.
- **Cost calculation**: Real-time. When a user changes a question count, the row's cost is recalculated using the current tariff. Category total is shown prominently.
- **Bottom bar**: Per-category subtotals + "Genel Toplam" (Grand Total).

### [NEW] `assets/js/erp/pub-dashboard.js`
- Fetches categories, products, branches, tasks, and tariff data.
- Renders DataTables with inline editing.
- Real-time cost calculation logic.
- Auto-save on cell change.

---

## Step 5: Frontend — Author Search

### [NEW] `pub-author-search.html`
- Search input with autocomplete (minimum 2 characters).
- Results table showing all tasks assigned to the matched author, across all categories.

### [NEW] `assets/js/erp/author-search.js`
- API call to `PublicationTasksController.SearchByAuthor`.
- Dynamic results rendering.

---

## Permission Model (Role-Based Visibility)

| Feature | SuperAdmin | Admin | Manager | User (Author/Typesetter) |
|---------|:----------:|:-----:|:-------:|:------------------------:|
| See Publishing menu | ✅ | ✅ | ✅ | ✅ |
| Edit Cost metrics | ✅ | ✅ | ✅ | Own tasks only |
| Edit Workflow dates | ✅ | ✅ | ✅ | ❌ |
| View Fiyat Tarifesi | ✅ | ✅ | ✅ | ❌ |
| Edit Fiyat Tarifesi | ✅ | ✅ | ❌ | ❌ |
| Ürün Yönetimi (CRUD) | ✅ | ✅ | ❌ | ❌ |
| See financial totals | ✅ | ✅ | ✅ | ❌ |
| User Management menu | ✅ | ✅ | ❌ | ❌ |

---

## Execution Order

| # | Step | Depends On |
|---|------|------------|
| 0 | Left Menu Cleanup & Restructuring | — |
| 1 | Backend Domain Models & Database Migration | — |
| 2 | Backend API Controllers & Services | Step 1 |
| 3 | Frontend: Product Management + Price Tariff UI | Steps 0, 2 |
| 4 | Frontend: Core Cost & Workflow Grid | Steps 0, 2 |
| 5 | Frontend: Author Search | Steps 0, 2 |

> Steps 0 and 1 can run in parallel. Steps 3, 4, 5 can also be built in parallel once Step 2 is complete.

---

## Verification Plan

### Automated
- `dotnet build` — ensure backend compiles.
- `dotnet ef database update` — ensure migration applies.
- Manual API testing via browser/curl for each endpoint.

### Manual Walkthrough
1. Log in → verify new slim menu renders correctly on all pages.
2. Navigate to **Ürün Yönetimi** → create a category, add products, assign branches.
3. Navigate to **Fiyat Tarifesi** → modify a price, verify it saves.
4. Navigate to **Maliyet & İş Takibi** → select a category, verify the grid loads, edit a question count, verify cost recalculates.
5. Navigate to **Yazar Ara** → search for an author, verify results show.
6. Check the **Genel Toplam** at the bottom reflects correct sums.
