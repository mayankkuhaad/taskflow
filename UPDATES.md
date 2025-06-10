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

--------------------------------------------------------------------------------------------

### ✅ HttpExceptionFilter Improvements

**Original Issues:**
- Did not differentiate between client-side and server-side errors in logs.
- Could leak sensitive stack traces or internal exception details in responses.
- Error formatting was inconsistent and simplistic.
- Lacked clear, structured logging for debugging.

**Fixes Implemented:**
- Added checks to parse both string and object responses from `exception.getResponse()`.
- Used `warn` for 4xx client errors and `error` for 5xx server errors in logging.
- Ensured the error response structure is clean, consistent, and contains:
  - `success`
  - `statusCode`
  - `timestamp`
  - `path`
  - `message`
- Prevented exposure of stack traces in responses.

**Benefits:**
- Developers and DevOps can quickly identify and differentiate error types from logs.
- Safer, consistent API responses for frontend consumers.
- Clean separation of concerns: logs are verbose, responses are minimal.

--------------------------------------------------------------------------------------------

### LoggingInterceptor
- The LoggingInterceptor was originally a basic implementation that only logged incoming request method/URL and the response time. It lacked context awareness, response logging, user tracking, and sensitive data filtering. This has now been significantly improved to meet professional production-level standards.

Key Improvements Made:

- Incoming requests now log method, URL, path parameters, query parameters, and a sanitized version of the request body.

- The interceptor now detects and logs contextual information about the authenticated user (e.g. user ID and email), if available on the req.user object.

- Sensitive data such as password, token, or similar fields are masked automatically before logging the request body.

- Outgoing responses include HTTP method, URL, response time in milliseconds, HTTP status code, and the user context.

- Improved error logging includes request context and full error details without leaking stack traces to the user.

- Enhanced readability of logs by consistently formatting all output and capturing latency with Date.now().


--------------------------------------------------------------------------------------------

### ValidationPipe
The ValidationPipe was originally functional but minimal. It only handled simple class-transformer/class-validator errors and returned plain validation messages. I've enhanced it to return structured, developer-friendly errors, while safeguarding the system from invalid or malicious inputs.

Key Improvements Made:

- The transform method now returns structured and clean validation error messages, grouped by field.

- Enhanced error clarity: instead of a flat array of error strings, I now group messages by their field names, making it easier for frontend developers and users to understand what went wrong.

- Meta type safety: skipped validation for primitive types (like String, Number, etc.) to avoid unnecessary validation overhead.

- Preserves the benefit of using DTOs by transforming plain JSON into proper class instances (plainToInstance) before validation.

- Uses a custom BadRequestException payload that matches NestJS best practices, and avoids leaking stack traces or internal validator metadata.

- Clean and readable code with strong separation of concerns: validation extraction is distinct from exception handling.