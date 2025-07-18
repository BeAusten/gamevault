-- Add table for storing uploaded images
CREATE TABLE IF NOT EXISTS uploaded_images (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  original_width INTEGER NOT NULL,
  original_height INTEGER NOT NULL,
  resized_width INTEGER NOT NULL,
  resized_height INTEGER NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Add payment methods settings
INSERT INTO admin_settings (setting_key, setting_value, created_at) VALUES
('payment_methods', '{"paypal": true, "crypto": true, "gift_cards": true, "bank_transfer": false, "cash_app": false}', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = CURRENT_TIMESTAMP;

-- Add default rarity colors with order
INSERT INTO admin_settings (setting_key, setting_value, created_at) VALUES
('rarity_colors', '{"common": "#9CA3AF", "uncommon": "#10B981", "rare": "#3B82F6", "epic": "#8B5CF6", "legendary": "#F59E0B", "mythic": "#EF4444"}', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = CURRENT_TIMESTAMP;

-- Add rarity order setting
INSERT INTO admin_settings (setting_key, setting_value, created_at) VALUES
('rarity_order', '["common", "uncommon", "rare", "epic", "legendary", "mythic"]', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
updated_at = CURRENT_TIMESTAMP;
