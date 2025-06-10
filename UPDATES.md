## ✅ RateLimitGuard (Redis-based)

### Summary
Rewrote the legacy in-memory rate limiter using Redis to ensure scalability, performance, and security in distributed environments.

### Issues in Original Implementation
- Used in-memory object for tracking requests → not scalable
- Raw IPs stored → privacy/security issue
- Memory grew indefinitely → no cleanup
- Filter logic on arrays → inefficient
- Rate-limit decorator didn’t work
- No central config or testing flexibility

### Improvements Made
- ✅ Replaced in-memory logic with Redis (via central RedisProvider)
- ✅ Added SHA-256 hashing of IP addresses to anonymize and secure identifiers
- ✅ Used Redis `INCR` and `EXPIRE` for atomic request counting and TTL
- ✅ Added functional `@RateLimit(limit, windowMs)` decorator using Reflector
- ✅ Sanitized error messages, removed internal details and raw IPs
- ✅ Centralized config and scalable logic usable across services
- ✅ Final code supports production-grade rate limiting in multi-instance environments

--------------------------------------------------------------------------------------------


## ✅ RolesGuard Enhancements

### 📄 File: `src/common/guards/role.guard.ts`

### ❌ Problems with Original Code

- No validation if `user` or `user.role` is undefined.
- Returns `false` silently — leads to ambiguous access denial.
- No logging or exceptions for unauthorized access.
- No extensibility or helpful error messages.

### ✅ Fixes Applied

- Added `ForbiddenException` with meaningful messages for missing or unauthorized roles.
- Added type annotation for request (`Request` from Express).
- Enhanced logic to allow graceful fallback if roles are not required.
- Improved readability and guard structure.

### 🔐 Why This Matters

- Proper error messages improve debugging and API consumer experience.
- Cleaner, extensible code allows adding advanced role-based logic in the future (e.g., hierarchical roles, permissions).