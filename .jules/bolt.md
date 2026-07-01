## 2024-06-28 - EF Core AsNoTracking for Read-Only Queries
**Learning:** EF Core's InMemoryDatabase provider might not reflect the true performance gains of `.AsNoTracking()` because it doesn't have the same tracking overhead characteristics as a real relational database provider like MySQL or SQL Server.
**Action:** While `.AsNoTracking()` is a proven best practice for read-only mapping to DTOs in EF Core, benchmarking it with an InMemory provider might be misleading or inconclusive. Rely on standard EF Core performance best practices or use a real database instance for accurate benchmarking.

## 2024-03-18 - Removing Unused SCSS Variables
**Learning:** Removing unused variables defined in `_variables-dark.scss` reduces the CSS bloat and ensures cleaner overrides.
**Action:** Always scan for redundant or unused variables (often marked by TODOs) to keep stylesheets lean and verify SCSS builds afterward.

## 2025-02-14 - Optimizing EF Core Collections Loading
**Learning:** Loading entire entity lists and related IDs into memory to do `in` or `not in` checking is a massive memory and CPU drain. Pushing the work to the SQL server using navigational properties (like `!pb.Tasks.Any()`) rather than fetching lists of IDs into memory prevents out-of-memory errors and massive data transfers.
**Action:** When filtering entities based on relationships (e.g. missing related records), never load the lists to compare them in C#. Always use LINQ methods that translate to `EXISTS` or `NOT EXISTS` SQL queries.
