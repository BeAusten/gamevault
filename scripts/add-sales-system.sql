-- Add sales/discount system to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_percentage INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_active BOOLEAN DEFAULT FALSE;

-- Function to calculate sale price
CREATE OR REPLACE FUNCTION calculate_sale_price() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_active = TRUE AND NEW.sale_percentage > 0 THEN
        NEW.sale_price = NEW.price * (1 - NEW.sale_percentage::DECIMAL / 100);
    ELSE
        NEW.sale_price = NULL;
        NEW.sale_active = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate sale price
DROP TRIGGER IF EXISTS calculate_sale_price_trigger ON products;
CREATE TRIGGER calculate_sale_price_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_price();

-- Update admin settings with more options
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
    ('discord_server_link', 'https://discord.gg/yourserver'),
    ('store_name', 'GameVault'),
    ('currency_symbol', '€'),
    ('support_email', 'support@gamevault.com'),
    ('delivery_time', '24 hours')
ON CONFLICT (setting_key) DO NOTHING;
