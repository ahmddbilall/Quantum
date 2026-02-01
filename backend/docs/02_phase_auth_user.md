# Phase 2: Authentication & User Management

## Objective
Implement secure user registration, login, and profile management to support the frontend's requirements.

## 1. Authentication Flow
We will use **OAuth2 with Password Flow (Bearer Token)** using JWT (JSON Web Tokens).

### 1.1 Components
- **Security Utility (`core/security.py`)**:
    - `pwd_context`: Using `passlib[bcrypt]` for password hashing.
    - `create_access_token`: Generates JWTs with expiration (e.g., 30 mins).
    - `verify_password`: Checks plain password against hash.
- **Dependencies (`api/deps.py`)**:
    - `get_current_user`: Decodes JWT, fetches user from DB, handles 401 errors.
    - `get_current_active_user`: Ensures user is not deleted/suspended.
- **Social Auth**:
    - Use `google-auth-library` for validating Google ID tokens.
    - Exchange social token for internal JWT.

## 2. Data Models & Schemas

### 2.1 Pydantic Schemas (`schemas/user.py`)
- `UserCreate`: `email`, `password`, `full_name`
- `UserUpdate`: `full_name`, `password` (optional), `profile` fields.
- `UserInDB`: `id`, `email`, `hashed_password`, etc.
- `UserResponse`: `id`, `email`, `full_name`, `profile`, `preferences` (excludes password).
- `Token`: `access_token`, `token_type`.

## 3. API Endpoints (`api/endpoints/auth.py` & `users.py`)

### 3.1 Auth Router
- `POST /auth/login` (`/token`):
    - Input: `OAuth2PasswordRequestForm` (username/email, password).
    - Logic: Verify credentials -> Generate JWT.
    - Output: `Token` schema.
- `POST /auth/register`:
    - Input: `UserCreate`.
    - Logic: Check if email exists -> Hash password -> Create DB User.
    - Output: `UserResponse`.
- `POST /auth/social-login`:
    - Input: `provider` (google/github), `id_token`.
    - Logic: Validate token with provider -> Find/Create User -> Generate JWT.
    - Output: `Token`.

### 3.2 Users Router
- `GET /users/me`:
    - Dependency: `get_current_user`.
    - Output: Full user profile + preferences.
- `PATCH /users/me`:
    - Input: `UserUpdate` (JSON patch).
    - Logic: Update allowed fields (bio, phone, preferences). 
    - Note: Special handling for JSONB fields to allow partial updates (merging) if needed, or full replacement.

## 4. Specific Frontend Requirements
The frontend expects granular preferences and profile data.

- **Storage**: We use `JSONB` columns for flexibility.
    - `preferences`: Stores `{ "categories": [], "sources": [], "notifications": {...} }`.
    - `profile`: Stores `{ "bio": "...", "location": "...", "phone": "..." }`.
- **Validation**: Pydantic models will strictly validate the structure of these JSONs before saving to DB to ensure data integrity.

## 5. Implementation Checklist
- [ ] Set up `passlib` and `python-jose` (or `pyjwt`).
- [ ] Implement `core/security.py`.
- [ ] Create `api/deps.py` for auth dependency.
- [ ] Implement Login and Register endpoints.
- [ ] Implement User Profile Get/Update endpoints.
- [ ] Unit Test: Register a user, Login to get token, Access protected route.
