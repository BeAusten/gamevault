-- Create all tables with complete structure
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, slug)
);

-- Drop and recreate products table with all required columns
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  specifications JSONB DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS purchase_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  purchase_id VARCHAR(100) UNIQUE NOT NULL,
  discord_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear and reset data
DELETE FROM products;
DELETE FROM subcategories;
DELETE FROM categories;

-- Reset sequences
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE subcategories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert categories
INSERT INTO categories (name, slug) VALUES 
  ('Minecraft', 'minecraft'),
  ('Roblox', 'roblox'),
  ('GTA V', 'gta-v'),
  ('Fortnite', 'fortnite');

-- Insert subcategories with correct category references
INSERT INTO subcategories (category_id, name, slug) VALUES 
  -- Minecraft (category_id = 1)
  (1, 'Survival Tools', 'survival-tools'),
  (1, 'Building Blocks', 'building-blocks'),
  (1, 'Rare Items', 'rare-items'),
  -- Roblox (category_id = 2)
  (2, 'Pet Simulator', 'pet-simulator'),
  (2, 'Grow a Garden', 'grow-a-garden'),
  (2, 'Adopt Me', 'adopt-me'),
  -- GTA V (category_id = 3)
  (3, 'Vehicles', 'vehicles'),
  (3, 'Weapons', 'weapons'),
  -- Fortnite (category_id = 4)
  (4, 'Skins', 'skins'),
  (4, 'V-Bucks', 'v-bucks');

-- Insert products with stock
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  -- Minecraft Survival Tools (subcategory_id = 1)
  (1, 'Legendary Diamond Pickaxe', 'Ultra rare diamond pickaxe with maximum enchantments and custom texture', 45.99, '/placeholder.svg?height=400&width=400', '{"durability": "Unbreakable", "enchantments": ["Efficiency X", "Unbreaking V", "Fortune V"], "rarity": "Legendary", "custom_texture": true}', 5),
  (1, 'Mythic Netherite Sword', 'Godlike netherite sword with exclusive enchantments', 89.99, '/placeholder.svg?height=400&width=400', '{"damage": "15", "durability": "Infinite", "enchantments": ["Sharpness X", "Fire Aspect V", "Looting V"], "rarity": "Mythic", "glow_effect": true}', 2),
  
  -- Minecraft Building Blocks (subcategory_id = 2)
  (2, 'Rainbow Block Set', 'Complete set of rainbow colored blocks with glow effects', 29.99, '/placeholder.svg?height=400&width=400', '{"quantity": "64 blocks each", "colors": "All rainbow colors", "effects": ["Glow", "Particle Effects"], "rarity": "Rare"}', 15),
  
  -- Minecraft Rare Items (subcategory_id = 3)
  (3, 'Dragon Egg Collection', 'Complete set of all dragon eggs with special powers', 199.99, '/placeholder.svg?height=400&width=400', '{"quantity": "7 eggs", "powers": ["Flight", "Fire Immunity", "Teleportation"], "rarity": "Mythic", "animated": true}', 1),
  
  -- Roblox Pet Simulator (subcategory_id = 4)
  (4, 'Golden Legendary Pet', 'Exclusive golden pet with maximum stats and abilities', 75.50, '/placeholder.svg?height=400&width=400', '{"type": "Golden Phoenix", "abilities": ["Infinite Flight", "Auto Collect", "Speed Boost"], "level": "MAX", "rarity": "Legendary"}', 8),
  (4, 'Rainbow Unicorn Pet', 'Ultra rare rainbow unicorn with special effects', 125.00, '/placeholder.svg?height=400&width=400', '{"type": "Rainbow Unicorn", "abilities": ["Rainbow Trail", "Luck Boost", "Coin Magnet"], "level": "MAX", "rarity": "Mythic"}', 3),
  
  -- Roblox Grow a Garden (subcategory_id = 5)
  (5, 'Magical Seed Pack', 'Seeds that grow into magical plants with special abilities', 19.99, '/placeholder.svg?height=400&width=400', '{"seeds": "10 different types", "growth_time": "Instant", "abilities": ["Auto Harvest", "Coin Generation"], "rarity": "Rare"}', 20),
  
  -- Roblox Adopt Me (subcategory_id = 6)
  (6, 'Legendary Pet Bundle', 'Bundle of the rarest pets in Adopt Me', 89.99, '/placeholder.svg?height=400&width=400', '{"pets": ["Shadow Dragon", "Frost Dragon", "Giraffe"], "age": "Full Grown", "rarity": "Legendary"}', 6),
  
  -- GTA V Vehicles (subcategory_id = 7)
  (7, 'Lamborghini Aventador SVJ', 'Fully customized supercar with nitro boost', 299.99, '/placeholder.svg?height=400&width=400', '{"top_speed": "400 km/h", "acceleration": "0-100 in 1.5s", "features": ["Nitro Boost", "Custom Paint", "Neon Lights"], "rarity": "Legendary"}', 4),
  (7, 'Military Tank MK2', 'Armored tank with explosive capabilities', 450.00, '/placeholder.svg?height=400&width=400', '{"armor": "Maximum", "weapons": ["Cannon", "Machine Gun"], "features": ["Bulletproof", "Explosive Resistant"], "rarity": "Mythic"}', 2),
  
  -- GTA V Weapons (subcategory_id = 8)
  (8, 'Golden Assault Rifle', 'Exclusive golden weapon with unlimited ammo', 150.00, '/placeholder.svg?height=400&width=400', '{"damage": "Maximum", "ammo": "Unlimited", "features": ["Gold Plated", "Laser Sight"], "rarity": "Legendary"}', 7),
  
  -- Fortnite Skins (subcategory_id = 9)
  (9, 'Exclusive Fortnite Skin Bundle', 'Rare skin collection with exclusive emotes', 159.99, '/placeholder.svg?height=400&width=400', '{"skins": "5 Legendary Skins", "emotes": "10 Exclusive Emotes", "back_blings": "5 Matching Back Blings", "rarity": "Legendary"}', 12),
  (9, 'Galaxy Skin Set', 'Ultra rare galaxy themed skin with cosmic effects', 249.99, '/placeholder.svg?height=400&width=400', '{"skin": "Galaxy Warrior", "effects": ["Cosmic Glow", "Star Particles"], "accessories": "Full Set", "rarity": "Mythic"}', 3),
  
  -- Fortnite V-Bucks (subcategory_id = 10)
  (10, '10,000 V-Bucks Package', 'Premium V-Bucks package with bonus content', 79.99, '/placeholder.svg?height=400&width=400', '{"amount": "10,000 V-Bucks", "bonus": "2,000 Extra V-Bucks", "delivery": "Instant", "region": "All Regions"}', 25),
  (10, '25,000 V-Bucks Mega Pack', 'Ultimate V-Bucks package for serious players', 179.99, '/placeholder.svg?height=400&width=400', '{"amount": "25,000 V-Bucks", "bonus": "5,000 Extra V-Bucks", "delivery": "Instant", "region": "All Regions"}', 15);

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
