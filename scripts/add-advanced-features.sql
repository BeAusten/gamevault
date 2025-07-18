-- Add advanced features for the gaming webshop

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    permission_value BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_key)
);

-- Discount codes table
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
    applicable_products TEXT DEFAULT 'all', -- 'all' or JSON array of product IDs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PayPal transactions table
CREATE TABLE IF NOT EXISTS paypal_transactions (
    id SERIAL PRIMARY KEY,
    purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE CASCADE,
    paypal_payment_id VARCHAR(255) UNIQUE,
    paypal_order_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50) DEFAULT 'pending',
    payer_email VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- Money transfers table
CREATE TABLE IF NOT EXISTS money_transfers (
    id SERIAL PRIMARY KEY,
    from_admin_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- Email notifications log
CREATE TABLE IF NOT EXISTS email_notifications (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique product codes to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(50) UNIQUE;

-- Generate product codes for existing products
UPDATE products 
SET product_code = 'PROD-' || id || '-' || UPPER(SUBSTRING(MD5(name || id::text) FROM 1 FOR 6))
WHERE product_code IS NULL;

-- Add discount code usage tracking
CREATE TABLE IF NOT EXISTS discount_code_usage (
    id SERIAL PRIMARY KEY,
    discount_code_id INTEGER REFERENCES discount_codes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new admin settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
('email_notifications_enabled', 'false'),
('smtp_host', ''),
('smtp_port', '587'),
('smtp_username', ''),
('smtp_password', ''),
('smtp_from_email', ''),
('admin_emails', '[]'),
('paypal_client_id', ''),
('paypal_client_secret', ''),
('paypal_environment', 'sandbox'),
('site_maintenance_mode', 'false'),
('maintenance_message', 'Website is currently under maintenance. Please check back later.'),
('rarity_colors', '{"common":"#9CA3AF","uncommon":"#10B981","rare":"#3B82F6","epic":"#8B5CF6","legendary":"#F59E0B","mythic":"#EF4444"}'),
('rarity_order', '["common","uncommon","rare","epic","legendary","mythic"]')
ON CONFLICT (setting_key) DO NOTHING;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add purchase request discount tracking
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS original_total DECIMAL(10,2);

-- Update existing purchase requests
UPDATE purchase_requests SET original_total = total_price WHERE original_total IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_purchase_id ON paypal_transactions(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
