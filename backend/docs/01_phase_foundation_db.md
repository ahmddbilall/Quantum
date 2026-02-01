# Phase 1: Foundation & Database Setup

## Objective
Establish the core backend structure, configure the FastAPI application, and set up the PostgreSQL database with `pgvector` for efficient similarity search.

## 1. Directory Structure
We will adopt a modular, service-based architecture to ensure scalability and maintainability.

```
backend/
├── app/
│   ├── api/                # API Routes (Controllers)
│   │   ├── __init__.py
│   │   └── deps.py         # Dependencies (DB session, Current User)
│   ├── core/               # Configuration & Security
│   │   ├── config.py       # Pydantic Settings (Env vars)
│   │   ├── security.py     # JWT & Password Hashing utils
│   │   └── database.py     # SQLAlchemy Session setup
│   ├── db/                 # Database Artifacts
│   │   ├── base.py         # Import all models here for Alembic
│   │   └── session.py      # SessionLocal factory
│   ├── models/             # SQLAlchemy ORM Models
│   │   ├── user.py
│   │   ├── article.py
│   │   ├── chat.py
│   │   └── interaction.py  # Bookmarks, Watchlist
│   ├── schemas/            # Pydantic Schemas (Request/Response)
│   │   ├── user.py
│   │   ├── article.py
│   │   └── ...
│   ├── services/           # Business Logic Layer
│   │   └── base.py
│   └── main.py             # App Entrypoint
├── migrations/             # Alembic Migrations
├── scripts/
│   └── init_db.py          # Initial DB seeding
├── .env
├── alembic.ini
└── requirements.txt
```

## 2. Database Schema (PostgreSQL 15+)

We will use the `pgvector` extension. Ensure the database user has superuser privileges or the extension is already enabled.

### 2.1 Extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2.2 Tables

#### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, Defaults to uuid4 | Unique User ID |
| `email` | String | Unique, Not Null, Index | User login email |
| `hashed_password` | String | Not Null | Bcrypt/Argon2 hash |
| `full_name` | String | Nullable | Display name |
| `is_active` | Boolean | Default True | Soft delete status |
| `is_superuser` | Boolean | Default False | Admin privileges |
| `created_at` | DateTime | Default Now | |
| `preferences` | JSONB | Default `{}` | News categories, sources, language |
| `profile` | JSONB | Default `{}` | Bio, location, phone, avatar_url |

#### `articles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Unique Article ID |
| `title` | String | Not Null | Headline |
| `summary` | Text | Nullable | Short description |
| `content` | Text | Nullable | Full body text |
| `url` | String | Unique, Not Null, Index | Original Source URL |
| `source` | String | Not Null, Index | Publisher (BBC, CNN, etc) |
| `category` | String | Index | Topic category |
| `published_at` | DateTime | Index | Publication time |
| `image_url` | String | Nullable | Thumbnail |
| `author` | String | Nullable | |
| `language` | String | Default 'en' | |
| `views` | Integer | Default 0 | Internal view counter |
| `sentiment_score` | Float | Nullable | AI analyzed sentiment (-1 to 1) |
| `sentiment_label` | String | Nullable | Enum: 'positive', 'negative', 'neutral' |
| `tags` | ARRAY(String) | Default `{}` | Keywords/Tags for UI filtering |

#### `article_embeddings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `article_id` | UUID | PK, FK(`articles.id`) | One-to-one mapping |
| `embedding` | Vector(768) | Not Null | `bge-base-en-v1.5` dimension |

*Index*: create an `hnsw` index on `embedding` for cosine similarity.

#### `chats`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | FK(`users.id`), Index | Owner |
| `title` | String | | Chat session title |
| `created_at` | DateTime | | |
| `updated_at` | DateTime | | Last message time |

#### `messages`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `chat_id` | UUID | FK(`chats.id`), Index | Parent chat |
| `role` | String | Not Null | 'user', 'assistant', 'system' |
| `content` | Text | Not Null | Message body |
| `created_at` | DateTime | Index | Ordering |

#### `bookmarks`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | UUID | PK, FK(`users.id`) | Composite PK |
| `article_id` | UUID | PK, FK(`articles.id`) | Composite PK |
| `created_at` | DateTime | | |

#### `watchlist`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | FK(`users.id`), Index | |
| `symbol` | String | Not Null | Ticker (e.g., AAPL) |
| `asset_type` | String | Not Null | 'STOCK' or 'CRYPTO' |
| `name` | String | Nullable | Company/Coin name |
| `created_at` | DateTime | | |

#### `market_quotes`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `symbol` | String | PK | Ticker symbol |
| `price` | Float | Not Null | Current price |
| `change` | Float | Not Null | Price change |
| `change_percent` | Float | Not Null | Percentage change |
| `updated_at` | DateTime | Not Null | Last fetch timestamp |

## 3. Technology Stack Requirements
- **FastAPI**: Web framework.
- **SQLAlchemy 2.0+**: Async ORM.
- **Alembic**: Database migrations.
- **Pydantic v2**: Data validation.
- **Asyncpg**: High-performance Async PostgreSQL driver.
- **Pgvector**: Vector similarity support.

## 4. Implementation Checklist
- [ ] Install dependencies.
- [ ] Configure `app/core/config.py` with Pydantic Settings.
- [ ] Setup `app/core/database.py` with `AsyncSession`.
- [ ] Create basic models in `app/models/`.
- [ ] Generate initial Alembic migration.
- [ ] Run migration to create tables.
- [ ] Verify `vector` extension is active.
