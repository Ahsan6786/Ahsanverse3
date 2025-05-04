const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ahsanverse_db'
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1);
  }
  
  console.log('Connected to MySQL database');
  
  // Check if transaction_id column exists
  const checkColumnQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_NAME = 'transactions' 
    AND COLUMN_NAME = 'transaction_id'
  `;
  
  db.query(checkColumnQuery, [process.env.DB_NAME || 'ahsanverse_db'], (err, results) => {
    if (err) {
      console.error('Error checking for column existence:', err);
      closeConnection();
      return;
    }
    
    if (results.length === 0) {
      console.log('transaction_id column does not exist. Adding it now...');
      
      // Add the transaction_id column
      const addColumnQuery = `
        ALTER TABLE transactions 
        ADD COLUMN transaction_id VARCHAR(66) AFTER status
      `;
      
      db.query(addColumnQuery, (err, result) => {
        if (err) {
          console.error('Error adding transaction_id column:', err);
        } else {
          console.log('transaction_id column added successfully');
        }
        
        closeConnection();
      });
    } else {
      console.log('transaction_id column already exists');
      closeConnection();
    }
  });
});

// Function to close the database connection
function closeConnection() {
  db.end((err) => {
    if (err) {
      console.error('Error closing database connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
} 