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
