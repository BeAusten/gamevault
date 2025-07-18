-- Add wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'manual_add', 'manual_subtract')),
  description TEXT NOT NULL,
  purchase_id TEXT,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_purchase_id ON wallet_transactions(purchase_id);

-- Insert some sample data for testing
INSERT INTO wallet_transactions (user_email, amount, transaction_type, description, purchase_id, items) VALUES
('admin@example.com', 150.00, 'income', 'Purchase completed', 'PUR-1234567890-ABC123', '[{"name": "Diamond Sword", "quantity": 1, "price": 150.00}]'),
('user@example.com', -25.00, 'expense', 'Refund processed', 'PUR-0987654321-XYZ789', '[{"name": "Iron Pickaxe", "quantity": 1, "price": 25.00}]'),
('admin@example.com', 500.00, 'manual_add', 'Manual deposit - PayPal transfer', NULL, NULL),
('admin@example.com', -100.00, 'manual_subtract', 'Server hosting costs', NULL, NULL);

-- Add settings for wallet configuration
INSERT INTO admin_settings (setting_key, setting_value) VALUES
('wallet_enabled', 'true'),
('default_currency', 'EUR')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
