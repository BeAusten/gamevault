-- Add rarity colors settings to admin_settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('rarity_colors', '{"common": "#9CA3AF", "rare": "#3B82F6", "epic": "#8B5CF6", "legendary": "#F59E0B", "mythic": "#EC4899"}')
ON CONFLICT (setting_key) DO NOTHING;

-- Update existing settings
UPDATE admin_settings SET setting_value = 'Fast Delivery' WHERE setting_key = 'delivery_time' AND setting_value = '24 hours';
