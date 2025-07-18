-- Add missing stock column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Update existing products to have some stock
UPDATE products SET stock = 10 WHERE stock IS NULL OR stock = 0;
