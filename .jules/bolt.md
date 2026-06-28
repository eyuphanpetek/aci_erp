## 2024-06-28 - EF Core AsNoTracking for Read-Only Queries
**Learning:** EF Core's InMemoryDatabase provider might not reflect the true performance gains of `.AsNoTracking()` because it doesn't have the same tracking overhead characteristics as a real relational database provider like MySQL or SQL Server.
**Action:** While `.AsNoTracking()` is a proven best practice for read-only mapping to DTOs in EF Core, benchmarking it with an InMemory provider might be misleading or inconclusive. Rely on standard EF Core performance best practices or use a real database instance for accurate benchmarking.

## 2024-03-18 - Removing Unused SCSS Variables
**Learning:** Removing unused variables defined in `_variables-dark.scss` reduces the CSS bloat and ensures cleaner overrides.
**Action:** Always scan for redundant or unused variables (often marked by TODOs) to keep stylesheets lean and verify SCSS builds afterward.
