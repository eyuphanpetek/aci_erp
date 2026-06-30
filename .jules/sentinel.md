## 2026-06-30 - [Rate Limiting on Login]
**Vulnerability:** [Missing rate limiting on the /api/Auth/login endpoint, leading to brute-force vulnerability]
**Learning:** [ASP.NET Core's built-in RateLimiting middleware allows easily setting up IP-partitioned rate limits. Need to ensure to use partitioned limiters rather than global ones to avoid Denial of Service issues.]
**Prevention:** [Always check that rate limiting is configured correctly using RateLimitPartition.GetFixedWindowLimiter to apply per-client, not globally.]
