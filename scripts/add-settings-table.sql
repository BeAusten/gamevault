-- Add settings table for admin configurations
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('low_stock_threshold', '3'),
  ('default_language', 'en'),
  ('discord_webhook_url', ''),
  ('store_name', 'GameVault'),
  ('currency', 'EUR')
ON CONFLICT (setting_key) DO NOTHING;
