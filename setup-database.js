const mysql = require('mysql2');
const readline = require('readline');
const dotenv = require('dotenv');

// Load environment variables if .env exists
try {
  dotenv.config();
} catch (error) {
  console.log('No .env file found, using default values');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default database configuration
let dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ahsan',
  database: process.env.DB_NAME || 'ahsanverse_db'
};

console.log('=== AhsanVerse Database Setup ===');
console.log('This script will help you set up your MySQL database for AhsanVerse.');
console.log('Press Enter to use the default value shown in brackets.');

// Function to ask questions and get user input
function askQuestion(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${question} [${defaultValue}]: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Main function to run the setup
async function setup() {
  try {
    console.log('\nPlease provide your MySQL database credentials:');
    
    // Get database configuration from user
    dbConfig.host = await askQuestion('Host', dbConfig.host);
    dbConfig.user = await askQuestion('Username', dbConfig.user);
    dbConfig.password = await askQuestion('Password', dbConfig.password);
    dbConfig.database = await askQuestion('Database name', dbConfig.database);
    
    console.log('\nTrying to connect to MySQL...');
    
    // First, connect without database to create it if it doesn't exist
    const connection = mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // Create database if it doesn't exist
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
      if (err) {
        console.error('Error creating database:', err);
        rl.close();
        return;
      }
      
      console.log(`Database '${dbConfig.database}' created or already exists.`);
      
      // Connect to the database
      connection.query(`USE ${dbConfig.database}`, (err) => {
        if (err) {
          console.error('Error selecting database:', err);
          rl.close();
          return;
        }
        
        console.log(`Using database '${dbConfig.database}'.`);
        
        // Create users table with additional fields
        const createUsersTable = `
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            country VARCHAR(50),
            is_verified BOOLEAN DEFAULT FALSE,
            verification_token VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `;
        
        connection.query(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            rl.close();
            return;
          }
          
          console.log('Users table created successfully.');
          
          // Create user_profiles table
          const createUserProfilesTable = `
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
            )
          `;

          // Create purchases table
          const createPurchasesTable = `
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
            )
          `;

          // Create purchase_history table
          const createPurchaseHistoryTable = `
            CREATE TABLE IF NOT EXISTS purchase_history (
              id INT AUTO_INCREMENT PRIMARY KEY,
              purchase_id INT NOT NULL,
              status VARCHAR(20) NOT NULL,
              status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              notes TEXT,
              FOREIGN KEY (purchase_id) REFERENCES purchases(id)
            )
          `;

          // Create transactions table with more details
          const createTransactionsTable = `
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
            )
          `;
          
          connection.query(createTransactionsTable, (err) => {
            if (err) {
              console.error('Error creating transactions table:', err);
              rl.close();
              return;
            }
            
            console.log('Transactions table created successfully.');
            
            // Create staking table with more details
            const createStakingTable = `
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
              )
            `;

            // Create withdrawal_requests table
            const createWithdrawalRequestsTable = `
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
              )
            `;

            // Create indexes for better performance
            const createIndexes = `
              CREATE INDEX idx_user_email ON users(email);
              CREATE INDEX idx_user_phone ON users(phone);
              CREATE INDEX idx_purchase_date ON purchases(purchase_date);
              CREATE INDEX idx_transaction_status ON transactions(status);
              CREATE INDEX idx_staking_status ON staking(status);
              CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
            `;

            connection.query(createStakingTable, (err) => {
              if (err) {
                console.error('Error creating staking table:', err);
                rl.close();
                return;
              }
              
              console.log('Staking table created successfully.');
              
              // Generate .env file content
              const envContent = `# Database Configuration
DB_HOST=${dbConfig.host}
DB_USER=${dbConfig.user}
DB_PASSWORD=${dbConfig.password}
DB_NAME=${dbConfig.database}

# Server Configuration
PORT=3000

# JWT Configuration
JWT_SECRET=ahsanverse_${Math.random().toString(36).substring(2, 15)}
`;
              
              console.log('\nDatabase setup completed successfully!');
              console.log('\nPlease create a .env file with the following content:');
              console.log('-------------------------------------------');
              console.log(envContent);
              console.log('-------------------------------------------');
              console.log('\nNext steps:');
              console.log('1. Create the .env file with the above content');
              console.log('2. Install dependencies: npm install');
              console.log('3. Start the server: npm start');
              
              rl.close();
              connection.end();
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error during setup:', error);
    rl.close();
  }
}

// Run the setup
setup();
