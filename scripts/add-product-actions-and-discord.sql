-- Add product actions column
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_actions TEXT DEFAULT '';

-- Add Discord bot settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('discord_bot_token', ''),
  ('discord_guild_id', ''),
  ('discord_request_channel', 'purchase-requests'),
  ('discord_thankyou_channel', 'thank-you'),
  ('discord_bot_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;
