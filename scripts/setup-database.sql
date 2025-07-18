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

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO categories (name, slug) VALUES 
  ('Minecraft', 'minecraft'),
  ('Roblox', 'roblox'),
  ('GTA', 'gta')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (category_id, name, slug) VALUES 
  (1, 'Survival Tools', 'survival-tools'),
  (1, 'Building Blocks', 'building-blocks'),
  (2, 'Pet Simulator', 'pet-simulator'),
  (2, 'Grow a Garden', 'grow-a-garden'),
  (3, 'Vehicles', 'vehicles'),
  (3, 'Weapons', 'weapons')
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO products (subcategory_id, name, description, price, image_url, specifications) VALUES 
  (1, 'Diamond Pickaxe', 'Ultra rare diamond pickaxe with enchantments', 25.99, '/placeholder.svg?height=300&width=300', '{"durability": "1561", "enchantments": ["Efficiency V", "Unbreaking III"], "rarity": "Legendary"}'),
  (1, 'Netherite Sword', 'Powerful netherite sword for combat', 35.50, '/placeholder.svg?height=300&width=300', '{"damage": "8", "durability": "2031", "enchantments": ["Sharpness V", "Fire Aspect II"], "rarity": "Mythic"}'),
  (3, 'Golden Pet', 'Rare golden pet with special abilities', 15.00, '/placeholder.svg?height=300&width=300', '{"type": "Golden Dragon", "abilities": ["Flight", "Fire Breath"], "level": "Max", "rarity": "Epic"}'),
  (5, 'Sports Car', 'Fast sports car for GTA races', 45.99, '/placeholder.svg?height=300&width=300', '{"speed": "320 km/h", "acceleration": "0-100 in 2.8s", "color": "Neon Blue", "rarity": "Rare"}')
ON CONFLICT DO NOTHING;
