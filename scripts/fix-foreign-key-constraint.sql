-- First, clear all existing data to avoid conflicts
DELETE FROM products;
DELETE FROM subcategories;
DELETE FROM categories;

-- Reset all sequences to start fresh
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE subcategories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Insert categories first (these will get IDs 1, 2, 3, 4)
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
-- Minecraft Survival Tools (subcategory_id = 1)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (1, 'Legendary Diamond Pickaxe', 'Ultra rare diamond pickaxe with maximum enchantments and custom texture', 45.99, '/placeholder.svg?height=400&width=400', '{"durability": "Unbreakable", "enchantments": ["Efficiency X", "Unbreaking V", "Fortune V"], "rarity": "Legendary", "custom_texture": true}', 5),
  (1, 'Mythic Netherite Sword', 'Godlike netherite sword with exclusive enchantments', 89.99, '/placeholder.svg?height=400&width=400', '{"damage": "15", "durability": "Infinite", "enchantments": ["Sharpness X", "Fire Aspect V", "Looting V"], "rarity": "Mythic", "glow_effect": true}', 2);

-- Minecraft Building Blocks (subcategory_id = 2)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (2, 'Rainbow Block Set', 'Complete set of rainbow colored blocks with glow effects', 29.99, '/placeholder.svg?height=400&width=400', '{"quantity": "64 blocks each", "colors": "All rainbow colors", "effects": ["Glow", "Particle Effects"], "rarity": "Rare"}', 15);

-- Minecraft Rare Items (subcategory_id = 3)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (3, 'Dragon Egg Collection', 'Complete set of all dragon eggs with special powers', 199.99, '/placeholder.svg?height=400&width=400', '{"quantity": "7 eggs", "powers": ["Flight", "Fire Immunity", "Teleportation"], "rarity": "Mythic", "animated": true}', 1);

-- Roblox Pet Simulator (subcategory_id = 4)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (4, 'Golden Legendary Pet', 'Exclusive golden pet with maximum stats and abilities', 75.50, '/placeholder.svg?height=400&width=400', '{"type": "Golden Phoenix", "abilities": ["Infinite Flight", "Auto Collect", "Speed Boost"], "level": "MAX", "rarity": "Legendary"}', 8),
  (4, 'Rainbow Unicorn Pet', 'Ultra rare rainbow unicorn with special effects', 125.00, '/placeholder.svg?height=400&width=400', '{"type": "Rainbow Unicorn", "abilities": ["Rainbow Trail", "Luck Boost", "Coin Magnet"], "level": "MAX", "rarity": "Mythic"}', 3);

-- Roblox Grow a Garden (subcategory_id = 5)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (5, 'Magical Seed Pack', 'Seeds that grow into magical plants with special abilities', 19.99, '/placeholder.svg?height=400&width=400', '{"seeds": "10 different types", "growth_time": "Instant", "abilities": ["Auto Harvest", "Coin Generation"], "rarity": "Rare"}', 20);

-- Roblox Adopt Me (subcategory_id = 6)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (6, 'Legendary Pet Bundle', 'Bundle of the rarest pets in Adopt Me', 89.99, '/placeholder.svg?height=400&width=400', '{"pets": ["Shadow Dragon", "Frost Dragon", "Giraffe"], "age": "Full Grown", "rarity": "Legendary"}', 6);

-- GTA V Vehicles (subcategory_id = 7)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (7, 'Lamborghini Aventador SVJ', 'Fully customized supercar with nitro boost', 299.99, '/placeholder.svg?height=400&width=400', '{"top_speed": "400 km/h", "acceleration": "0-100 in 1.5s", "features": ["Nitro Boost", "Custom Paint", "Neon Lights"], "rarity": "Legendary"}', 4),
  (7, 'Military Tank MK2', 'Armored tank with explosive capabilities', 450.00, '/placeholder.svg?height=400&width=400', '{"armor": "Maximum", "weapons": ["Cannon", "Machine Gun"], "features": ["Bulletproof", "Explosive Resistant"], "rarity": "Mythic"}', 2);

-- GTA V Weapons (subcategory_id = 8)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (8, 'Golden Assault Rifle', 'Exclusive golden weapon with unlimited ammo', 150.00, '/placeholder.svg?height=400&width=400', '{"damage": "Maximum", "ammo": "Unlimited", "features": ["Gold Plated", "Laser Sight"], "rarity": "Legendary"}', 7);

-- Fortnite Skins (subcategory_id = 9)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (9, 'Exclusive Fortnite Skin Bundle', 'Rare skin collection with exclusive emotes', 159.99, '/placeholder.svg?height=400&width=400', '{"skins": "5 Legendary Skins", "emotes": "10 Exclusive Emotes", "back_blings": "5 Matching Back Blings", "rarity": "Legendary"}', 12),
  (9, 'Galaxy Skin Set', 'Ultra rare galaxy themed skin with cosmic effects', 249.99, '/placeholder.svg?height=400&width=400', '{"skin": "Galaxy Warrior", "effects": ["Cosmic Glow", "Star Particles"], "accessories": "Full Set", "rarity": "Mythic"}', 3);

-- Fortnite V-Bucks (subcategory_id = 10)
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (10, '10,000 V-Bucks Package', 'Premium V-Bucks package with bonus content', 79.99, '/placeholder.svg?height=400&width=400', '{"amount": "10,000 V-Bucks", "bonus": "2,000 Extra V-Bucks", "delivery": "Instant", "region": "All Regions"}', 25),
  (10, '25,000 V-Bucks Mega Pack', 'Ultimate V-Bucks package for serious players', 179.99, '/placeholder.svg?height=400&width=400', '{"amount": "25,000 V-Bucks", "bonus": "5,000 Extra V-Bucks", "delivery": "Instant", "region": "All Regions"}', 15);
