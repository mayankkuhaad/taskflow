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

--------------------------------------------------------------------------------------------

###  CacheService Refactor

❌ Problems in Original Implementation
Used an in-memory object → not scalable for production or distributed apps.

No TTL/expiration → memory bloat and stale data risk.

No serialization logic for objects → unpredictable caching behavior.

No environment control or namespace support.

Difficult to test or mock in isolation.

✅ Improvements Implemented
Integrated Redis for all caching operations using centralized RedisProvider.

Abstracted key prefixing and JSON (de)serialization within service methods.

Added support for TTL (setWithTTL) for expirable caching.

Used generic typing (T) for type-safe value parsing.

Designed fail-safe methods: gracefully handles Redis downtime.

Structured for plug-and-play use across services/controllers.

🧠 Why This Matters
Enables production-grade, distributed caching.

Improves app performance with data reuse (e.g., expensive DB queries).

Prevents memory leaks and stale data via TTL.

Centralizes Redis logic, easing future enhancements (e.g., compression, metrics).

--------------------------------------------------------------------------------------------

### Auth Module Enhancements

✅ Features Implemented
JWT-based authentication using @nestjs/jwt, Passport, and JwtStrategy.

Secure password storage and verification via bcrypt.

Clean login and registration flows with structured responses.

Added role-based payloads in JWT for future access control.

Fully integrated with UsersModule for user persistence and lookup.

🔐 Security Considerations
Centralized token configuration (JWT_SECRET, JWT_EXPIRATION) via ConfigService.

Guards and strategies prevent access to unauthorized or inactive users.

Passwords never returned in responses, and are securely hashed before storage.

Authenticated users can only act within the bounds of their assigned role.

⚠️ Known/Resolved Issues
❗ Consistency in token naming (token vs access_token) standardized

❗ Generalized login error message to prevent information disclosure

✅ validateUserRoles() function implemented with proper role checks

✅ Strategy handles token validation and gracefully throws UnauthorizedException if the user is deleted or inactive


--------------------------------------------------------------------------------------------


### Users Module Enhancements

✅ Major Improvements
🛡️ Role-Based Access Control (RBAC)
Implemented @Roles('admin') decorator and RolesGuard to restrict certain actions (like delete) to admins only.

Ensured proper exception handling with meaningful messages (e.g., Forbidden or Unauthorized).

🔐 Secure Authenticated Routes
Integrated JwtAuthGuard to protect routes like findAll, findOne, update, and delete.

Added user context validation in findOne: only admin or the user themselves can access the resource.

🚫 Prevent Self-Deletion
Admins are not allowed to delete their own account.

Throws BadRequestException with a clear message.

🧼 Consistent Response Formatting
Introduced UserResponseDto to serialize users and avoid leaking sensitive fields (like password, refreshToken).

Ensures all outgoing responses from the controller are clean and structured.

🔍 Improved Controller Logic
Applied ClassSerializerInterceptor globally to auto-transform entity responses.

Injected and typed the @Request() object to safely access req.user.

👤 User Creation & Update Enhancements
Passwords are hashed using bcrypt before storing.

Optional password update is conditionally hashed.

Used DTO validation and transformation with ValidationPipe.

🧪 Stability & Testability
Services are now deterministic and easily testable.

Clean separation between controller logic (access control, formatting) and service logic (persistence, validation).

--------------------------------------------------------------------------------------------

### Tasks Module Enhancements
🧠 Summary
The TasksModule was significantly enhanced to support robust task management, filtering, scheduling, and queue-based processing. Refactors focused on clean architecture, validation, rate limiting, and scalable persistence using Redis and BullMQ.

📌 Key Enhancements
📝 Create Task (POST /tasks)
✅ Validates against duplicate tasks with same title and due date for a user.

✅ Parses ISO strings into Date objects for dueDate.

✅ Automatically enqueues tasks to BullMQ (taskQueue) with deduplication (jobId: task-{id}) and cleanup policies (removeOnComplete, removeOnFail).

✅ Secure user association via userId.

📋 Get Tasks with Filters (GET /tasks)
✅ Supports filters: status, priority, search, dueDateBefore, dueDateAfter.

✅ Implements pagination with page and limit.

✅ Ensures tasks are scoped to the authenticated user.

✅ Uses createQueryBuilder for advanced SQL filtering and efficient querying.

✅ Includes relation to assignee (if exists) using leftJoinAndSelect.

🔄 Update Task Status (PATCH /tasks/:id/status)
✅ Allows authenticated users to update status of their own tasks.

✅ Enforces ownership check before allowing updates.

✅ Throws appropriate exceptions (NotFoundException, ForbiddenException) for invalid access.

✅ Clean response structure using TaskResponseDto.

✅ DTO Validation
All DTOs (CreateTaskDto, UpdateTaskStatusDto, TaskFilterDto) use class-validator and class-transformer.

ValidationPipe ensures safe transformation and readable error feedback to the client.

📦 Task Queue Integration (BullMQ)
✅ Tasks are queued asynchronously for background processing.

✅ Deduplicates jobs using Redis jobId.

✅ Cleans up completed jobs automatically.

✅ Supports retry strategy for failed jobs (removeOnFail: { count: 3 }).

⚙️ Redis-Based Rate Limiting
✅ @RateLimit() decorator used on sensitive endpoints.

✅ Implements atomic Redis operations (INCR, EXPIRE) for accurate throttling.

✅ SHA256-hashes IPs to protect user privacy.

✅ Clean exception thrown (TooManyRequestsException) with safe message.

🔐 Access Control & Ownership
All task actions are protected by JwtAuthGuard.

Task updates/deletion are restricted to the task owner only.

Admin-level logic is ready to be added if required later.

🧼 Response Formatting & DTOs
All endpoints return consistent structure:

json
Copy
Edit
{
  "success": true,
  "message": "Task status updated successfully",
  "data": { ... }
}
DTOs exclude sensitive or unnecessary internal fields.

toTaskResponseDto() used to format task entities cleanly.

✅ Exception Handling
Used global HttpExceptionFilter for consistent error responses.

Custom error messages used instead of raw database errors or stack traces.

--------------------------------------------------------------------------------------------

### CACHE SERVICE

Added Overdue Tasks Processing via BullMQ & Scheduled Jobs

Created OverdueTasksService

Scheduled with @Cron (every hour) to check for overdue tasks.

First attempts to retrieve from cache (CacheService).

Falls back to DB query if cache is empty.

Enqueues notification jobs for overdue tasks via BullMQ (task-processing queue).

Enhanced TaskProcessorService

Handles multiple job types via BullMQ Worker:

task-status-update: Updates task status using TasksService.

overdue-tasks-notification: Fetches and sends overdue task notifications to assignees.

Added robust logging and validation for each job type.

Introduced a synthetic SYSTEM_USER to use for system-initiated updates.

Dependencies:

Injected TasksService into TaskProcessorService.

Injected CacheService and TasksRepository into OverdueTasksService.

Registered task-processing queue via BullMQ.

### ✅ Common Module Enhancements

- **HttpExceptionFilter**: Added global error logging with structured response format.
- **RateLimitGuard**: Rate limiting per-IP using Redis and `@RateLimit()` decorator.
- **LoggingInterceptor**: Unified logging for requests and responses, with redacted sensitive data.
- **ValidationPipe**: Strong DTO validation using class-validator (global via `main.ts`).
- **CacheService**: Custom wrapper for Redis with namespacing, error safety, and logging.
- **CommonModule**: New module to bundle all shared services, interceptors, guards, and filters.

