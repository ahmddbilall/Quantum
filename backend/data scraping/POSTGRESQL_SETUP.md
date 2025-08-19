# PostgreSQL Setup Guide for News Scraper System

## Prerequisites

- PostgreSQL 12+ installed
- pgAdmin 4 (you mentioned you already have this)
- Administrative access to create databases and extensions

## Step 1: Create Database and User

### Using pgAdmin 4:

1. **Open pgAdmin 4** and connect to your PostgreSQL server

2. **Create Database:**

   - Right-click on "Databases" in the left panel
   - Select "Create" → "Database..."
   - Database name: `newsdb`
   - Owner: `postgres` (or your preferred user)
   - Click "Save"

3. **Create User (Optional but recommended):**

   - Right-click on "Login/Group Roles"
   - Select "Create" → "Login/Group Role..."
   - General tab: Name = `newsuser`
   - Definition tab: Password = `your_secure_password`
   - Privileges tab: Check "Can login?" and "Create databases?"
   - Click "Save"

4. **Grant Permissions:**
   - Right-click on your `newsdb` database
   - Select "Properties"
   - Go to "Security" tab
   - Add `newsuser` with all privileges
   - Click "Save"

### Using SQL Commands (Alternative):

```sql
-- Connect to PostgreSQL as superuser (usually postgres)
-- Create database
CREATE DATABASE newsdb;

-- Create user
CREATE USER newsuser WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE newsdb TO newsuser;

-- Make user owner of database
ALTER DATABASE newsdb OWNER TO newsuser;
```

## Step 2: Install pgvector Extension

### Option A: Using pgAdmin 4 Query Tool

1. **Open Query Tool:**

   - Right-click on your `newsdb` database
   - Select "Query Tool"

2. **Run Extension Commands:**

   ```sql
   -- Enable pgvector extension
   CREATE EXTENSION IF NOT EXISTS vector;

   -- Verify installation
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

3. **Execute the query** (press F5 or click Execute button)

### Option B: Command Line

```bash
# Connect to your database
psql -U newsuser -d newsdb

# Or if using postgres user
psql -U postgres -d newsdb

# Create extension
CREATE EXTENSION IF NOT EXISTS vector;

# Exit
\q
```

## Step 3: Verify pgvector Installation

Run this query to test vector operations:

```sql
-- Test vector extension
SELECT '[1,2,3]'::vector;

-- Test vector operations
SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector AS distance;
```

If successful, you should see the vector values and a distance calculation.

## Step 4: Install pgvector (if extension creation fails)

### Windows (using pgAdmin):

1. **Download pgvector:**

   - Go to: https://github.com/pgvector/pgvector/releases
   - Download the Windows binary for your PostgreSQL version

2. **Install:**

   - Extract files to PostgreSQL installation directory
   - Usually: `C:\Program Files\PostgreSQL\[version]\`
   - Copy `.dll` files to `lib` folder
   - Copy `.sql` files to `share/extension` folder

3. **Restart PostgreSQL service:**
   - Open Services (services.msc)
   - Find "PostgreSQL" service
   - Right-click → Restart

### Alternative: Using Stack Builder

1. **Open Stack Builder** (comes with PostgreSQL)
2. **Select your PostgreSQL installation**
3. **Look for pgvector** in extensions list
4. **Install and follow instructions**

### Linux/Ubuntu:

```bash
# Install development tools
sudo apt update
sudo apt install postgresql-server-dev-all

# Clone and build pgvector
git clone --branch v0.7.0 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### macOS (using Homebrew):

```bash
# Install pgvector
brew install pgvector

# Restart PostgreSQL
brew services restart postgresql
```

## Step 5: Configure Database Connection

1. **Update your .env file:**

   ```env
   DATABASE_URL=postgresql://newsuser:your_secure_password@localhost:5432/newsdb
   ```

2. **Test connection:**
   ```bash
   # Test with psql
   psql "postgresql://newsuser:your_secure_password@localhost:5432/newsdb" -c "SELECT version();"
   ```

## Step 6: Initialize News Scraper Database

1. **Run the setup script:**

   ```bash
   cd "d:\quantum\backend\data scraping"
   python setup.py --setup-db
   ```

2. **Or manually run initialization:**
   ```bash
   python run_scraper.py test-db
   ```

## Step 7: Verify Database Schema

Use pgAdmin 4 to check that these tables were created:

- `news_sources`
- `news_articles`
- `scraping_logs`

Expected schema for `news_articles`:

```sql
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'news_articles'
ORDER BY ordinal_position;
```

## Common Issues and Solutions

### Issue 1: pgvector extension not found

**Solution:** Make sure pgvector is properly installed for your PostgreSQL version.

### Issue 2: Permission denied

**Solution:**

```sql
-- Grant superuser temporarily
ALTER USER newsuser WITH SUPERUSER;
-- Create extension
CREATE EXTENSION vector;
-- Remove superuser
ALTER USER newsuser WITH NOSUPERUSER;
```

### Issue 3: Connection refused

**Solutions:**

- Check if PostgreSQL service is running
- Verify port (default 5432)
- Check `pg_hba.conf` for authentication settings
- Ensure `postgresql.conf` allows connections

### Issue 4: Vector dimension mismatch

**Current setup uses 768 dimensions for BGE model**

```sql
-- Check current dimension
\d news_articles
-- Should show: embedding vector(768)
```

## Database Performance Optimization

### Create Additional Indexes:

```sql
-- Performance indexes for news scraper
CREATE INDEX CONCURRENTLY idx_articles_published_date_desc
ON news_articles(published_date DESC);

CREATE INDEX CONCURRENTLY idx_articles_source_published
ON news_articles(source_id, published_date DESC);

CREATE INDEX CONCURRENTLY idx_articles_category
ON news_articles(category) WHERE category IS NOT NULL;

-- Text search index (optional)
CREATE INDEX CONCURRENTLY idx_articles_content_search
ON news_articles USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));
```

### Configure PostgreSQL for Vector Operations:

```sql
-- Adjust settings for better vector performance
ALTER SYSTEM SET shared_preload_libraries = 'vector';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

## Testing the Setup

Run this complete test:

```sql
-- Test database connection and operations
SELECT 'Database connection successful' AS status;

-- Test vector extension
SELECT '[0.1, 0.2, 0.3]'::vector(3) AS test_vector;

-- Test vector similarity (should return a distance value)
SELECT
    '[1,0,0]'::vector(3) <-> '[0,1,0]'::vector(3) AS cosine_distance,
    '[1,0,0]'::vector(3) <#> '[0,1,0]'::vector(3) AS inner_product;

-- Test if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('news_sources', 'news_articles', 'scraping_logs');
```

If all tests pass, your PostgreSQL database is ready for the news scraper system!

## Next Steps

1. **Update your .env file** with the correct DATABASE_URL
2. **Run the setup script:** `python setup.py --all`
3. **Test the scraper:** `python run_scraper.py run-once`

The BGE embedding model will download automatically on first use (~500MB).
