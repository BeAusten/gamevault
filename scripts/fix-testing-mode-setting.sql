-- Fix the testing mode setting with proper conflict handling
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
    ('testing_mode', 'true')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value;
