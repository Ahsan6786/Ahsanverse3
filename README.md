# AhsanVerse Cryptocurrency Platform

AhsanVerse is a comprehensive cryptocurrency platform featuring token sales, wallet integration, and a responsive user interface.

## Features

- ERC20 token with built-in ICO functionality
- Direct token purchases with ETH
- MetaMask wallet integration
- User account management
- Transaction history tracking
- Real-time blockchain integration
- Responsive design for mobile and desktop
- AI-powered chat support

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Blockchain: Ethereum (Solidity, Hardhat)
- Authentication: JWT

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ahsanverse.git
cd ahsanverse
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ahsanverse_db

# JWT Secret
JWT_SECRET=your_secret_key

# Blockchain Deployment
PRIVATE_KEY=your_ethereum_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
INFURA_API_KEY=your_infura_api_key

# Server Configuration
PORT=3001
```

4. Set up the database:
```bash
node setup-database.js
```

## Smart Contract Deployment

### Local Development
1. Start local Ethereum network:
```bash
npm run node
```

2. Deploy contract to local network:
```bash
npm run deploy:local
```

### Testnet Deployment
Deploy to Sepolia testnet:
```bash
npm run deploy:testnet
```

### Mainnet Deployment
Deploy to Ethereum mainnet:
```bash
npm run deploy:mainnet
```

## Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Contract Verification

After deployment, verify your contract on Etherscan:
```bash
npx hardhat verify --network sepolia <contract_address>
```

## Production Deployment

1. Update the contract addresses in `blockchain.js`
2. Build the application:
```bash
npm run build
```

3. Deploy to your hosting provider.

## Security Considerations

- The private key in the `.env` file should be kept secure and never committed to version control
- For production, use environment variables provided by your hosting service
- Consider using a hardware wallet for mainnet deployments

## License

This project is licensed under the MIT License - see the LICENSE file for details. 