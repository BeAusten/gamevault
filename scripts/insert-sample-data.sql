-- Insert categories
INSERT INTO categories (name, slug) VALUES 
  ('Minecraft', 'minecraft'),
  ('Roblox', 'roblox'),
  ('GTA V', 'gta-v'),
  ('Fortnite', 'fortnite');

-- Insert subcategories
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
  (4, 'V-Bucks', 'v-bucks');

-- Insert products
INSERT INTO products (subcategory_id, name, description, price, image_url, specifications, stock) VALUES 
  (1, 'Legendary Diamond Pickaxe', 'Ultra rare diamond pickaxe with maximum enchantments', 45.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Legendary", "enchantments": ["Efficiency X", "Unbreaking V"]}', 5),
  (1, 'Mythic Netherite Sword', 'Godlike netherite sword with exclusive enchantments', 89.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Mythic", "damage": "15"}', 2),
  (2, 'Rainbow Block Set', 'Complete set of rainbow colored blocks', 29.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Rare", "quantity": "64 blocks each"}', 15),
  (3, 'Dragon Egg Collection', 'Complete set of all dragon eggs', 199.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Mythic", "quantity": "7 eggs"}', 1),
  (4, 'Golden Legendary Pet', 'Exclusive golden pet with maximum stats', 75.50, '/placeholder.svg?height=400&width=400', '{"rarity": "Legendary", "type": "Golden Phoenix"}', 8),
  (5, 'Magical Seed Pack', 'Seeds that grow into magical plants', 19.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Rare", "seeds": "10 different types"}', 20),
  (6, 'Legendary Pet Bundle', 'Bundle of the rarest pets in Adopt Me', 89.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Legendary", "pets": ["Shadow Dragon", "Frost Dragon"]}', 6),
  (7, 'Lamborghini Aventador SVJ', 'Fully customized supercar', 299.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Legendary", "top_speed": "400 km/h"}', 4),
  (8, 'Golden Assault Rifle', 'Exclusive golden weapon', 150.00, '/placeholder.svg?height=400&width=400', '{"rarity": "Legendary", "damage": "Maximum"}', 7),
  (9, 'Exclusive Fortnite Skin Bundle', 'Rare skin collection', 159.99, '/placeholder.svg?height=400&width=400', '{"rarity": "Legendary", "skins": "5 Legendary Skins"}', 12),
  (10, '10,000 V-Bucks Package', 'Premium V-Bucks package', 79.99, '/placeholder.svg?height=400&width=400', '{"amount": "10,000 V-Bucks", "bonus": "2,000 Extra"}', 25);
