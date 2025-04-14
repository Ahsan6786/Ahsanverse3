let provider;
let signer;
let walletAddress;
let walletBalance;

// Token Contract Details
const TOKEN_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

// Standard ERC20 Token Contract ABI with Presale functionality
const TOKEN_ABI = [
    // ERC20 Standard Functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    
    // Presale Functions
    "function buyTokens() external payable",
    "function sellTokens(uint256 amount) external returns (bool)",
    "function setPresalePrice(uint256 _price) external",
    "function withdrawETH() external",
    "function getPresaleStats() view returns (uint256 raised, uint256 sold, uint256 remaining)",
    
    // Events
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost)",
    "event TokensSold(address indexed seller, uint256 amount, uint256 reward)"
];

// Token Configuration
const TOKEN_CONFIG = {
    name: 'AhsanVerse Token',
    symbol: 'AHV',
    decimals: 18,
    presalePrice: 0.05,
    nextStagePrice: 0.07,
    totalSupply: '531000000',
    presaleSupply: '265500000',
    
    // Updated URLs with correct GitHub paths
    logoUrl: 'https://raw.githubusercontent.com/Ahsan6786/token-assets/main/Ahsan_coin.png',
    whitepaperUrl: 'https://raw.githubusercontent.com/Ahsan6786/token-assets/main/whitepaper.pdf'
};

// Initialize all functionality when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const downloadWhitepaperButton = document.getElementById('downloadWhitepaper');
    const addToWalletButton = document.getElementById('addToWallet');
    const connectWalletButton = document.getElementById('connectWallet');
    const payAmountInput = document.getElementById('payAmount');
    const receiveAmountInput = document.getElementById('receiveAmount');
    const buyTokensButton = document.getElementById('buyTokens');
    const sellAmountInput = document.getElementById('sellAmount');
    const receiveEthAmountInput = document.getElementById('receiveEthAmount');
    const sellTokensButton = document.getElementById('sellTokens');
    const demoTokenPurchaseButton = document.getElementById('demoTokenPurchase');
    
    // Mobile Menu Elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');
    const navLinksItems = document.querySelectorAll('#navLinks a, #navLinks button');

    // Authentication Elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const closeModalButtons = document.querySelectorAll('.close-modal');

    // Update token information in UI
    updateTokenInfo();

    // Whitepaper download
    if (downloadWhitepaperButton) {
        downloadWhitepaperButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Download whitepaper clicked');
            window.open('https://raw.githubusercontent.com/Ahsan6786/token-assets/main/whitepaper.pdf', '_blank', 'noopener,noreferrer');
        });
    }

    // Add token to wallet
    if (addToWalletButton) {
        addToWalletButton.addEventListener('click', async () => {
            console.log('Add to wallet clicked');
            try {
                if (!window.ethereum) {
                    alert('Please install MetaMask to add tokens to your wallet');
                    return;
                }

                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    alert('Please connect your wallet first');
                    return;
                }

                const wasAdded = await window.ethereum.request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC20',
                        options: {
                            address: TOKEN_ADDRESS,
                            symbol: TOKEN_CONFIG.symbol,
                            decimals: TOKEN_CONFIG.decimals,
                            image: TOKEN_CONFIG.logoUrl,
                        },
                    },
                });

                if (wasAdded) {
                    alert('AHV Token was successfully added to MetaMask!');
                } else {
                    alert('User rejected adding the token.');
                }
            } catch (error) {
                console.error('Error adding token to wallet:', error);
                alert('Failed to add token to wallet. Please try again.');
            }
        });
    }

    // Connect wallet
    if (connectWalletButton) {
        connectWalletButton.addEventListener('click', connectWallet);
    }

    // Calculate tokens on ETH amount change
    if (payAmountInput) {
        payAmountInput.addEventListener('input', async (e) => {
            const ethAmount = parseFloat(e.target.value) || 0;
            const tokensToReceive = (ethAmount * 3000) / TOKEN_CONFIG.presalePrice; // Using fixed ETH price for now
            if (receiveAmountInput) {
                receiveAmountInput.value = tokensToReceive.toFixed(2);
            }
        });
    }

    // Calculate ETH on token amount change for selling
    if (sellAmountInput) {
        sellAmountInput.addEventListener('input', async (e) => {
            const tokenAmount = parseFloat(e.target.value) || 0;
            // Apply a 5% fee for selling tokens
            const ethToReceive = (tokenAmount * TOKEN_CONFIG.presalePrice) / 3000 * 0.95; 
            if (receiveEthAmountInput) {
                receiveEthAmountInput.value = ethToReceive.toFixed(6);
            }
        });
    }

    // Buy tokens
    if (buyTokensButton) {
        buyTokensButton.addEventListener('click', async () => {
            if (!window.ethereum) {
                alert('Please install MetaMask to buy tokens!');
                return;
            }

            try {
                const ethAmount = parseFloat(payAmountInput.value);
                if (!ethAmount || ethAmount <= 0) {
                    alert('Please enter a valid amount');
                    return;
                }

                // Check if wallet is connected
                if (!walletAddress) {
                    alert('Please connect your wallet first');
                    await connectWallet();
                    if (!walletAddress) return; // Exit if wallet connection failed
                }

                // Real blockchain transaction
                // First, create a contract instance
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
                
                // Convert ETH amount to Wei
                const weiAmount = ethers.utils.parseEther(ethAmount.toString());
                
                // Show processing message
                alert('Processing your transaction. Please confirm in MetaMask...');
                
                // Call the buyTokens function on the contract
                const transaction = await tokenContract.buyTokens({
                    value: weiAmount,
                    gasLimit: 300000 // Set appropriate gas limit
                });
                
                // Wait for transaction to be mined
                const receipt = await transaction.wait();
                
                // Get token amount from transaction events
                let tokenAmount = 0;
                const transferEvent = receipt.events.find(event => event.event === 'TokensPurchased');
                if (transferEvent && transferEvent.args) {
                    tokenAmount = parseFloat(ethers.utils.formatUnits(transferEvent.args.amount, 18));
                } else {
                    // If event not found, calculate based on price
                    tokenAmount = (ethAmount * 3000) / TOKEN_CONFIG.presalePrice;
                }
                
                // Add transaction to history if user is logged in
                const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
                if (currentUser && currentUser.loggedIn) {
                    // Add transaction with completed status
                    addTransaction('Purchase', tokenAmount, 'AHV', 'Completed');
                    
                    // Update token balance
                    const userTokenBalance = document.getElementById('userTokenBalance');
                    if (userTokenBalance) {
                        // Get actual token balance from blockchain
                        try {
                            const balance = await tokenContract.balanceOf(walletAddress);
                            const formattedBalance = parseFloat(ethers.utils.formatUnits(balance, 18)).toFixed(2);
                            userTokenBalance.textContent = formattedBalance;
                        } catch (error) {
                            console.error('Error fetching token balance:', error);
                        }
                    }
                }
                
                // Show success message
                alert(`Transaction successful! You have purchased ${tokenAmount.toFixed(2)} AHV tokens. Transaction hash: ${receipt.transactionHash}`);
                
                // Update UI
                updateUI();
            } catch (error) {
                console.error('Error buying tokens:', error);
                alert(`Transaction failed: ${error.message || 'Unknown error'}`);
            }
        });
    }

    // Sell tokens
    if (sellTokensButton) {
        sellTokensButton.addEventListener('click', async () => {
            if (!window.ethereum) {
                alert('Please install MetaMask to sell tokens!');
                return;
            }

            try {
                const tokenAmount = parseFloat(sellAmountInput.value);
                if (!tokenAmount || tokenAmount <= 0) {
                    alert('Please enter a valid amount of tokens to sell');
                    return;
                }

                // Check if wallet is connected
                if (!walletAddress) {
                    alert('Please connect your wallet first');
                    await connectWallet();
                    if (!walletAddress) return; // Exit if wallet connection failed
                }

                // Create contract instance
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
                
                // First check if user has enough tokens
                const balance = await tokenContract.balanceOf(walletAddress);
                const formattedBalance = parseFloat(ethers.utils.formatUnits(balance, 18));
                
                if (formattedBalance < tokenAmount) {
                    alert(`You don't have enough tokens. Your balance: ${formattedBalance.toFixed(2)} AHV`);
                    return;
                }
                
                // Convert token amount to Wei (with 18 decimals)
                const tokenAmountWei = ethers.utils.parseUnits(tokenAmount.toString(), 18);
                
                // Show processing message
                alert('Processing your sell transaction. Please confirm in MetaMask...');
                
                // Call the sellTokens function on the contract
                const transaction = await tokenContract.sellTokens(tokenAmountWei, {
                    gasLimit: 300000 // Set appropriate gas limit
                });
                
                // Wait for transaction to be mined
                const receipt = await transaction.wait();
                
                // Calculate ETH received (could also get from events)
                const ethReceived = parseFloat(receiveEthAmountInput.value);
                
                // Add transaction to history if user is logged in
                const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
                if (currentUser && currentUser.loggedIn) {
                    // Add transaction with completed status
                    addTransaction('Sell', tokenAmount, 'AHV', 'Completed');
                    
                    // Update token balance
                    const userTokenBalance = document.getElementById('userTokenBalance');
                    if (userTokenBalance) {
                        // Get actual token balance from blockchain
                        try {
                            const newBalance = await tokenContract.balanceOf(walletAddress);
                            const formattedNewBalance = parseFloat(ethers.utils.formatUnits(newBalance, 18)).toFixed(2);
                            userTokenBalance.textContent = formattedNewBalance;
                        } catch (error) {
                            console.error('Error fetching token balance:', error);
                        }
                    }
                }
                
                // Show success message
                alert(`Transaction successful! You have sold ${tokenAmount.toFixed(2)} AHV tokens for approximately ${ethReceived.toFixed(6)} ETH. Transaction hash: ${receipt.transactionHash}`);
                
                // Update UI
                updateUI();
                
                // Clear input fields
                sellAmountInput.value = '';
                receiveEthAmountInput.value = '';
                
            } catch (error) {
                console.error('Error selling tokens:', error);
                alert(`Transaction failed: ${error.message || 'Unknown error'}`);
            }
        });
    }

    // Modal functionality
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginModal.style.display = 'block';
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            registerModal.style.display = 'block';
        });
    }
    
    if (showRegisterForm) {
        showRegisterForm.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            registerModal.style.display = 'block';
        });
    }
    
    if (showLoginForm) {
        showLoginForm.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.style.display = 'none';
            loginModal.style.display = 'block';
        });
    }
    
    // Close modals
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });

    // Mobile Menu Toggle
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        navLinksItems.forEach(item => {
            item.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
});

// Update token information in UI
function updateTokenInfo() {
    // Update all price displays
    document.querySelectorAll('.current-price p').forEach(el => {
        el.textContent = `$${TOKEN_CONFIG.presalePrice}`;
    });
    document.querySelectorAll('.next-price p').forEach(el => {
        el.textContent = `$${TOKEN_CONFIG.nextStagePrice}`;
    });
    
    // Update total supply
    document.querySelectorAll('.total-supply').forEach(el => {
        el.textContent = `${parseInt(TOKEN_CONFIG.totalSupply).toLocaleString()} ${TOKEN_CONFIG.symbol}`;
    });
}

// Update presale progress
function updatePresaleProgress() {
    const raisedAmount = document.getElementById('raisedAmount');
    const tokensSold = document.getElementById('tokensSold');
    const progressBar = document.querySelector('.progress');
    
    // These values should come from your smart contract
    const totalRaised = 0; // Example value
    const totalGoal = 250000;
    const soldTokens = 0; // Example value
    
    raisedAmount.textContent = `$${totalRaised.toLocaleString()}`;
    tokensSold.textContent = soldTokens.toLocaleString();
    progressBar.style.width = `${(totalRaised / totalGoal) * 100}%`;
}

// Update progress every 30 seconds
updatePresaleProgress();
setInterval(updatePresaleProgress, 30000);

// Animate timeline items on scroll
const timelineItems = document.querySelectorAll('.timeline-item');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.5 });

timelineItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'all 0.6s ease';
    observer.observe(item);
});

// Check if MetaMask is installed
const checkMetaMask = () => {
    if (typeof window.ethereum !== 'undefined') {
        return true;
    }
    alert('Please install MetaMask to use this application!');
    return false;
};

// Connect to MetaMask
const connectWallet = async () => {
    if (!checkMetaMask()) return;

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        walletAddress = accounts[0];
        
        // Create provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        // Get ETH balance
        const balance = await provider.getBalance(walletAddress);
        walletBalance = ethers.utils.formatEther(balance);

        // Get network information
        const network = await provider.getNetwork();
        updateNetworkInfo(network);

        // Update UI
        updateUI();

        // Set up balance refresh
        setInterval(async () => {
            try {
                const newBalance = await provider.getBalance(walletAddress);
                walletBalance = ethers.utils.formatEther(newBalance);
                document.getElementById('walletBalance').textContent = parseFloat(walletBalance).toFixed(4);
            } catch (error) {
                console.error('Error updating balance:', error);
            }
        }, 5000);

    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
    }
};

// Update network information
const updateNetworkInfo = (network) => {
    const networkName = document.getElementById('networkName');
    switch (network.chainId) {
        case 1:
            networkName.textContent = 'Ethereum Mainnet';
            break;
        case 11155111:
            networkName.textContent = 'Sepolia Testnet';
            break;
        case 5:
            networkName.textContent = 'Goerli Testnet';
            break;
        default:
            networkName.textContent = 'Unknown Network';
    }
};

// Update UI with wallet information
const updateUI = () => {
    const walletInfo = document.getElementById('walletInfo');
    const addressElement = document.getElementById('walletAddress');
    const balanceElement = document.getElementById('walletBalance');
    const connectButton = document.getElementById('connectWallet');

    if (walletAddress) {
        walletInfo.style.display = 'block';
        addressElement.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
        balanceElement.textContent = parseFloat(walletBalance).toFixed(4);
        connectButton.textContent = 'Connected';
        connectButton.disabled = true;
    }
};

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
            // User disconnected their wallet
            location.reload();
        } else {
            // User switched accounts
            walletAddress = accounts[0];
            const balance = await provider.getBalance(walletAddress);
            walletBalance = ethers.utils.formatEther(balance);
            updateUI();
        }
    });

    window.ethereum.on('chainChanged', () => {
        // Reload the page when network changes
        location.reload();
    });

    // Handle network changes
    window.ethereum.on('networkChanged', async (networkId) => {
        const network = await provider.getNetwork();
        updateNetworkInfo(network);
    });
}

// Initialize animation on scroll
window.addEventListener('scroll', () => {
    const features = document.querySelectorAll('.feature-card');
    features.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        if (cardTop < window.innerHeight * 0.8) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
});

// Modal and authentication functionality
// Close modal buttons
if (document.querySelectorAll('.close-modal')) {
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            if (document.getElementById('loginModal')) document.getElementById('loginModal').style.display = 'none';
            if (document.getElementById('registerModal')) document.getElementById('registerModal').style.display = 'none';
        });
    });
}

// Login button click event
if (document.getElementById('loginBtn')) {
    document.getElementById('loginBtn').addEventListener('click', () => {
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        
        if (currentUser && currentUser.loggedIn) {
            // User is logged in, so log them out
            localStorage.removeItem('ahsanverseCurrentUser');
            alert('You have been logged out.');
            updateAuthUI();
        } else {
            // Show login modal
            document.getElementById('loginModal').style.display = 'block';
            if (document.getElementById('registerModal')) document.getElementById('registerModal').style.display = 'none';
        }
    });
}

// Register button click event
if (document.getElementById('registerBtn')) {
    document.getElementById('registerBtn').addEventListener('click', () => {
        document.getElementById('registerModal').style.display = 'block';
        if (document.getElementById('loginModal')) document.getElementById('loginModal').style.display = 'none';
    });
}

// Switch between login/register forms
if (document.getElementById('showRegisterForm')) {
    document.getElementById('showRegisterForm').addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('registerModal').style.display = 'block';
    });
}

if (document.getElementById('showLoginForm')) {
    document.getElementById('showLoginForm').addEventListener('click', () => {
        document.getElementById('registerModal').style.display = 'none';
        document.getElementById('loginModal').style.display = 'block';
    });
}

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('loginModal')) {
        document.getElementById('loginModal').style.display = 'none';
    }
    if (event.target === document.getElementById('registerModal')) {
        document.getElementById('registerModal').style.display = 'none';
    }
});

// Function to update UI based on authentication state
function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userDashboard = document.getElementById('userDashboard');
    const walletInfo = document.getElementById('walletInfo');
    
    if (currentUser && currentUser.loggedIn) {
        // User is logged in
        if (loginBtn) loginBtn.textContent = 'Logout';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Show user dashboard
        if (userDashboard) userDashboard.style.display = 'block';
        if (walletInfo) walletInfo.style.display = 'block';
        
        // Update user information in dashboard
        updateUserDashboard(currentUser);
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.textContent = 'Login';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        
        // Hide user dashboard
        if (userDashboard) userDashboard.style.display = 'none';
        if (walletInfo) walletInfo.style.display = 'none';
    }
}

// Function to update user dashboard with user information
function updateUserDashboard(user) {
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmailInput = document.getElementById('userEmailInput');
    const userDisplayNameInput = document.getElementById('userDisplayNameInput');
    
    if (userDisplayName) userDisplayName.textContent = user.name;
    if (userEmailInput) userEmailInput.value = user.email;
    if (userDisplayNameInput) userDisplayNameInput.value = user.name;
    
    // Load user transactions from localStorage
    loadUserTransactions();
    
    // Set up user settings form
    setupUserSettingsForm();
    
    // Initialize staking data
    initializeStakingData();
}

// Function to load user transactions from localStorage
function loadUserTransactions() {
    const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
    const transactionHistory = document.getElementById('transactionHistory');
    
    if (!transactionHistory || !currentUser.email) return;
    
    // Get user transactions from localStorage or initialize empty array
    const transactions = JSON.parse(localStorage.getItem(`ahsanverse_transactions_${currentUser.email}`) || '[]');
    
    // Clear existing transactions
    transactionHistory.innerHTML = '';
    
    if (transactions.length === 0) {
        // Show no transactions message
        transactionHistory.innerHTML = `
            <tr class="no-transactions">
                <td colspan="4">No transactions yet</td>
            </tr>
        `;
        return;
    }
    
    // Add transactions to the table
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString()}</td>
            <td>${transaction.type}</td>
            <td>${transaction.amount} ${transaction.token}</td>
            <td>${transaction.status}</td>
        `;
        transactionHistory.appendChild(row);
    });
}

// Function to set up user settings form
function setupUserSettingsForm() {
    const userSettingsForm = document.getElementById('userSettingsForm');
    
    if (!userSettingsForm) return;
    
    userSettingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        const userDisplayNameInput = document.getElementById('userDisplayNameInput');
        const userNotifications = document.getElementById('userNotifications');
        
        if (!currentUser.email) return;
        
        // Update user information
        currentUser.name = userDisplayNameInput.value;
        currentUser.notifications = userNotifications.value;
        
        // Save updated user information
        localStorage.setItem('ahsanverseCurrentUser', JSON.stringify(currentUser));
        
        // Update users array
        const users = JSON.parse(localStorage.getItem('ahsanverseUsers') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        
        if (userIndex !== -1) {
            users[userIndex].name = currentUser.name;
            users[userIndex].notifications = currentUser.notifications;
            localStorage.setItem('ahsanverseUsers', JSON.stringify(users));
        }
        
        // Update UI
        updateAuthUI();
        
        // Show success message
        alert('Settings updated successfully!');
    });
}

// Function to add a transaction to user's history
function addTransaction(type, amount, token, status) {
    const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
    
    if (!currentUser.email) return;
    
    // Get user transactions from localStorage or initialize empty array
    const transactions = JSON.parse(localStorage.getItem(`ahsanverse_transactions_${currentUser.email}`) || '[]');
    
    // Add new transaction
    transactions.push({
        date: new Date().toISOString(),
        type,
        amount,
        token,
        status
    });
    
    // Save updated transactions
    localStorage.setItem(`ahsanverse_transactions_${currentUser.email}`, JSON.stringify(transactions));
    
    // Reload transactions in UI
    loadUserTransactions();
}

// Modify the buyTokens event listener to add transaction
if (document.getElementById('buyTokens')) {
    const originalBuyTokensListener = document.getElementById('buyTokens').onclick;
    
    document.getElementById('buyTokens').addEventListener('click', async () => {
        const payAmountInput = document.getElementById('payAmount');
        const receiveAmountInput = document.getElementById('receiveAmount');
        
        if (!payAmountInput || !receiveAmountInput) return;
        
        const ethAmount = parseFloat(payAmountInput.value);
        const tokenAmount = parseFloat(receiveAmountInput.value);
        
        if (!ethAmount || !tokenAmount) return;
        
        // Add transaction to history after purchase attempt
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        
        if (currentUser && currentUser.loggedIn) {
            // Add transaction with pending status
            addTransaction('Purchase', tokenAmount, 'AHV', 'Pending');
            
            // Update token balance (simulated)
            const userTokenBalance = document.getElementById('userTokenBalance');
            if (userTokenBalance) {
                const currentBalance = parseFloat(userTokenBalance.textContent) || 0;
                userTokenBalance.textContent = (currentBalance + tokenAmount).toFixed(2);
            }
            
            // After a delay, update transaction to completed (simulated blockchain confirmation)
            setTimeout(() => {
                // Get the latest transactions
                const transactions = JSON.parse(localStorage.getItem(`ahsanverse_transactions_${currentUser.email}`) || '[]');
                
                // Find the pending transaction and update it
                const pendingIndex = transactions.findIndex(t => t.status === 'Pending');
                if (pendingIndex !== -1) {
                    transactions[pendingIndex].status = 'Completed';
                    localStorage.setItem(`ahsanverse_transactions_${currentUser.email}`, JSON.stringify(transactions));
                    
                    // Reload transactions in UI
                    loadUserTransactions();
                }
            }, 5000); // Simulate 5-second blockchain confirmation
        }
    });
}

// Add Demo Purchase Button functionality
if (document.getElementById('demoTokenPurchase')) {
    document.getElementById('demoTokenPurchase').addEventListener('click', function(e) {
        e.preventDefault();
        
        const payAmountInput = document.getElementById('payAmount');
        const receiveAmountInput = document.getElementById('receiveAmount');
        
        if (!payAmountInput || !receiveAmountInput) {
            alert('Please enter an amount first');
            return;
        }
        
        const ethAmount = parseFloat(payAmountInput.value);
        const tokenAmount = parseFloat(receiveAmountInput.value);
        
        if (!ethAmount || ethAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Show processing message
        alert('Processing your purchase in demo mode (no actual ETH will be spent)');
        
        // Add transaction to history if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        if (currentUser && currentUser.loggedIn) {
            // Add transaction with pending status
            addTransaction('Demo Purchase', tokenAmount, 'AHV', 'Pending');
            
            // Update token balance (simulated)
            const userTokenBalance = document.getElementById('userTokenBalance');
            if (userTokenBalance) {
                const currentBalance = parseFloat(userTokenBalance.textContent) || 0;
                userTokenBalance.textContent = (currentBalance + tokenAmount).toFixed(2);
            }
            
            // After a delay, update transaction to completed (simulated blockchain confirmation)
            setTimeout(() => {
                // Get the latest transactions
                const transactions = JSON.parse(localStorage.getItem(`ahsanverse_transactions_${currentUser.email}`) || '[]');
                
                // Find the pending transaction and update it
                const pendingIndex = transactions.findIndex(t => t.status === 'Pending');
                if (pendingIndex !== -1) {
                    transactions[pendingIndex].status = 'Completed';
                    localStorage.setItem(`ahsanverse_transactions_${currentUser.email}`, JSON.stringify(transactions));
                    
                    // Reload transactions in UI
                    loadUserTransactions();
                }
            }, 3000); // Simulate 3-second blockchain confirmation
        } else {
            alert('Please log in first to track your purchases');
        }
        
        // Show success message after a short delay
        setTimeout(() => {
            alert(`Transaction successful! You have purchased ${tokenAmount} AHV tokens.`);
        }, 1500);
    });
}

// Whitepaper integration
if (document.getElementById('downloadWhitepaper')) {
    document.getElementById('downloadWhitepaper').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Fetch the whitepaper content from the markdown file
        fetch('whitepaper.md')
            .then(response => response.text())
            .then(data => {
                // Create a blob with the markdown content
                const blob = new Blob([data], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                
                // Create a temporary link and trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = 'AhsanVerse_Whitepaper.md';
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Add download to transaction history if user is logged in
                const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
                if (currentUser && currentUser.loggedIn) {
                    addTransaction('Download', 1, 'Whitepaper', 'Completed');
                }
            })
            .catch(error => {
                console.error('Error downloading whitepaper:', error);
                alert('Failed to download whitepaper. Please try again.');
            });
    });
}

// Staking functionality
// Initialize staking data for user
function initializeStakingData() {
    const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
    
    if (!currentUser.email) return;
    
    // Check if user has staking data
    let stakingData = JSON.parse(localStorage.getItem(`ahsanverse_staking_${currentUser.email}`) || 'null');
    
    // If no staking data exists, initialize it
    if (!stakingData) {
        stakingData = {
            stakedAmount: 0,
            rewards: 0,
            lastUpdateTime: new Date().getTime(),
            apy: 12 // 12% APY
        };
        
        localStorage.setItem(`ahsanverse_staking_${currentUser.email}`, JSON.stringify(stakingData));
    }
    
    // Update UI with staking data
    updateStakingUI(stakingData);
    
    // Start rewards calculation timer
    startRewardsTimer();
}

// Update staking UI with data
function updateStakingUI(stakingData) {
    const stakingBalance = document.getElementById('stakingBalance');
    const stakingRewards = document.getElementById('stakingRewards');
    const stakingAPY = document.getElementById('stakingAPY');
    const availableRewards = document.getElementById('availableRewards');
    
    if (stakingBalance) stakingBalance.textContent = stakingData.stakedAmount.toFixed(2);
    if (stakingRewards) stakingRewards.textContent = stakingData.rewards.toFixed(4);
    if (stakingAPY) stakingAPY.textContent = stakingData.apy;
    if (availableRewards) availableRewards.textContent = stakingData.rewards.toFixed(4);
}

// Calculate rewards based on staked amount, APY, and time elapsed
function calculateRewards() {
    const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
    
    if (!currentUser.email) return;
    
    const stakingData = JSON.parse(localStorage.getItem(`ahsanverse_staking_${currentUser.email}`) || 'null');
    
    if (!stakingData) return;
    
    const now = new Date().getTime();
    const timeElapsed = (now - stakingData.lastUpdateTime) / (1000 * 60 * 60 * 24 * 365); // in years
    const newRewards = stakingData.stakedAmount * (stakingData.apy / 100) * timeElapsed;
    
    // Update rewards
    stakingData.rewards += newRewards;
    stakingData.lastUpdateTime = now;
    
    // Save updated staking data
    localStorage.setItem(`ahsanverse_staking_${currentUser.email}`, JSON.stringify(stakingData));
    
    // Update UI
    updateStakingUI(stakingData);
}

// Start rewards calculation timer
function startRewardsTimer() {
    // Calculate rewards every 30 seconds (simulating real-time rewards accrual)
    setInterval(calculateRewards, 30000);
    
    // Calculate initial rewards
    calculateRewards();
}

// Stake tokens
if (document.getElementById('stakeTokens')) {
    document.getElementById('stakeTokens').addEventListener('click', function() {
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        
        if (!currentUser.email) {
            alert('Please log in to stake tokens.');
            return;
        }
        
        const stakeAmount = parseFloat(document.getElementById('stakeAmount').value);
        
        if (!stakeAmount || stakeAmount <= 0) {
            alert('Please enter a valid amount to stake.');
            return;
        }
        
        // Get user token balance
        const userTokenBalance = parseFloat(document.getElementById('userTokenBalance').textContent) || 0;
        
        // Check if user has enough tokens
        if (stakeAmount > userTokenBalance) {
            alert('Insufficient token balance. Please purchase more tokens or enter a smaller amount.');
            return;
        }
        
        // Get staking data
        const stakingData = JSON.parse(localStorage.getItem(`ahsanverse_staking_${currentUser.email}`) || '{}');
        
        // Calculate rewards before adding new stake
        calculateRewards();
        
        // Update staked amount
        stakingData.stakedAmount += stakeAmount;
        
        // Save updated staking data
        localStorage.setItem(`ahsanverse_staking_${currentUser.email}`, JSON.stringify(stakingData));
        
        // Update user token balance
        document.getElementById('userTokenBalance').textContent = (userTokenBalance - stakeAmount).toFixed(2);
        
        // Update staking UI
        updateStakingUI(stakingData);
        
        // Add transaction
        addTransaction('Stake', stakeAmount, 'AHV', 'Completed');
        
        // Reset input field
        document.getElementById('stakeAmount').value = '';
        
        // Show success message
        alert(`Successfully staked ${stakeAmount} AHV tokens.`);
    });
}

// Unstake tokens
if (document.getElementById('unstakeTokens')) {
    document.getElementById('unstakeTokens').addEventListener('click', function() {
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        
        if (!currentUser.email) {
            alert('Please log in to unstake tokens.');
            return;
        }
        
        const unstakeAmount = parseFloat(document.getElementById('unstakeAmount').value);
        
        if (!unstakeAmount || unstakeAmount <= 0) {
            alert('Please enter a valid amount to unstake.');
            return;
        }
        
        // Get staking data
        const stakingData = JSON.parse(localStorage.getItem(`ahsanverse_staking_${currentUser.email}`) || '{}');
        
        // Calculate rewards before unstaking
        calculateRewards();
        
        // Check if user has enough staked tokens
        if (unstakeAmount > stakingData.stakedAmount) {
            alert('Cannot unstake more than your staked amount.');
            return;
        }
        
        // Update staked amount
        stakingData.stakedAmount -= unstakeAmount;
        
        // Save updated staking data
        localStorage.setItem(`ahsanverse_staking_${currentUser.email}`, JSON.stringify(stakingData));
        
        // Update user token balance
        const userTokenBalance = parseFloat(document.getElementById('userTokenBalance').textContent) || 0;
        document.getElementById('userTokenBalance').textContent = (userTokenBalance + unstakeAmount).toFixed(2);
        
        // Update staking UI
        updateStakingUI(stakingData);
        
        // Add transaction
        addTransaction('Unstake', unstakeAmount, 'AHV', 'Completed');
        
        // Reset input field
        document.getElementById('unstakeAmount').value = '';
        
        // Show success message
        alert(`Successfully unstaked ${unstakeAmount} AHV tokens.`);
    });
}

// Claim rewards
if (document.getElementById('claimRewards')) {
    document.getElementById('claimRewards').addEventListener('click', function() {
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        
        if (!currentUser.email) {
            alert('Please log in to claim rewards.');
            return;
        }
        
        // Get staking data
        const stakingData = JSON.parse(localStorage.getItem(`ahsanverse_staking_${currentUser.email}`) || '{}');
        
        // Calculate latest rewards
        calculateRewards();
        
        // Check if there are rewards to claim
        if (stakingData.rewards <= 0) {
            alert('No rewards available to claim.');
            return;
        }
        
        // Get reward amount
        const rewardAmount = stakingData.rewards;
        
        // Reset rewards
        stakingData.rewards = 0;
        
        // Save updated staking data
        localStorage.setItem(`ahsanverse_staking_${currentUser.email}`, JSON.stringify(stakingData));
        
        // Update user token balance
        const userTokenBalance = parseFloat(document.getElementById('userTokenBalance').textContent) || 0;
        document.getElementById('userTokenBalance').textContent = (userTokenBalance + rewardAmount).toFixed(2);
        
        // Update staking UI
        updateStakingUI(stakingData);
        
        // Add transaction
        addTransaction('Claim Rewards', rewardAmount, 'AHV', 'Completed');
        
        // Show success message
        alert(`Successfully claimed ${rewardAmount.toFixed(4)} AHV tokens in rewards.`);
    });
}

// Login form submission
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Here you would typically send this data to a server
        // For demo purposes, we'll just log the user in locally
        if (email && password) {
            // Check if user exists in localStorage
            const users = JSON.parse(localStorage.getItem('ahsanverseUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Store login status
                localStorage.setItem('ahsanverseCurrentUser', JSON.stringify({
                    name: user.name,
                    email: user.email,
                    loggedIn: true
                }));
                
                // Update UI to show logged-in state
                updateAuthUI();
                
                // Close the modal
                document.getElementById('loginModal').style.display = 'none';
                
                // Show success message
                alert('Login successful! Welcome back, ' + user.name);
            } else {
                alert('Invalid email or password. Please try again.');
            }
        }
    });
}

// Register form submission
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Basic validation
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        // Here you would typically send this data to a server
        // For demo purposes, we'll store in localStorage
        if (name && email && password) {
            // Get existing users or initialize empty array
            const users = JSON.parse(localStorage.getItem('ahsanverseUsers') || '[]');
            
            // Check if user already exists
            if (users.some(user => user.email === email)) {
                alert('User with this email already exists!');
                return;
            }
            
            // Add new user
            users.push({
                name,
                email,
                password // Note: In a real app, NEVER store passwords in plain text
            });
            
            // Save back to localStorage
            localStorage.setItem('ahsanverseUsers', JSON.stringify(users));
            
            // Auto login the user
            localStorage.setItem('ahsanverseCurrentUser', JSON.stringify({
                name,
                email,
                loggedIn: true
            }));
            
            // Update UI
            updateAuthUI();
            
            // Close the modal
            document.getElementById('registerModal').style.display = 'none';
            
            // Show success message
            alert('Registration successful! Welcome to AhsanVerse, ' + name);
        }
    });
}

// Check initial auth state on page load
updateAuthUI();