-- PantryChef Database Schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- =====================
-- USERS
-- =====================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255),
    hashed_password VARCHAR(255),
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    is_verified     BOOLEAN DEFAULT FALSE,
    preferences     JSONB DEFAULT '{
        "cuisines": [],
        "dietary": [],
        "skillLevel": "intermediate",
        "servings": 4,
        "defaultMode": "standard"
    }'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,
    last_login      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

-- =====================
-- SAVED RECIPES
-- =====================
CREATE TABLE IF NOT EXISTS saved_recipes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id    VARCHAR(100) NOT NULL,
    recipe_name  VARCHAR(500) NOT NULL,
    cuisine      VARCHAR(100),
    difficulty   VARCHAR(50),
    prep_time    INTEGER,
    cook_time    INTEGER,
    total_time   INTEGER,
    servings     INTEGER,
    match_score  INTEGER,
    recipe_data  JSONB NOT NULL,
    notes        TEXT,
    saved_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

CREATE INDEX idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_cuisine ON saved_recipes(cuisine);
CREATE INDEX idx_saved_recipes_name ON saved_recipes USING GIN (to_tsvector('english', recipe_name));

-- =====================
-- PANTRY ITEMS
-- =====================
CREATE TABLE IF NOT EXISTS pantry_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    amount      VARCHAR(100),
    unit        VARCHAR(50),
    category    VARCHAR(100),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pantry_user ON pantry_items(user_id);
CREATE INDEX idx_pantry_name ON pantry_items USING GIN (name gin_trgm_ops);

-- =====================
-- MEAL PLANS
-- =====================
CREATE TABLE IF NOT EXISTS meal_plans (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start  DATE NOT NULL,
    plan_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    UNIQUE(user_id, week_start)
);

CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_week ON meal_plans(week_start);

-- =====================
-- RECIPE CACHE
-- =====================
CREATE TABLE IF NOT EXISTS recipe_cache (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key   VARCHAR(64) UNIQUE NOT NULL,
    recipes     JSONB NOT NULL,
    hits        INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_recipe_cache_key ON recipe_cache(cache_key);
CREATE INDEX idx_recipe_cache_expires ON recipe_cache(expires_at);

-- Auto-cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM recipe_cache WHERE expires_at < NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- GENERATION LOGS (analytics)
-- =====================
CREATE TABLE IF NOT EXISTS generation_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    ingredients     TEXT[],
    cuisine         VARCHAR(100),
    dietary         TEXT[],
    recipes_count   INTEGER,
    tokens_used     INTEGER,
    duration_ms     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gen_logs_user ON generation_logs(user_id);
CREATE INDEX idx_gen_logs_created ON generation_logs(created_at);

-- =====================
-- Sample data for development
-- =====================
-- INSERT INTO users (email, name, hashed_password) VALUES
--   ('demo@pantrychef.app', 'Demo Chef', '$2b$12$...');
