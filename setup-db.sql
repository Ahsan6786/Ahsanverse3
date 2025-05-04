-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ahsanverse_db;

-- Use the database
USE ahsanverse_db;

-- Create users table with additional fields
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  country VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  balance DECIMAL(20,8) DEFAULT 0.00000000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add verification_token column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) DEFAULT NULL;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  profile_picture VARCHAR(255),
  bio TEXT,
  social_links JSON,
  total_invested DECIMAL(18, 8) DEFAULT 0.00,
  total_earnings DECIMAL(18, 8) DEFAULT 0.00,
  last_login TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(18, 8) NOT NULL,
  total_amount DECIMAL(18, 8) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(100),
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create purchase_history table
CREATE TABLE IF NOT EXISTS purchase_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

-- Create transactions table with more details
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('deposit', 'withdrawal', 'purchase', 'staking', 'reward') NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token VARCHAR(10) NOT NULL,
  reference_id VARCHAR(100),
  status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create staking table with more details
CREATE TABLE IF NOT EXISTS staking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token VARCHAR(10) NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  apy DECIMAL(5, 2) NOT NULL,
  status ENUM('active', 'completed', 'withdrawn', 'expired') NOT NULL,
  rewards_earned DECIMAL(18, 8) DEFAULT 0.00,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  token VARCHAR(10) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_phone ON users(phone);
CREATE INDEX idx_purchase_date ON purchases(purchase_date);
CREATE INDEX idx_transaction_status ON transactions(status);
CREATE INDEX idx_staking_status ON staking(status);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);

-- Show tables to confirm creation
SHOW TABLES;
