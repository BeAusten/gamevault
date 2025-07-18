-- Update the low stock trigger to use the correct threshold from settings
CREATE OR REPLACE FUNCTION check_low_stock() RETURNS TRIGGER AS $$
DECLARE
    threshold INTEGER;
BEGIN
    -- Get the low stock threshold from settings (default to 3)
    SELECT COALESCE(setting_value::INTEGER, 3) INTO threshold
    FROM admin_settings 
    WHERE setting_key = 'low_stock_threshold';
    
    IF threshold IS NULL THEN
        threshold := 3;
    END IF;
    
    -- Check if stock is at or below threshold and has changed
    IF NEW.stock <= threshold AND NEW.stock != OLD.stock THEN
        INSERT INTO notifications (type, title, message)
        VALUES (
            'low_stock',
            'Low Stock Alert',
            'Product "' || NEW.name || '" has only ' || NEW.stock || ' items left in stock.'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS low_stock_trigger ON products;
CREATE TRIGGER low_stock_trigger
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();
