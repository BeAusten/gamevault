-- First, clear existing data to avoid conflicts
DELETE FROM products;
DELETE FROM subcategories;
DELETE FROM categories;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE subcategories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert categories first and get their actual IDs
INSERT INTO categories (name, slug) VALUES 
  ('Minecraft', 'minecraft'),
  ('Roblox', 'roblox'),
  ('GTA V', 'gta-v'),
  ('Fortnite', 'fortnite');

-- Now insert subcategories using the correct category IDs
-- Minecraft subcategories (category_id = 1)
INSERT INTO subcategories (category_id, name, slug) VALUES 
  (1, 'Survival Tools', 'survival-tools'),
  (1, 'Building Blocks', 'building-blocks'),
  (1, 'Rare Items', 'rare-items');

-- Roblox subcategories (category_id = 2)
INSERT INTO subcategories (category_id, name, slug) VALUES 
  (2, 'Pet Simulator', 'pet-simulator'),
  (2, 'Grow a Garden', 'grow-a-garden'),
  (2, 'Adopt Me', 'adopt-me');

-- GTA V subcategories (category_id = 3)
INSERT INTO subcategories (category_id, name, slug) VALUES 
  (3, 'Vehicles', 'vehicles'),
  (3, 'Weapons', 'weapons');

-- Fortnite subcategories (category_id = 4)
INSERT INTO subcategories (category_id, name, slug) VALUES 
  (4, 'Skins', 'skins'),
  (4, 'V-Bucks', 'v-bucks');

-- Now insert products using the correct subcategory IDs
-- Minecraft products
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  -- Survival Tools (subcategory_id = 1)
  (1, 'Legendary Diamond Pickaxe', 'Ultra rare diamond pickaxe with maximum enchantments and custom texture', 45.99, '/placeholder.svg?height=400&width=400', '{"durability": "Unbreakable", "enchantments": ["Efficiency X", "Unbreaking V", "Fortune V"], "rarity": "Legendary", "custom_texture": true}', 5),
  (1, 'Mythic Netherite Sword', 'Godlike netherite sword with exclusive enchantments', 89.99, '/placeholder.svg?height=400&width=400', '{"damage": "15", "durability": "Infinite", "enchantments": ["Sharpness X", "Fire Aspect V", "Looting V"], "rarity": "Mythic", "glow_effect": true}', 2),
  
  -- Rare Items (subcategory_id = 3)
  (3, 'Dragon Egg Collection', 'Complete set of all dragon eggs with special powers', 199.99, '/placeholder.svg?height=400&width=400', '{"quantity": "7 eggs", "powers": ["Flight", "Fire Immunity", "Teleportation"], "rarity": "Mythic", "animated": true}', 1);

-- Roblox products
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  -- Pet Simulator (subcategory_id = 4)
  (4, 'Golden Legendary Pet', 'Exclusive golden pet with maximum stats and abilities', 75.50, '/placeholder.svg?height=400&width=400', '{"type": "Golden Phoenix", "abilities": ["Infinite Flight", "Auto Collect", "Speed Boost"], "level": "MAX", "rarity": "Legendary"}', 8),
  (4, 'Rainbow Unicorn Pet', 'Ultra rare rainbow unicorn with special effects', 125.00, '/placeholder.svg?height=400&width=400', '{"type": "Rainbow Unicorn", "abilities": ["Rainbow Trail", "Luck Boost", "Coin Magnet"], "level": "MAX", "rarity": "Mythic"}', 3);

-- GTA V products
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  -- Vehicles (subcategory_id = 7)
  (7, 'Lamborghini Aventador SVJ', 'Fully customized supercar with nitro boost', 299.99, '/placeholder.svg?height=400&width=400', '{"top_speed": "400 km/h", "acceleration": "0-100 in 1.5s", "features": ["Nitro Boost", "Custom Paint", "Neon Lights"], "rarity": "Legendary"}', 4);

-- Fortnite products
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  -- Skins (subcategory_id = 9)
  (9, 'Exclusive Fortnite Skin Bundle', 'Rare skin collection with exclusive emotes', 159.99, '/placeholder.svg?height=400&width=400', '{"skins": "5 Legendary Skins", "emotes": "10 Exclusive Emotes", "back_blings": "5 Matching Back Blings", "rarity": "Legendary"}', 12),
  
  -- V-Bucks (subcategory_id = 10)
  (10, '10,000 V-Bucks Package', 'Premium V-Bucks package with bonus content', 79.99, '/placeholder.svg?height=400&width=400', '{"amount": "10,000 V-Bucks", "bonus": "2,000 Extra V-Bucks", "delivery": "Instant", "region": "All Regions"}', 25);

-- Create function to check low stock and create notifications
CREATE OR REPLACE FUNCTION check_low_stock() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock <= 3 AND NEW.stock != OLD.stock THEN
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

-- Create trigger for low stock notifications
DROP TRIGGER IF EXISTS low_stock_trigger ON products;
CREATE TRIGGER low_stock_trigger
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock();
