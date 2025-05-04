const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Load ABI from artifacts directory
let contractABI;
try {
    const abiPath = path.join(__dirname, 'artifacts', 'contracts', 'AhsanVerseToken.sol', 'AhsanVerseToken.json');
    const abiJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    contractABI = abiJson.abi;
} catch (error) {
    console.error('Error loading contract ABI, using fallback:', error.message);
    // Fallback ABI if file not found
    contractABI = [
        // Standard ERC20 Functions
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        
        // Token Sale Functions
        "function buyTokens() external payable",
        "function getTokenAmount(uint256 ethAmount) external view returns (uint256)",
        "function getTokenPrice() external view returns (uint256)",
        "function getTokensSold() external view returns (uint256)",
        "function getRemainingTokens() external view returns (uint256)",
        "function getMaxContribution() external view returns (uint256)",
        "function getMinContribution() external view returns (uint256)",
        "function isSaleActive() external view returns (bool)",
        
        // Events
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount)"
    ];
}

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  1: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Mainnet (placeholder)
  5: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Goerli (placeholder)
  11155111: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Sepolia (placeholder)
  1337: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Local development
};

// Get contract address based on network ID
function getContractAddress(networkId) {
  return CONTRACT_ADDRESSES[networkId] || CONTRACT_ADDRESSES[1];
}

// Get provider based on network
async function getProvider() {
  // Check if MetaMask is installed
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return new ethers.providers.Web3Provider(window.ethereum);
    } catch (error) {
      console.error('User denied account access');
      throw new Error('User denied account access');
    }
  } else {
    // If MetaMask is not installed, use a fallback provider
    return new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/' + process.env.INFURA_API_KEY);
  }
}

// Get signer from provider
async function getSigner(provider) {
  if (!provider) {
    provider = await getProvider();
  }
  return provider.getSigner();
}

// Get contract instance
async function getContract(signer) {
  if (!signer) {
    const provider = await getProvider();
    signer = await getSigner(provider);
  }
  
  const networkId = (await signer.provider.getNetwork()).chainId;
  const contractAddress = getContractAddress(networkId);
  
  return new ethers.Contract(contractAddress, contractABI, signer);
}

// Get token information
async function getTokenInfo() {
  try {
    const provider = await getProvider();
    const networkId = (await provider.getNetwork()).chainId;
    const contractAddress = getContractAddress(networkId);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    return {
      name: await contract.name(),
      symbol: await contract.symbol(),
      totalSupply: ethers.utils.formatUnits(await contract.totalSupply(), 18),
      tokenPrice: ethers.utils.formatEther(await contract.getTokenPrice()),
      tokensSold: ethers.utils.formatUnits(await contract.getTokensSold(), 18),
      remainingTokens: ethers.utils.formatUnits(await contract.getRemainingTokens(), 18),
      minContribution: ethers.utils.formatEther(await contract.getMinContribution()),
      maxContribution: ethers.utils.formatEther(await contract.getMaxContribution()),
      saleActive: await contract.isSaleActive(),
      contractAddress: contractAddress,
      networkId: networkId
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    
    // Return placeholder data for development
    return {
      name: 'AhsanVerse Token',
      symbol: 'AHV',
      totalSupply: '531000000',
      tokenPrice: '0.00033',
      tokensSold: '0',
      remainingTokens: '265500000',
      minContribution: '0.01',
      maxContribution: '10',
      saleActive: true,
      contractAddress: CONTRACT_ADDRESSES[1],
      networkId: 1
    };
  }
}

// Get user token balance
async function getUserTokenBalance(address) {
  try {
    const provider = await getProvider();
    const contract = new ethers.Contract(
      getContractAddress((await provider.getNetwork()).chainId),
      contractABI,
      provider
    );
    
    const balance = await contract.balanceOf(address);
    return ethers.utils.formatUnits(balance, 18);
  } catch (error) {
    console.error("Error getting user token balance:", error);
    return '0';
  }
}

// Buy tokens
async function buyTokens(ethAmount) {
  try {
    const signer = await getSigner();
    const contract = await getContract(signer);
    
    // Convert ETH amount to Wei
    const weiAmount = ethers.utils.parseEther(ethAmount.toString());
    
    // Get estimated gas
    const gasEstimate = await contract.estimateGas.buyTokens({ value: weiAmount });
    
    // Call the buyTokens function
    const tx = await contract.buyTokens({
      value: weiAmount,
      gasLimit: gasEstimate.mul(120).div(100) // Add 20% to gas estimate
    });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Check for TokensPurchased event
    const event = receipt.events.find(event => event.event === 'TokensPurchased');
    if (event) {
      return {
        success: true,
        txHash: receipt.transactionHash,
        tokenAmount: ethers.utils.formatUnits(event.args.tokenAmount, 18),
        ethAmount: ethers.utils.formatEther(event.args.ethAmount)
      };
    } else {
      return {
        success: true,
        txHash: receipt.transactionHash,
        tokenAmount: '0',
        ethAmount: ethAmount
      };
    }
  } catch (error) {
    console.error("Error buying tokens:", error);
    throw error;
  }
}

// Add tokens to MetaMask
async function addTokenToWallet() {
  try {
    if (window.ethereum) {
      const tokenInfo = await getTokenInfo();
      
      // Request wallet to add token
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenInfo.contractAddress,
            symbol: tokenInfo.symbol,
            decimals: 18,
            image: 'https://raw.githubusercontent.com/Ahsan6786/token-assets/main/Ahsan_coin.png',
          },
        },
      });
      
      return wasAdded;
    } else {
      throw new Error('MetaMask is not installed');
    }
  } catch (error) {
    console.error("Error adding token to wallet:", error);
    throw error;
  }
}

// Connect to wallet
async function connectWallet() {
  try {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      
      // Get network info
      const network = await provider.getNetwork();
      
      return {
        address,
        balance: ethers.utils.formatEther(balance),
        network: network.name,
        chainId: network.chainId
      };
    } else {
      throw new Error('MetaMask is not installed');
    }
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}

// Check if connected to the right network
async function checkNetwork() {
  try {
    const provider = await getProvider();
    const network = await provider.getNetwork();
    
    // Check if contract exists on this network
    const contractAddress = getContractAddress(network.chainId);
    
    if (!contractAddress) {
      return {
        supported: false,
        current: network.name,
        required: 'Ethereum Mainnet'
      };
    }
    
    return {
      supported: true,
      current: network.name,
      chainId: network.chainId
    };
  } catch (error) {
    console.error("Error checking network:", error);
    return {
      supported: false,
      error: error.message
    };
  }
}

// Switch to a supported network
async function switchNetwork(chainId) {
  try {
    if (!window.ethereum) throw new Error('MetaMask is not installed');
    
    // Try to switch to the requested chain
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.utils.hexValue(chainId) }],
      });
    } catch (switchError) {
      // If the chain is not added to MetaMask, prompt to add it
      if (switchError.code === 4902) {
        // Define network parameters
        let params;
        
        if (chainId === 5) { // Goerli
          params = {
            chainId: ethers.utils.hexValue(5),
            chainName: 'Goerli Test Network',
            nativeCurrency: {
              name: 'Goerli ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://goerli.infura.io/v3/'],
            blockExplorerUrls: ['https://goerli.etherscan.io']
          };
        } else if (chainId === 11155111) { // Sepolia
          params = {
            chainId: ethers.utils.hexValue(11155111),
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          };
        } else if (chainId === 1) { // Mainnet
          params = {
            chainId: ethers.utils.hexValue(1),
            chainName: 'Ethereum Mainnet',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io']
          };
        } else {
          throw new Error('Unsupported network requested');
        }
        
        // Add the network to MetaMask
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [params],
        });
      } else {
        throw switchError;
      }
    }
    
    // Return updated network status
    return await checkNetwork();
  } catch (error) {
    console.error("Error switching network:", error);
    throw error;
  }
}

module.exports = {
  getProvider,
  getSigner,
  getContract,
  getTokenInfo,
  getUserTokenBalance,
  buyTokens,
  addTokenToWallet,
  connectWallet,
  checkNetwork,
  switchNetwork
}; 