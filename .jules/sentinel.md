## 2025-02-28 - Rate Limiting on Authentication Endpoints
**Vulnerability:** Missing rate limiting on the `/api/auth/login` endpoint allowed for unconstrained brute-force attacks against user passwords.
**Learning:** Authentication endpoints are prime targets for automated credential stuffing and brute-force attacks. Without rate limiting, attackers could attempt many passwords in a short time.
**Prevention:** Apply rate limiting middleware (`Microsoft.AspNetCore.RateLimiting`) globally or targeted via `[EnableRateLimiting]` to sensitive endpoints like login, password reset, or OTP validation to limit the frequency of requests.
