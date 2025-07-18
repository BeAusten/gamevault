-- Ensure admin_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delete any existing testing_mode setting to avoid conflicts
DELETE FROM admin_settings WHERE setting_key = 'testing_mode';

-- Insert the testing_mode setting fresh
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('testing_mode', 'true');

-- Also ensure other default settings exist
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('low_stock_threshold', '3'),
  ('discord_server_link', 'https://discord.gg/yourserver'),
  ('store_name', 'GameVault'),
  ('currency_symbol', '€'),
  ('support_email', 'support@gamevault.com'),
  ('delivery_time', '24 hours')
ON CONFLICT (setting_key) DO NOTHING;
