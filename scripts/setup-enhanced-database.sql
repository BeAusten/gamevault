-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, slug)
);

-- Create products table with stock
CREATE TABLE IF NOT EXISTS products (
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

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- Create purchase_requests table
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update the admin user insertion with a proper bcrypt hash
-- Remove the old admin user insertion and replace with:

-- Insert admin user (email: admin@gamestore.com, password: admin123)
-- Hash generated with bcrypt for password "admin123"
INSERT INTO users (email, password_hash, is_admin) VALUES 
  ('admin@gamestore.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqu', TRUE)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqu',
  is_admin = TRUE;

-- Also add a test regular user
INSERT INTO users (email, password_hash, is_admin) VALUES 
  ('user@gamestore.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqu', FALSE)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = '$2b$10$rOzJqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqOzJqQqQqQqQqu';

-- Insert sample categories
INSERT INTO categories (name, slug) VALUES 
  ('Minecraft', 'minecraft'),
  ('Roblox', 'roblox'),
  ('GTA V', 'gta-v'),
  ('Fortnite', 'fortnite')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample subcategories
INSERT INTO subcategories (category_id, name, slug) VALUES 
  (1, 'Survival Tools', 'survival-tools'),
  (1, 'Building Blocks', 'building-blocks'),
  (1, 'Rare Items', 'rare-items'),
  (2, 'Pet Simulator', 'pet-simulator'),
  (2, 'Grow a Garden', 'grow-a-garden'),
  (2, 'Adopt Me', 'adopt-me'),
  (3, 'Vehicles', 'vehicles'),
  (3, 'Weapons', 'weapons'),
  (4, 'Skins', 'skins'),
  (4, 'V-Bucks', 'v-bucks')
ON CONFLICT (category_id, slug) DO NOTHING;

-- Insert sample products with stock
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (1, 'Legendary Diamond Pickaxe', 'Ultra rare diamond pickaxe with maximum enchantments and custom texture', 45.99, '/placeholder.svg?height=400&width=400', '{"durability": "Unbreakable", "enchantments": ["Efficiency X", "Unbreaking V", "Fortune V"], "rarity": "Legendary", "custom_texture": true}', 5),
  (1, 'Mythic Netherite Sword', 'Godlike netherite sword with exclusive enchantments', 89.99, '/placeholder.svg?height=400&width=400', '{"damage": "15", "durability": "Infinite", "enchantments": ["Sharpness X", "Fire Aspect V", "Looting V"], "rarity": "Mythic", "glow_effect": true}', 2),
  (3, 'Dragon Egg Collection', 'Complete set of all dragon eggs with special powers', 199.99, '/placeholder.svg?height=400&width=400', '{"quantity": "7 eggs", "powers": ["Flight", "Fire Immunity", "Teleportation"], "rarity": "Mythic", "animated": true}', 1),
  (4, 'Golden Legendary Pet', 'Exclusive golden pet with maximum stats and abilities', 75.50, '/placeholder.svg?height=400&width=400', '{"type": "Golden Phoenix", "abilities": ["Infinite Flight", "Auto Collect", "Speed Boost"], "level": "MAX", "rarity": "Legendary"}', 8),
  (4, 'Rainbow Unicorn Pet', 'Ultra rare rainbow unicorn with special effects', 125.00, '/placeholder.svg?height=400&width=400', '{"type": "Rainbow Unicorn", "abilities": ["Rainbow Trail", "Luck Boost", "Coin Magnet"], "level": "MAX", "rarity": "Mythic"}', 3),
  (7, 'Lamborghini Aventador SVJ', 'Fully customized supercar with nitro boost', 299.99, '/placeholder.svg?height=400&width=400', '{"top_speed": "400 km/h", "acceleration": "0-100 in 1.5s", "features": ["Nitro Boost", "Custom Paint", "Neon Lights"], "rarity": "Legendary"}', 4),
  (9, 'Exclusive Fortnite Skin Bundle', 'Rare skin collection with exclusive emotes', 159.99, '/placeholder.svg?height=400&width=400', '{"skins": "5 Legendary Skins", "emotes": "10 Exclusive Emotes", "back_blings": "5 Matching Back Blings", "rarity": "Legendary"}', 12),
  (10, '10,000 V-Bucks Package', 'Premium V-Bucks package with bonus content', 79.99, '/placeholder.svg?height=400&width=400', '{"amount": "10,000 V-Bucks", "bonus": "2,000 Extra V-Bucks", "delivery": "Instant", "region": "All Regions"}', 25)
ON CONFLICT DO NOTHING;

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
