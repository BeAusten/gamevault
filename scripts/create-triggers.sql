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
CREATE TRIGGER calculate_sale_price_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_price();

-- Function to check low stock
CREATE OR REPLACE FUNCTION check_low_stock() RETURNS TRIGGER AS $$
DECLARE
    threshold INTEGER;
BEGIN
    SELECT COALESCE(setting_value::INTEGER, 3) INTO threshold
    FROM admin_settings 
    WHERE setting_key = 'low_stock_threshold';
    
    IF threshold IS NULL THEN
        threshold := 3;
    END IF;
    
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

-- Trigger for low stock notifications
CREATE TRIGGER low_stock_trigger
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();
