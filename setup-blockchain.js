const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up blockchain development environment...');

// Create directories
const directories = [
  'contracts',
  'scripts',
  'test',
  'artifacts'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Create mock artifacts directory structure
const artifactsDir = path.join(__dirname, 'artifacts', 'contracts', 'AhsanVerseToken.sol');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Create mock ABI file
const mockAbiPath = path.join(artifactsDir, 'AhsanVerseToken.json');
const mockAbi = {
  abi: [
    // Standard ERC20 Functions
    {
      "inputs": [],
      "name": "name",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "uint256", "name": "amount", "type": "uint256" }
      ],
      "name": "transfer",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    // Token Sale Functions
    {
      "inputs": [],
      "name": "buyTokens",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "ethAmount", "type": "uint256" }],
      "name": "getTokenAmount",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTokenPrice",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTokensSold",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRemainingTokens",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMinContribution",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMaxContribution",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "isSaleActive",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    // Events
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "ethAmount", "type": "uint256" },
        { "indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
      ],
      "name": "TokensPurchased",
      "type": "event"
    }
  ],
  bytecode: "0x608060405234801561001057600080fd5b50610c8a806100206000396000f3fe60806040..."
};

fs.writeFileSync(mockAbiPath, JSON.stringify(mockAbi, null, 2));
console.log(`Created mock ABI file: ${mockAbiPath}`);

// Install blockchain dependencies if needed
try {
  console.log('Checking for required dependencies...');
  
  // Check if hardhat is installed
  const packageJsonPath = path.join(__dirname, 'package.json');
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let needsInstall = false;
  const requiredDeps = [
    '@openzeppelin/contracts',
    '@nomiclabs/hardhat-ethers',
    '@nomiclabs/hardhat-waffle',
    'hardhat'
  ];
  
  requiredDeps.forEach(dep => {
    if (!(dep in packageJson.dependencies || dep in packageJson.devDependencies)) {
      console.log(`Missing dependency: ${dep}`);
      needsInstall = true;
    }
  });
  
  if (needsInstall) {
    console.log('Installing missing dependencies...');
    execSync('npm install --save-dev hardhat @nomiclabs/hardhat-waffle @nomiclabs/hardhat-ethers ethereum-waffle chai @openzeppelin/contracts', 
      { stdio: 'inherit' });
    console.log('Dependencies installed successfully.');
  } else {
    console.log('All dependencies already installed.');
  }
  
} catch (error) {
  console.error('Error installing dependencies:', error);
}

console.log('Blockchain environment setup complete!');
console.log('You can now run:');
console.log('  npm run dev     - Start the development server');
console.log('  npm run compile - Compile the smart contracts (once you have Hardhat installed)');
console.log('  npm run deploy:local - Deploy contracts to local Hardhat network');
console.log('  npm run deploy:testnet - Deploy contracts to testnet'); 