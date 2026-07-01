## 2025-02-28 - Rate Limiting on Authentication Endpoints
**Vulnerability:** Missing rate limiting on the `/api/auth/login` endpoint allowed for unconstrained brute-force attacks against user passwords.
**Learning:** Authentication endpoints are prime targets for automated credential stuffing and brute-force attacks. Without rate limiting, attackers could attempt many passwords in a short time.
**Prevention:** Apply rate limiting middleware (`Microsoft.AspNetCore.RateLimiting`) globally or targeted via `[EnableRateLimiting]` to sensitive endpoints like login, password reset, or OTP validation to limit the frequency of requests.
## 2025-02-28 - Weak Password Bypass on Update Endpoints
**Vulnerability:** Weak password validation in the profile and user update endpoints. While the create user endpoint enforced password complexity, the update endpoints did not, allowing users to bypass password policy by updating their password to a weak one after account creation.
**Learning:** Symmetric validation logic must be applied across all entry points that modify the same data. If complexity rules are applied on creation (`CreateUserRequest`), they must also be applied on update (`UpdateUserRequest`, `UpdateProfileRequest`).
**Prevention:** Ensure that DTOs handling the same entity fields (like passwords) share the same validation attributes.
