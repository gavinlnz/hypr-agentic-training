# Domain: User Management & Security

## Overview
This domain covers the authentication, authorization, and management of users within the Config Service. It is the foundation for the Admin UI and ensures secure access to configuration data.

## Entities

### User
Represents an identity capable of authenticating and performing actions.

- **Attributes**:
    - `id` (ULID): Unique identifier.
    - `email` (String): Unique email address.
    - `name` (String): Display name.
    - `password_hash` (String): BCrypt hash of the password (for local auth).
    - `role` (Enum): `Admin` or `User`.
    - `is_active` (Boolean): Soft delete / deactivation flag.
    - `last_login_at` (Timestamp): Audit trail for access.

### Refresh Token
Long-lived token used to obtain new JWT access tokens.

- **Attributes**:
    - `id` (ULID): Unique identifier.
    - `user_id` (ULID): Foreign key to User.
    - `token_hash` (String): Hash of the token value.
    - `expires_at` (Timestamp): Expiration time.
    - `is_revoked` (Boolean): Security revocation flag.

## Access Control (RBAC)

| Feature | Admin | User |
| :--- | :---: | :---: |
| **Login / Logout** | ✅ | ✅ |
| **View Applications** | ✅ | ✅ |
| **View Configurations** | ✅ | ✅ |
| **Manage Applications** (Create/Edit/Delete) | ✅ | ❌ |
| **Manage Configurations** (Create/Edit/Delete) | ✅ | ❌ |
| **Manage Users** (Invite/Deactivate/Promote) | ✅ | ❌ |
| **View Audit Logs** | ✅ | ❌ |

## Authentication Flows

### Local Authentication
1. **Login**: User submits credentials -> Server validates -> Returns JWT Access Token + Refresh Token (HttpOnly Cookie).
2. **Access**: Client sends JWT in `Authorization: Bearer` header.
3. **Refresh**: Client hits refresh endpoint -> Server validates cookie -> Returns new JWT.

### OAuth Identity (Future)
- OAuth providers (GitHub, Google) will map to a local `User` record via `email`.
- If a user authenticates via OAuth and the email exists, they are logged in.
- If the email does not exist, a new `User` record is created (defaulting to `User` role).

## Security Constraints
- **Passwords**: Never stored in plain text. Minimum complexity requirements enforced.
- **Sessions**: Stateless JWTs for API access, reference tokens (Refresh Tokens) for session management.
- **Audit**: All meaningful actions (Login, Failed Login, Create, Update, Delete) must produce an `AuditLog` entry.
