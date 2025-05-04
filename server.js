const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');
const blockchain = require('./blockchain');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001; // Fixed port for development

// Create a simple in-memory OTP storage
const otpStore = {};

// Configure nodemailer transporter
let transporter = null;

// Determine if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

// Set to false to send real emails
const DEV_MODE = false;

// Setup mail transporter
try {
  // Create Gmail transporter with the correct app password
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ahsanversechain@gmail.com',
      pass: 'thxs myfr hkgn exsy' // Exact app password provided by user
    },
    debug: isDev,
    logger: isDev
  });
  
  // Verify the connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('Email configuration error:', error);
      console.log('IMPORTANT: For Gmail, you need to:');
      console.log('1. Enable 2-step verification for your Gmail account');
      console.log('2. Generate an App Password at https://myaccount.google.com/apppasswords');
      console.log('3. Use the App Password instead of your normal password');
    } else {
      console.log('Email server is ready to send messages');
    }
  });
} catch (err) {
  console.error('Error setting up email transporter:', err);
}

// Helper function to store and retrieve OTP codes
function storeOTP(email, otp) {
  otpStore[email] = {
    otp,
    timestamp: Date.now(),
    expires: Date.now() + (15 * 60 * 1000) // 15 minutes expiration
  };
}

function getOTP(email) {
  if (!otpStore[email]) return null;
  
  // Check if OTP has expired
  if (otpStore[email].expires < Date.now()) {
    delete otpStore[email];
    return null;
  }
  
  return otpStore[email].otp;
}

// Helper function to send email with OTP
async function sendOTPEmail(to, otp) {
  // In development mode, just log OTP to console and return success
  if (DEV_MODE) {
    console.log('\n============================================================');
    console.log(`🔐 DEVELOPMENT MODE: YOUR OTP CODE IS: ${otp}`);
    console.log(`📧 For user: ${to}`);
    console.log('============================================================\n');
    return true;
  }

  // If no transporter is available, log error and return false
  if (!transporter) {
    console.error('No email transporter available. Please check your configuration.');
    return false;
  }

  // Create email content with OTP
  const mailOptions = {
    from: '"AhsanVerse" <ahsanversechain@gmail.com>',
    to: to,
    subject: 'Password Reset - Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #00cc66;">AhsanVerse</h1>
          <p style="font-size: 18px; color: #333;">Password Reset Verification</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p>Hello,</p>
          <p>You have requested to reset your password for your AhsanVerse account. Please use the following verification code to complete the process:</p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #00cc66; background: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;"><strong>${otp}</strong></p>
          </div>
          <p>This code is valid for 15 minutes. If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div style="color: #666; font-size: 12px; text-align: center;">
          <p>© ${new Date().getFullYear()} AhsanVerse. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log the error details
    if (error.code === 'EAUTH') {
      console.error('Authentication error. Please check your email credentials.');
    }
    
    return false;
  }
}

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './')));

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ahsan',
  database: process.env.DB_NAME || 'ahsanverse_db'
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create users table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created or already exists');
    }
  });
  
  // Create transactions table if it doesn't exist
  const createTransactionsTableQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(18, 8) NOT NULL,
      token VARCHAR(10) NOT NULL,
      status VARCHAR(20) NOT NULL,
      transaction_id VARCHAR(66),
      eth_amount DECIMAL(18, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  
  db.query(createTransactionsTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating transactions table:', err);
    } else {
      console.log('Transactions table created or already exists');
    }
  });
  
  // Create staking table if it doesn't exist
  const createStakingTableQuery = `
    CREATE TABLE IF NOT EXISTS staking (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(18, 8) NOT NULL,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      apy DECIMAL(5, 2) NOT NULL,
      status VARCHAR(20) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  
  db.query(createStakingTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating staking table:', err);
    } else {
      console.log('Staking table created or already exists');
    }
  });
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ahsanverse-secret-key';

// Helper function to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// API Routes

// Request password reset
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // In development mode, we don't need to check if the user exists
    if (!DEV_MODE) {
      // Check if user exists
      const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      
      // In production, don't reveal if user exists or not for security
      if (rows.length === 0) {
        return res.status(200).json({ 
          success: true,
          message: 'If your email is registered, you will receive an OTP' 
        });
      }
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in memory
    storeOTP(email, otp);
    
    // In DEV_MODE, we don't need to actually send email
    let emailSent = true;
    if (!DEV_MODE) {
      emailSent = await sendOTPEmail(email, otp);
    } else {
      console.log('\n============================================================');
      console.log(`🔐 DEVELOPMENT MODE: YOUR OTP CODE IS: ${otp}`);
      console.log(`📧 For user: ${email}`);
      console.log('============================================================\n');
    }
    
    if (!emailSent && !DEV_MODE) {
      return res.status(500).json({ 
        success: false,
        message: 'Error sending OTP email' 
      });
    }
    
    // In development mode, include the OTP in the response for testing
    res.json({ 
      success: true,
      message: 'If your email is registered, you will receive an OTP',
      ...(DEV_MODE && { 
        otp, 
        devNote: 'DEVELOPMENT MODE ONLY - For testing purposes' 
      })
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Error processing request',
      ...(DEV_MODE && { error: error.message })
    });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Check if user exists
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      // For security, use generic error message
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }
    
    // First check our in-memory storage
    const storedOTP = getOTP(email);
    if (!storedOTP) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }
    
    // Verify the OTP
    if (storedOTP !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP' 
      });
    }
    
    // Don't delete the OTP yet, so it can be used for password reset
    // We'll delete it after the password is reset
    
    res.json({ 
      success: true,
      message: 'OTP verification successful' 
    });
  } catch (error) {
    console.error('Error in verify OTP:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP' 
    });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }
    
    // Check if user exists
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      // For security, use generic error message
      return res.status(400).json({ 
        success: false,
        message: 'Invalid request' 
      });
    }
    
    // Verify OTP
    const storedOTP = getOTP(email);
    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
    const [result] = await db.promise().query(updateQuery, [hashedPassword, email]);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Password reset failed' 
      });
    }
    
    // Clear OTP after successful password reset
    delete otpStore[email];
    
    res.json({ 
      success: true,
      message: 'Password reset successful' 
    });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error resetting password' 
    });
  }
});

// Register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insert new user
      db.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ success: false, message: 'Error creating user' });
          }
          
          // Generate JWT token
          const token = jwt.sign(
            { id: result.insertId, name, email },
            JWT_SECRET,
            { expiresIn: '1d' }
          );
          
          res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { id: result.insertId, name, email }
          });
        }
      );
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login user
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Find user by email
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      const user = results[0];
      
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: results[0]
    });
  });
});

// Get user transactions
app.get('/api/transactions', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    res.json({
      success: true,
      transactions: results
    });
  });
});

// Add a transaction
app.post('/api/transactions', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { type, amount, token, status } = req.body;

  // Validate request
  if (!type || !amount || !token || !status) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Insert transaction
  db.query(
    'INSERT INTO transactions (user_id, type, amount, token, status) VALUES (?, ?, ?, ?, ?)',
    [userId, type, amount, token, status],
    (err, result) => {
      if (err) {
        console.error('Error adding transaction:', err);
        return res.status(500).json({ success: false, message: 'Error adding transaction' });
      }

      return res.status(201).json({
        success: true,
        message: 'Transaction added successfully',
        transaction: {
          id: result.insertId,
          user_id: userId,
          type,
          amount,
          token,
          status,
          created_at: new Date()
        }
      });
    }
  );
});

// Update a transaction status
app.put('/api/update-transaction', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { transactionId, status, transactionHash } = req.body;

  // Validate request
  if (!transactionId || !status) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // First check if the transaction belongs to the user
  db.query(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    [transactionId, userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching transaction:', err);
        return res.status(500).json({ success: false, message: 'Error fetching transaction' });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Transaction not found or not owned by user' });
      }

      // Update the transaction status
      let updateQuery = 'UPDATE transactions SET status = ?';
      let queryParams = [status];
      
      // Add transaction hash if provided
      if (transactionHash) {
        updateQuery += ', transaction_id = ?';
        queryParams.push(transactionHash);
      }
      
      updateQuery += ' WHERE id = ?';
      queryParams.push(transactionId);

      db.query(updateQuery, queryParams, (updateErr) => {
        if (updateErr) {
          console.error('Error updating transaction:', updateErr);
          return res.status(500).json({ success: false, message: 'Error updating transaction' });
        }

        // Get the updated transaction
        db.query('SELECT * FROM transactions WHERE id = ?', [transactionId], (selectErr, selectResults) => {
          if (selectErr) {
            console.error('Error fetching updated transaction:', selectErr);
            return res.status(200).json({
              success: true,
              message: 'Transaction updated successfully'
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            transaction: selectResults[0]
          });
        });
      });
    }
  );
});

// Get staking information
app.get('/api/staking', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.query('SELECT * FROM staking WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    res.json({
      success: true,
      staking: results
    });
  });
});

// Add staking
app.post('/api/staking', verifyToken, (req, res) => {
  try {
    const { amount, apy, duration } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!amount || !apy || !duration) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Calculate end time
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + parseInt(duration));
    
    // Insert staking
    db.query(
      'INSERT INTO staking (user_id, amount, end_time, apy, status) VALUES (?, ?, ?, ?, ?)',
      [userId, amount, endTime, apy, 'active'],
      (err, result) => {
        if (err) {
          console.error('Error adding staking:', err);
          return res.status(500).json({ success: false, message: 'Error adding staking' });
        }
        
        res.status(201).json({
          success: true,
          message: 'Staking added successfully',
          staking: {
            id: result.insertId,
            user_id: userId,
            amount,
            start_time: new Date(),
            end_time: endTime,
            apy,
            status: 'active'
          }
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Blockchain Endpoints

// Get token information
app.get('/api/token-info', async (req, res) => {
  try {
    const tokenInfo = await blockchain.getTokenInfo();
    res.json({
      success: true,
      tokenInfo
    });
  } catch (error) {
    console.error('Error fetching token info:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching token information',
      error: error.message
    });
  }
});

// Get user token balance
app.get('/api/token-balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await blockchain.getUserTokenBalance(address);
    
    res.json({
      success: true,
      address,
      balance
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching token balance',
      error: error.message
    });
  }
});

// Record token purchase transaction in database
app.post('/api/record-purchase', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { txHash, tokenAmount, ethAmount } = req.body;
    
    if (!txHash || !tokenAmount || !ethAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Insert transaction into database
    const query = `
      INSERT INTO transactions 
      (user_id, type, amount, token, status, transaction_id, eth_amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(
      query,
      [userId, 'Purchase', tokenAmount, 'AHV', 'Completed', txHash, ethAmount],
      (err, result) => {
        if (err) {
          console.error('Error recording transaction:', err);
          return res.status(500).json({
            success: false,
            message: 'Error recording transaction'
          });
        }
        
        return res.status(201).json({
          success: true,
          message: 'Transaction recorded successfully',
          transaction: {
            id: result.insertId,
            user_id: userId,
            type: 'Purchase',
            amount: tokenAmount,
            token: 'AHV',
            status: 'Completed',
            transaction_id: txHash,
            eth_amount: ethAmount,
            created_at: new Date()
          }
        });
      }
    );
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording purchase',
      error: error.message
    });
  }
});

// Get latest blockchain transactions for token
app.get('/api/blockchain-transactions', async (req, res) => {
  try {
    // Return cached or mock data for development
    const mockTransactions = [
      {
        txHash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
        from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        to: '0x9876543210abcdef9876543210abcdef98765432',
        tokenAmount: '1000',
        ethAmount: '0.33',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        txHash: '0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abcd',
        from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        to: '0xfedcba9876543210fedcba9876543210fedcba98',
        tokenAmount: '3000',
        ethAmount: '1',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        txHash: '0x456789abcdef123456789abcdef123456789abcdef123456789abcdef123456',
        from: '0xfedcba9876543210fedcba9876543210fedcba98',
        to: '0x5432fedcba9876543210fedcba9876543210fedc',
        tokenAmount: '500',
        ethAmount: '0.165',
        timestamp: new Date(Date.now() - 10800000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      transactions: mockTransactions
    });
  } catch (error) {
    console.error('Error fetching blockchain transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain transactions',
      error: error.message
    });
  }
});

// Connect to wallet (simulated server-side for development)
app.post('/api/connect-wallet', async (req, res) => {
  try {
    // In a real implementation, this would be done client-side only
    // Here we're just sending back mock data for development
    res.json({
      success: true,
      message: 'Wallet connected successfully',
      wallet: {
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        balance: '10.0',
        network: 'Sepolia Testnet',
        chainId: 11155111
      }
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting wallet',
      error: error.message
    });
  }
});

// Check if connected to supported network
app.get('/api/check-network', async (req, res) => {
  try {
    // In a real implementation, this would check the actual network
    // Here we're returning mock data for development
    res.json({
      success: true,
      networkInfo: {
        supported: true,
        current: 'Sepolia Testnet',
        chainId: 11155111
      }
    });
  } catch (error) {
    console.error('Error checking network:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking network',
      error: error.message
    });
  }
});

// Serve the main HTML file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
