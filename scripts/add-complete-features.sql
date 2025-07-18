-- Add missing tables and columns for all new features

-- Add unique product IDs and community features
ALTER TABLE products ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_products_unique_id ON products(unique_id);

-- User permissions system
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    permission_value BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_key)
);

-- Discount codes system
CREATE TABLE IF NOT EXISTS discount_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER NULL,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    applicable_products TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community posts system
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post reactions system
CREATE TABLE IF NOT EXISTS post_reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, emoji)
);

-- PayPal payment links
CREATE TABLE IF NOT EXISTS payment_links (
    id SERIAL PRIMARY KEY,
    purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE CASCADE,
    paypal_link TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add maintenance mode setting
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES ('maintenance_mode', 'false') 
ON CONFLICT (setting_key) DO NOTHING;

-- Add default permissions for existing admins
INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'admin_panel_access', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'manage_products', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'manage_categories', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'process_orders', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'manage_users', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'manage_permissions', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'maintenance_mode', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'generate_payment_links', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'manage_discount_codes', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_key, permission_value)
SELECT id, 'create_community_posts', true FROM users WHERE is_admin = true
ON CONFLICT (user_id, permission_key) DO NOTHING;

-- Update existing products with unique IDs if they don't have them
UPDATE products 
SET unique_id = 'PROD-' || id || '-' || UPPER(SUBSTRING(MD5(name || id::text) FROM 1 FOR 8))
WHERE unique_id IS NULL;
