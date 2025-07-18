-- Fix admin settings
UPDATE admin_settings 
SET setting_value = 'true' 
WHERE setting_key = 'testing_mode';

-- If it doesn't exist, insert it
INSERT INTO admin_settings (setting_key, setting_value) 
SELECT 'testing_mode', 'true'
WHERE NOT EXISTS (
    SELECT 1 FROM admin_settings WHERE setting_key = 'testing_mode'
);
