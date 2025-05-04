const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ahsan',
  database: 'ahsanverse_db'
});

// Connect
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
  
  // First check if the column already exists
  db.query(`SHOW COLUMNS FROM transactions LIKE 'transaction_id'`, (err, results) => {
    if (err) {
      console.error('Error checking column:', err);
      closeConnection();
      return;
    }
    
    if (results.length === 0) {
      // Add transaction_id column
      db.query(`ALTER TABLE transactions ADD COLUMN transaction_id VARCHAR(66) AFTER status`, (err, result) => {
        if (err) {
          console.error('Error adding transaction_id column:', err);
        } else {
          console.log('Successfully added transaction_id column to transactions table');
        }
        closeConnection();
      });
    } else {
      console.log('transaction_id column already exists in the transactions table');
      closeConnection();
    }
  });
});

function closeConnection() {
  db.end(err => {
    if (err) {
      console.error('Error closing connection:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
} 