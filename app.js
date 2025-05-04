let provider;
let signer;
let walletAddress;
let walletBalance;
let tokenContract;

// Token Contract Details
const contractAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Placeholder, will be replaced
const contractABI = [
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
    
    // Mobile Menu Elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');
    const navLinksItems = document.querySelectorAll('#navLinks a, #navLinks button');

    // Chat Support Elements
    const chatSupportIcon = document.getElementById('chatSupportIcon');
    const chatWidget = document.getElementById('chatWidget');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const sendMessage = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

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
                            address: contractAddress,
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
            
            if (ethAmount <= 0) {
                receiveAmountInput.value = "0";
                return;
            }
            
            try {
                if (window.ethereum && walletAddress) {
                    // Use the contract to get actual token amount
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const tokenContract = new ethers.Contract(contractAddress, contractABI, provider);
                    
                    try {
                        // Convert ETH to Wei for the contract call
                        const weiAmount = ethers.utils.parseEther(ethAmount.toString());
                        
                        // Call the contract to get token amount
                        const tokenAmountBN = await tokenContract.getTokenAmount(weiAmount);
                        const tokenAmount = parseFloat(ethers.utils.formatUnits(tokenAmountBN, 18));
                        
                        if (receiveAmountInput) {
                            receiveAmountInput.value = tokenAmount.toFixed(2);
                        }
                    } catch (error) {
                        console.log("Contract call failed, using fixed exchange rate");
                        // Use fixed exchange rate for development
                        const tokenAmount = ethAmount * 3000; // 1 ETH = 3000 AHV tokens
                        receiveAmountInput.value = tokenAmount.toFixed(2);
                    }
                } else {
                    // Fallback calculation if wallet not connected
                    const estimatedTokens = ethAmount * 3000; // Default rate
                    if (receiveAmountInput) {
                        receiveAmountInput.value = estimatedTokens.toFixed(2);
                    }
                }
            } catch (error) {
                console.error("Error calculating token amount:", error);
                // Fallback calculation
                const estimatedTokens = ethAmount * 3000;
                if (receiveAmountInput) {
                    receiveAmountInput.value = estimatedTokens.toFixed(2);
                }
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

            const buyButton = document.getElementById('buyTokens');
            const originalButtonText = buyButton.textContent;

            try {
                const ethAmount = parseFloat(payAmountInput.value);
                if (!ethAmount || ethAmount <= 0) {
                    alert('Please enter a valid amount');
                    return;
                }

                // Get estimated token amount
                const tokenAmount = parseFloat(receiveAmountInput.value);
                if (!tokenAmount || tokenAmount <= 0) {
                    alert('Error calculating token amount');
                    return;
                }

                // Check if wallet is connected
                if (!walletAddress) {
                    alert('Please connect your wallet first');
                    await connectWallet();
                    if (!walletAddress) return; // Exit if wallet connection failed
                }

                // Show loading state
                buyButton.textContent = 'Processing...';
                buyButton.disabled = true;
                
                // Show processing message in UI
                const statusMessage = document.createElement('div');
                statusMessage.className = 'status-message';
                statusMessage.textContent = 'Transaction pending... Please confirm in MetaMask';
                buyButton.parentNode.appendChild(statusMessage);
                
                // Add transaction to history with pending status if user is logged in
                const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
                let transactionRecord = null;
                
                try {
                    // Record transaction if user is logged in
                    if (currentUser && currentUser.loggedIn) {
                        transactionRecord = await addTransaction('Purchase', tokenAmount, 'AHV', 'Pending');
                        console.log('Transaction record created:', transactionRecord);
                    }
                    
                    // Get token information
                    const result = await fetch('/api/token-info');
                    const tokenInfoData = await result.json();
                    
                    if (!tokenInfoData.success) {
                        throw new Error("Could not fetch token information");
                    }
                    
                    const tokenInfo = tokenInfoData.tokenInfo;
                    
                    // For development mode, simulate a transaction after a delay
                    // In a real deployment, this would be replaced with actual blockchain calls
                    
                    // Update UI to show transaction is in progress
                    statusMessage.textContent = 'Sending transaction to blockchain...';
                    
                    // Wait for a short delay to simulate blockchain processing
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Generate mock transaction hash for development mode
                    const txHash = "0x" + Array(64).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                    
                    // Update transaction status if user is logged in
                    if (currentUser && currentUser.loggedIn && transactionRecord) {
                        const updateResult = await updateTransactionStatus(transactionRecord.id, 'Completed', txHash);
                        console.log('Transaction status updated:', updateResult);
                    }
                    
                    // Update UI elements
                    statusMessage.textContent = 'Transaction successful!';
                    statusMessage.style.color = '#00cc66';
                    
                    // Show transaction details
                    alert(`Transaction successful!\n\nYou purchased ${tokenAmount.toFixed(2)} AHV tokens\nTransaction hash: ${txHash}`);
                    
                    // Remove status message after a delay
                    setTimeout(() => {
                        statusMessage.remove();
                    }, 5000);
                    
                    // Update token sold counter
                    const tokensSoldElement = document.getElementById('tokensSold');
                    if (tokensSoldElement) {
                        const currentSold = parseFloat(tokensSoldElement.textContent.replace(/[^0-9.]/g, '')) || 0;
                        tokensSoldElement.textContent = `${(currentSold + tokenAmount).toFixed(0)} AHV`;
                    }
                    
                    // Update raised amount
                    const raisedElement = document.getElementById('raisedAmount');
                    if (raisedElement) {
                        const currentRaised = parseFloat(raisedElement.textContent.replace(/[^0-9.]/g, '')) || 0;
                        const newRaised = currentRaised + (ethAmount * 2000); // Converting ETH to USD at rate of 1 ETH = $2000
                        raisedElement.textContent = `$${newRaised.toLocaleString()}`;
                        
                        // Update progress bar
                        const progressBar = document.querySelector('.progress');
                        if (progressBar) {
                            progressBar.style.width = `${Math.min((newRaised / 250000) * 100, 100)}%`;
                        }
                    }
                    
                    // Update user token balance
                    const userTokenBalance = document.getElementById('userTokenBalance');
                    if (userTokenBalance) {
                        const currentBalance = parseFloat(userTokenBalance.textContent) || 0;
                        userTokenBalance.textContent = (currentBalance + tokenAmount).toFixed(2);
                    }
                    
                    // Clear input fields
                    payAmountInput.value = '';
                    receiveAmountInput.value = '';
                    
                    // Update any other UI elements
                    updateUI();
                    
                } catch (error) {
                    console.error("Error during token purchase:", error);
                    statusMessage.textContent = 'Error occurred: ' + (error.message || 'Unknown error');
                    statusMessage.style.color = '#ff3333';
                    
                    // Update transaction status if it was created
                    if (currentUser && currentUser.loggedIn && transactionRecord) {
                        updateTransactionStatus(transactionRecord.id, 'Failed');
                    }
                    
                    // Remove status message after a delay
                    setTimeout(() => {
                        statusMessage.remove();
                    }, 5000);
                }
                
                // Reset button state
                buyButton.textContent = originalButtonText;
                buyButton.disabled = false;
                
            } catch (error) {
                console.error('Error in buy tokens process:', error);
                alert('An error occurred: ' + (error.message || 'Unknown error'));
                
                // Reset button state
                if (buyButton) {
                    buyButton.textContent = originalButtonText;
                    buyButton.disabled = false;
                }
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
                const tokenContract = new ethers.Contract(contractAddress, contractABI, signer);
                
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

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            
            if (!email || !password) {
                alert('Please enter both email and password');
                return;
            }
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    alert(data.message || 'Login failed. Please check your credentials.');
                    return;
                }
                
                // Store user info and token in localStorage
                localStorage.setItem('ahsanverseToken', data.token);
                localStorage.setItem('ahsanverseCurrentUser', JSON.stringify({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    loggedIn: true
                }));
                
                // Close the modal
                loginModal.style.display = 'none';
                
                // Update UI to show logged in state
                updateAuthUI();
                
                alert('Login successful!');
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }
    
    // Registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();
            
            if (!name || !email || !password || !confirmPassword) {
                alert('Please fill in all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    alert(data.message || 'Registration failed. Please try again.');
                    return;
                }
                
                // Store user info and token in localStorage
                localStorage.setItem('ahsanverseToken', data.token);
                localStorage.setItem('ahsanverseCurrentUser', JSON.stringify({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    loggedIn: true
                }));
                
                // Close the modal
                registerModal.style.display = 'none';
                
                // Update UI to show logged in state
                updateAuthUI();
                
                alert('Registration successful!');
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }

    // Forgot Password Implementation
    const showForgotPassword = document.getElementById('showForgotPassword');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const verifyOTPSection = document.getElementById('verifyOTPSection');
    const resetPasswordSection = document.getElementById('resetPasswordSection');
    
    // Show forgot password modal
    if (showForgotPassword) {
        showForgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            forgotPasswordModal.style.display = 'block';
        });
    }
    
    // Back to login from forgot password
    const backToLogin = document.getElementById('backToLogin');
    if (backToLogin) {
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordModal.style.display = 'none';
            loginModal.style.display = 'block';
        });
    }
    
    // Forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value.trim();
            if (!email) {
                alert('Please enter your email address');
                return;
            }
            
            try {
                const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Sending...';
                submitButton.disabled = true;
                
                const response = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                // Reset button state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                
                if (response.ok) {
                    // Store email for next steps
                    localStorage.setItem('resetEmail', email);
                    
                    // Close forgot password modal and open reset password modal
                    forgotPasswordModal.style.display = 'none';
                    resetPasswordModal.style.display = 'block';
                    
                    // Show verify OTP section, hide reset password section
                    if (verifyOTPSection) verifyOTPSection.style.display = 'block';
                    if (resetPasswordSection) resetPasswordSection.style.display = 'none';
                    
                    // Set email in reset form
                    const resetEmailInput = document.getElementById('resetEmail');
                    if (resetEmailInput) resetEmailInput.value = email;
                    
                    alert('An OTP has been sent to your email address. Please check your inbox.');
                    
                    // If in development mode and OTP is included in response
                    if (data.otp) {
                        console.log('Development OTP:', data.otp);
                    }
                } else {
                    alert(data.message || 'Failed to send OTP. Please try again.');
                }
            } catch (error) {
                console.error('Error sending OTP:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }
    
    // Verify OTP form submission
    const verifyOTPForm = document.getElementById('verifyOTPForm');
    if (verifyOTPForm) {
        verifyOTPForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value.trim();
            const otp = document.getElementById('verificationCode').value.trim();
            
            if (!email || !otp) {
                alert('Please enter your email and verification code');
                return;
            }
            
            try {
                const submitButton = verifyOTPForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Verifying...';
                submitButton.disabled = true;
                
                const response = await fetch('/api/verify-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, otp })
                });
                
                const data = await response.json();
                
                // Reset button state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                
                if (data.success) {
                    // Store verified OTP for password reset
                    localStorage.setItem('verifiedOTP', otp);
                    
                    // Hide verify OTP section, show reset password section
                    if (verifyOTPSection) verifyOTPSection.style.display = 'none';
                    if (resetPasswordSection) resetPasswordSection.style.display = 'block';
                } else {
                    alert(data.message || 'Invalid verification code. Please try again.');
                }
            } catch (error) {
                console.error('Error verifying OTP:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }
    
    // Reset password form submission
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value.trim();
            const otp = localStorage.getItem('verifiedOTP');
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (!email || !otp || !newPassword || !confirmNewPassword) {
                alert('Please fill in all fields');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                alert('Passwords do not match');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }
            
            try {
                const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Resetting...';
                submitButton.disabled = true;
                
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, otp, newPassword })
                });
                
                const data = await response.json();
                
                // Reset button state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                
                if (data.success) {
                    // Clear stored email and OTP
                    localStorage.removeItem('resetEmail');
                    localStorage.removeItem('verifiedOTP');
                    
                    // Close reset password modal
                    resetPasswordModal.style.display = 'none';
                    
                    // Show login modal
                    loginModal.style.display = 'block';
                    
                    alert('Password reset successful. You can now login with your new password.');
                } else {
                    alert(data.message || 'Failed to reset password. Please try again.');
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }

    // Function to update UI based on authentication status
    function updateAuthUI() {
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        
        if (currentUser && currentUser.loggedIn) {
            // If user is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            
            // Create and show user info/logout button if it doesn't exist
            let userInfoBtn = document.getElementById('userInfoBtn');
            if (!userInfoBtn) {
                userInfoBtn = document.createElement('button');
                userInfoBtn.id = 'userInfoBtn';
                userInfoBtn.className = 'auth-btn';
                userInfoBtn.innerHTML = `<span>${currentUser.name}</span>`;
                
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logoutBtn';
                logoutBtn.className = 'auth-btn';
                logoutBtn.textContent = 'Logout';
                
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('ahsanverseToken');
                    localStorage.removeItem('ahsanverseCurrentUser');
                    location.reload();
                });
                
                const navLinks = document.getElementById('navLinks');
                if (navLinks) {
                    navLinks.insertBefore(userInfoBtn, connectWalletButton);
                    navLinks.insertBefore(logoutBtn, connectWalletButton);
                }
            }
        } else {
            // If user is not logged in
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            
            // Remove user info/logout button if they exist
            const userInfoBtn = document.getElementById('userInfoBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (userInfoBtn) userInfoBtn.remove();
            if (logoutBtn) logoutBtn.remove();
        }
    }
    
    // Call updateAuthUI on page load
    updateAuthUI();

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

    // Chat Support Functionality
    if (chatSupportIcon && chatWidget) {
        // Create conversation memory
        const conversationContext = {
            messageCount: 0,
            lastTopic: null,
            userName: null,
            askedAbout: {
                tokens: false,
                buying: false,
                wallet: false,
                price: false
            },
            suggestedTopics: []
        };
        
        // Toggle chat widget visibility
        chatSupportIcon.addEventListener('click', function() {
            chatWidget.classList.add('active');
            chatInput.focus();
            
            // If first time opening, send welcome message after a delay if no messages
            if (conversationContext.messageCount === 0) {
                setTimeout(() => {
                    if (conversationContext.messageCount === 0) {
                        const welcomeMessage = document.createElement('div');
                        welcomeMessage.classList.add('message', 'support-message');
                        welcomeMessage.innerHTML = 'Welcome to AhsanVerse Support! How can I assist you today? Feel free to ask about tokens, investing, our platform, or anything else.';
                        
                        const messageTime = document.createElement('div');
                        messageTime.classList.add('message-time');
                        messageTime.textContent = 'Just now';
                        welcomeMessage.appendChild(messageTime);
                        
                        chatMessages.appendChild(welcomeMessage);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        conversationContext.messageCount++;
                    }
                }, 1000);
            }
        });
        
        // Close chat widget
        chatClose.addEventListener('click', function() {
            chatWidget.classList.remove('active');
        });
        
        // Send message function
        function sendUserMessage() {
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Add user message to chat
            const userMessageElement = document.createElement('div');
            userMessageElement.classList.add('message', 'user-message');
            
            const messageText = document.createElement('span');
            messageText.textContent = message;
            userMessageElement.appendChild(messageText);
            
            const messageTime = document.createElement('div');
            messageTime.classList.add('message-time');
            messageTime.textContent = 'Just now';
            userMessageElement.appendChild(messageTime);
            
            chatMessages.appendChild(userMessageElement);
            conversationContext.messageCount++;
            
            // Extract user name if provided
            if (!conversationContext.userName) {
                const nameMatch = message.match(/my name is (\w+)|i am (\w+)|i'm (\w+)/i);
                if (nameMatch) {
                    const name = nameMatch[1] || nameMatch[2] || nameMatch[3];
                    if (name) {
                        conversationContext.userName = name.charAt(0).toUpperCase() + name.slice(1);
                    }
                }
            }
            
            // Clear input
            chatInput.value = '';
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Show typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.classList.add('typing-indicator');
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            chatMessages.appendChild(typingIndicator);
            
            // Scroll to bottom again to show typing indicator
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Process the message and generate a response
            // Vary the response time to simulate real AI thinking (between 1-3 seconds)
            const responseTime = 1000 + Math.random() * 2000;
            setTimeout(() => processMessage(message, typingIndicator), responseTime);
        }
        
        // Process message and generate response
        function processMessage(message, typingIndicator) {
            // Analyze message for context
            updateConversationContext(message);
            
            // Remove typing indicator after a delay to simulate AI processing
            setTimeout(() => {
                if (typingIndicator && typingIndicator.parentNode) {
                    typingIndicator.remove();
                }
                
                // Generate response based on user message and context
                const response = generateAIResponse(message);
                
                // Add support message to chat
                const supportMessageElement = document.createElement('div');
                supportMessageElement.classList.add('message', 'support-message');
                
                // Personalize message if we know the user's name
                let responseText = response;
                if (conversationContext.userName && Math.random() > 0.7) {
                    // Only sometimes add the name to avoid overusing it
                    responseText = `${conversationContext.userName}, ${response.charAt(0).toLowerCase() + response.slice(1)}`;
                }
                
                // Display response with typing effect
                const messageText = document.createElement('span');
                supportMessageElement.appendChild(messageText);
                
                const messageTime = document.createElement('div');
                messageTime.classList.add('message-time');
                messageTime.textContent = 'Just now';
                supportMessageElement.appendChild(messageTime);
                
                chatMessages.appendChild(supportMessageElement);
                
                // Simulate AI typing effect
                const words = responseText.split(' ');
                let wordIndex = 0;
                
                function typeNextWord() {
                    if (wordIndex < words.length) {
                        if (wordIndex === 0) {
                            messageText.textContent = words[wordIndex];
                        } else {
                            messageText.textContent += ' ' + words[wordIndex];
                        }
                        wordIndex++;
                        
                        // Random typing speed between 50-100ms per word
                        const typingSpeed = 30 + Math.random() * 70;
                        setTimeout(typeNextWord, typingSpeed);
                        
                        // Scroll as typing happens
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    } else {
                        // Maybe add follow-up suggestion after a short delay
                        if (conversationContext.messageCount > 1 && Math.random() > 0.6) {
                            setTimeout(() => {
                                addSuggestion();
                            }, 2000);
                        }
                    }
                }
                
                // Start typing effect
                typeNextWord();
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 500);
        }
        
        // Update conversation context based on message content
        function updateConversationContext(message) {
            const lowerMessage = message.toLowerCase();
            
            // Track topics asked about
            if (lowerMessage.match(/\b(token|ahv|coin)\b/i)) {
                conversationContext.askedAbout.tokens = true;
                conversationContext.lastTopic = 'tokens';
            } else if (lowerMessage.match(/\b(buy|purchase|get|acquire)\b/i)) {
                conversationContext.askedAbout.buying = true;
                conversationContext.lastTopic = 'buying';
            } else if (lowerMessage.match(/\b(wallet|metamask|connect)\b/i)) {
                conversationContext.askedAbout.wallet = true;
                conversationContext.lastTopic = 'wallet';
            } else if (lowerMessage.match(/\b(price|cost|worth|value|how much)\b/i)) {
                conversationContext.askedAbout.price = true;
                conversationContext.lastTopic = 'price';
            }
            
            // Generate suggested topics they haven't asked about yet
            conversationContext.suggestedTopics = [];
            if (!conversationContext.askedAbout.tokens) {
                conversationContext.suggestedTopics.push('our token utility');
            }
            if (!conversationContext.askedAbout.buying) {
                conversationContext.suggestedTopics.push('how to buy AHV tokens');
            }
            if (!conversationContext.askedAbout.wallet) {
                conversationContext.suggestedTopics.push('connecting your wallet');
            }
            if (!conversationContext.askedAbout.price) {
                conversationContext.suggestedTopics.push('token pricing');
            }
        }
        
        // Add a suggestion message (AI proactively suggesting topics)
        function addSuggestion() {
            // Only suggest if we have topics to suggest
            if (conversationContext.suggestedTopics.length === 0) return;
            
            // Pick a random suggestion from the available ones
            const suggestionIndex = Math.floor(Math.random() * conversationContext.suggestedTopics.length);
            const suggestion = conversationContext.suggestedTopics[suggestionIndex];
            
            // Remove this suggestion so we don't repeat it
            conversationContext.suggestedTopics.splice(suggestionIndex, 1);
            
            // Create suggestion message with typing effect
            const typingIndicator = document.createElement('div');
            typingIndicator.classList.add('typing-indicator');
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            chatMessages.appendChild(typingIndicator);
            
            // Scroll to show typing indicator
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Add the suggestion after a delay
            setTimeout(() => {
                typingIndicator.remove();
                
                const suggestionMessage = document.createElement('div');
                suggestionMessage.classList.add('message', 'support-message');
                
                let suggestionText = '';
                if (conversationContext.messageCount < 3) {
                    suggestionText = `Would you like to learn more about ${suggestion}?`;
                } else if (conversationContext.lastTopic === 'buying') {
                    suggestionText = `Now that you know about buying tokens, would you also be interested in learning about ${suggestion}?`;
                } else if (conversationContext.lastTopic === 'tokens') {
                    suggestionText = `While we're discussing tokens, I can also explain ${suggestion} if you're interested.`;
                } else if (conversationContext.lastTopic === 'wallet') {
                    suggestionText = `After connecting your wallet, many users also ask about ${suggestion}. Would you like to know more?`;
                } else if (conversationContext.lastTopic === 'price') {
                    suggestionText = `Beyond pricing, I can also tell you about ${suggestion} if that would be helpful.`;
                } else {
                    suggestionText = `By the way, I can also provide information about ${suggestion} if you're interested.`;
                }
                
                // Display with typing effect
                const messageText = document.createElement('span');
                suggestionMessage.appendChild(messageText);
                
                const messageTime = document.createElement('div');
                messageTime.classList.add('message-time');
                messageTime.textContent = 'Just now';
                suggestionMessage.appendChild(messageTime);
                
                chatMessages.appendChild(suggestionMessage);
                
                // Implement typing effect
                const words = suggestionText.split(' ');
                let wordIndex = 0;
                
                function typeNextWord() {
                    if (wordIndex < words.length) {
                        if (wordIndex === 0) {
                            messageText.textContent = words[wordIndex];
                        } else {
                            messageText.textContent += ' ' + words[wordIndex];
                        }
                        wordIndex++;
                        
                        // Random typing speed
                        const typingSpeed = 30 + Math.random() * 50;
                        setTimeout(typeNextWord, typingSpeed);
                        
                        // Scroll as typing happens
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
                
                // Start typing effect
                typeNextWord();
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1500);
        }
        
        // Generate response with AI-like NLP capabilities
        function generateAIResponse(message) {
            const lowerMessage = message.toLowerCase();
            
            // Check for AI-specific questions
            if (lowerMessage.match(/\b(are you ai|are you a bot|are you human|are you real|who made you|how do you work)\b/i)) {
                const aiResponses = [
                    "I'm an AI assistant for AhsanVerse, trained to provide helpful information about our platform and tokens. While I'm not human, I'm designed to be conversational and informative!",
                    "I'm a specialized AI built to support AhsanVerse users. I analyze your questions using natural language processing to provide the most relevant information about our ecosystem.",
                    "I'm an AI support assistant for AhsanVerse. I use machine learning to understand your questions and provide helpful responses. Is there something specific about our platform you'd like to know?"
                ];
                return aiResponses[Math.floor(Math.random() * aiResponses.length)];
            }
            
            // Greeting patterns with variation
            if (message.match(/\b(hi|hello|hey|greetings|howdy)\b/i)) {
                const greetings = [
                    "Hello there! How can I assist you with AhsanVerse today?",
                    "Hi! Welcome to AhsanVerse support. What can I help you with?",
                    "Hey! I'm here to help with any questions about AhsanVerse or AHV tokens. What would you like to know?"
                ];
                return greetings[Math.floor(Math.random() * greetings.length)];
            }
            
            // Thank you patterns
            if (message.match(/\b(thanks|thank you|thx|thank)\b/i)) {
                const thanks = [
                    "You're welcome! Is there anything else I can help you with?",
                    "Happy to help! Let me know if you have any other questions.",
                    "Anytime! Feel free to ask if you need anything else about AhsanVerse."
                ];
                return thanks[Math.floor(Math.random() * thanks.length)];
            }
            
            // Pricing questions
            if (message.match(/\b(price|cost|worth|value|how much)\b/i) && message.match(/\b(token|ahv|coin)\b/i)) {
                return "The current price of AHV token is $0.05 during our presale phase. It will increase to $0.07 in the next stage. This is an excellent opportunity to invest before the price increases!";
            }
            
            // How to buy questions with detailed instructions
            if (message.match(/\b(how|way|process).*(buy|purchase|get|acquire)\b/i) || 
                (message.match(/\b(buy|purchase|get|acquire)\b/i) && message.match(/\b(token|ahv|coin)\b/i))) {
                const buyResponses = [
                    "To buy AHV tokens: 1) Click the 'Connect Wallet' button at the top to connect your MetaMask, 2) Enter the amount of ETH you want to spend in the 'Buy AHV Tokens' section, 3) Click 'Buy Tokens' and confirm the transaction in your wallet. Let me know if you need help with any step!",
                    "Buying AHV is simple! First connect your MetaMask wallet using the button at the top, then enter your ETH amount in the purchase section. The system will automatically calculate the AHV tokens you'll receive. When ready, click 'Buy Tokens' and approve the transaction in MetaMask. Need any clarification?"
                ];
                return buyResponses[Math.floor(Math.random() * buyResponses.length)];
            }
            
            // Wallet connection help
            if (message.match(/\b(connect|connecting|setup|link).*(wallet|metamask)\b/i) || 
                message.match(/\b(wallet|metamask).*(connect|connecting|setup|link)\b/i)) {
                return "To connect your wallet, click the 'Connect Wallet' button in the top navigation bar. You'll need to have MetaMask installed in your browser. When prompted, select your account and approve the connection. If you don't have MetaMask yet, you can download it from metamask.io and set up an account first. Need help installing MetaMask?";
            }
            
            // Token utility/purpose questions
            if (message.match(/\b(what|why|how).*(use|using|used|utility|purpose)\b/i) && 
                message.match(/\b(token|ahv|coin)\b/i)) {
                return "AHV tokens have multiple utilities within our ecosystem: 1) Governance rights allowing you to vote on platform decisions, 2) Staking rewards with our current 12% APY, 3) Access to premium features and services on the platform, and 4) Transaction fee discounts. As our platform grows, we'll be adding more utility to increase token value.";
            }
            
            // Tokenomics detailed explanation
            if (message.match(/\b(tokenomics|distribution|allocation|supply)\b/i)) {
                return "Our tokenomics are designed for long-term growth: Total supply is 531,000,000 AHV tokens. Distribution: 50% (265.5M) for presale, 20% for liquidity and exchanges, 15% for team and advisors (locked for 2 years with gradual release), 10% for platform development, and 5% for marketing. This structure ensures a fair launch while supporting sustainable development.";
            }
            
            // Roadmap questions with detailed timeline
            if (message.match(/\b(roadmap|timeline|plan|future|coming|next)\b/i)) {
                return "Our roadmap includes: Q2 2023: Token presale and initial platform development. Q3 2023: DEX listings and major CEX partnerships. Q4 2023: Full platform launch with core features. Q1 2024: Enhanced staking rewards and expanded ecosystem partnerships. Q2 2024: Cross-chain implementation and advanced features rollout. We're currently in the presale phase, exactly on schedule!";
            }
            
            // Staking questions with detailed information
            if (message.match(/\b(stake|staking|reward|apy|interest|earn)\b/i)) {
                return "AHV staking offers a generous 12% APY currently. Once your wallet is connected, navigate to the User Dashboard and use the staking section. You can stake any amount of AHV tokens with no lock-up period, and rewards accrue in real-time. The APY is subject to adjustment based on network growth, but early stakers will receive loyalty bonuses in future distributions.";
            }
            
            // Team/founder questions
            if (message.match(/\b(team|founder|who|behind|creator|ceo|lead)\b/i)) {
                return "AhsanVerse was founded by Ahsan Imam Khan, a visionary entrepreneur and blockchain enthusiast from India. He assembled a team of experienced developers, financial experts, and blockchain specialists with backgrounds from various major tech companies and DeFi projects. The team is committed to creating a decentralized ecosystem that empowers users through innovative blockchain solutions.";
            }
            
            // Security questions
            if (message.match(/\b(secure|security|safe|audit|risk)\b/i)) {
                return "Security is our top priority. Our smart contracts have undergone thorough auditing by independent third-party security firms. We implement industry-standard security practices including multi-signature wallets for treasury funds, timelocks for critical contract functions, and regular security updates. The team tokens are locked in a vesting contract to ensure long-term alignment with the project.";
            }
            
            // Project concept questions
            if (message.match(/\b(what is|about|concept|purpose|goal|aim).*(project|ahsanverse)\b/i)) {
                return "AhsanVerse is a pioneering blockchain platform that combines decentralized finance (DeFi) with real-world applications. Our mission is to create a seamless bridge between traditional finance and blockchain technology, making crypto accessible to everyone. We focus on three pillars: security, scalability, and user experience, to bring mainstream adoption to blockchain solutions.";
            }
            
            // Registration process
            if (message.match(/\b(register|registration|sign up|account|create account)\b/i)) {
                return "To register on AhsanVerse, click the 'Register' button in the navigation bar. You'll need to provide your name, email, and create a secure password. After registration, you can connect your wallet and access additional features like transaction history, token dashboard, and staking. Your account helps you track your investments and engagement with the platform.";
            }
            
            // Help or assistance
            if (message.match(/\b(help|support|assist|guidance|problem|issue)\b/i)) {
                return "I'm here to help! Please describe what you need assistance with in detail, and I'll guide you through it. Common areas I can help with include wallet connection, token purchases, staking process, account setup, or any technical issues you might encounter. For specialized support, you can also email support@ahsanverse.com.";
            }

            // Investment potential
            if (message.match(/\b(invest|investing|investment|profit|return|gain|growth|potential)\b/i)) {
                return "AHV tokens offer significant growth potential due to our innovative technology and strong adoption strategy. We're creating real utility through our platform services, staking rewards, and governance features. While we can't promise specific returns (as all investments carry risk), our tokenomics are designed for long-term value appreciation with controlled supply and increasing demand as our ecosystem expands.";
            }
            
            // Whitepaper and documentation
            if (message.match(/\b(whitepaper|documentation|docs|paper|technical|details)\b/i)) {
                return "Our comprehensive whitepaper is available for download by clicking the 'Download Whitepaper' button at the bottom of the page. It contains detailed information about our technology, tokenomics, use cases, roadmap, and team. For technical documentation, we maintain a GitHub repository with our code and API documentation at github.com/ahsanverse (public repositories only).";
            }
            
            // Contract or smart contract questions
            if (message.match(/\b(contract|smart contract|code|address|verification)\b/i)) {
                return "Our smart contracts are deployed on the Ethereum blockchain and fully verified on Etherscan. The token contract address is 0x742d35Cc6634C0532925a3b844Bc454e4438f44e (this is a placeholder). You can view the contract source code, transactions, and token holders on Etherscan. We've implemented the ERC-20 standard with additional security features like pause functionality and timelocked admin controls.";
            }
            
            // Social media or community
            if (message.match(/\b(community|social|twitter|telegram|discord|follow|group|chat)\b/i)) {
                return "Join our vibrant community! Follow us on Twitter at twitter.com/khan143262, join our Telegram group for live discussions at t.me/ahsanverse, and subscribe to our Medium blog for detailed updates at medium.com/ahsanverse. We also host weekly AMAs (Ask Me Anything) sessions where you can directly interact with the team and get your questions answered.";
            }
            
            // AI or bot specific questions
            if (message.match(/\b(use ai|ai powered|artificial intelligence|machine learning|nlp)\b/i)) {
                return "Yes, I use natural language processing and machine learning to understand your questions and provide relevant responses. My AI capabilities include context tracking, sentiment analysis, and personalized responses. I continuously learn from interactions to better assist AhsanVerse users, though I'm specifically trained to provide information about our platform and cryptocurrency.";
            }
            
            // Fallback with conversation starters
            const fallbacks = [
                "I'd be happy to tell you more about AhsanVerse. Would you like to know about our tokenomics, roadmap, or how to buy AHV tokens?",
                "Thanks for reaching out! I can help with questions about buying tokens, connecting wallets, our technology, or investment opportunities. What would you like to explore?",
                "I'm here to assist with any AhsanVerse questions. Popular topics include token utility, staking rewards, and our roadmap. What can I help you discover?",
                "Thank you for your message. I can provide information about AHV tokens, our platform features, or technical details. Is there a specific aspect of AhsanVerse you'd like to learn more about?"
            ];
            
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
        
        // Event listeners for sending messages
        sendMessage.addEventListener('click', sendUserMessage);
        
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendUserMessage();
            }
        });
        
        // Update message times periodically
        setInterval(() => {
            const times = document.querySelectorAll('.message-time');
            times.forEach((time, index) => {
                if (index < times.length - 3) { // Don't update the latest few messages
                    if (time.textContent === 'Just now') {
                        time.textContent = '1m ago';
                    } else if (time.textContent === '1m ago') {
                        time.textContent = '5m ago';
                    } else if (time.textContent === '5m ago') {
                        time.textContent = '10m ago';
                    }
                }
            });
        }, 60000); // Update every minute
    }
});

// Update token information in UI
async function updateTokenInfo() {
    try {
        // Fetch token information from API
        const response = await fetch('/api/token-info');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error fetching token info:', data.message);
            updateTokenInfoWithFallback();
            return;
        }
        
        const tokenInfo = data.tokenInfo;
        
        // Update UI elements
        const tokenInfoElements = {
            tokenPrice: document.getElementById('tokenPrice'),
            tokensSold: document.getElementById('tokensSold'),
            tokensRemaining: document.getElementById('tokensRemaining'),
            saleProgress: document.getElementById('saleProgress')
        };
        
        if (tokenInfoElements.tokenPrice) {
            tokenInfoElements.tokenPrice.textContent = `${parseFloat(tokenInfo.tokenPrice).toFixed(6)} ETH`;
        }
        
        if (tokenInfoElements.tokensSold) {
            tokenInfoElements.tokensSold.textContent = `${parseFloat(tokenInfo.tokensSold).toFixed(0)} AHV`;
        }
        
        if (tokenInfoElements.tokensRemaining) {
            tokenInfoElements.tokensRemaining.textContent = `${parseFloat(tokenInfo.remainingTokens).toFixed(0)} AHV`;
        }
        
        // Calculate and update sale progress
        if (tokenInfoElements.saleProgress) {
            const totalPresale = 265500000;
            const soldAmount = parseFloat(tokenInfo.tokensSold);
            const progressPercentage = (soldAmount / totalPresale) * 100;
            tokenInfoElements.saleProgress.style.width = `${progressPercentage}%`;
        }
        
        // Update contract address display if available
        const contractAddressElement = document.getElementById('contractAddress');
        if (contractAddressElement && tokenInfo.contractAddress) {
            contractAddressElement.textContent = tokenInfo.contractAddress;
            contractAddressElement.href = getExplorerUrl(tokenInfo.networkId, tokenInfo.contractAddress);
        }
        
    } catch (error) {
        console.error('Error updating token information:', error);
        updateTokenInfoWithFallback();
    }
}

// Fallback function for token info if API fails
function updateTokenInfoWithFallback() {
    const tokenInfoElements = {
        tokenPrice: document.getElementById('tokenPrice'),
        tokensSold: document.getElementById('tokensSold'),
        tokensRemaining: document.getElementById('tokensRemaining'),
        saleProgress: document.getElementById('saleProgress')
    };
    
    if (tokenInfoElements.tokenPrice) {
        tokenInfoElements.tokenPrice.textContent = '0.00033 ETH';
    }
    
    // Use token sold display from the UI if available
    const tokensSoldValue = tokenInfoElements.tokensSold ? 
        tokenInfoElements.tokensSold.textContent : '0 AHV';
    
    // Remaining tokens calculation
    const totalPresale = 265500000;
    const soldAmount = parseInt(tokensSoldValue.replace(/[^0-9]/g, '')) || 0;
    const remainingAmount = totalPresale - soldAmount;
    
    if (tokenInfoElements.tokensRemaining) {
        tokenInfoElements.tokensRemaining.textContent = `${remainingAmount.toLocaleString()} AHV`;
    }
    
    // Update progress bar
    if (tokenInfoElements.saleProgress) {
        const progressPercentage = (soldAmount / totalPresale) * 100;
        tokenInfoElements.saleProgress.style.width = `${progressPercentage}%`;
    }
}

// Get blockchain explorer URL based on network ID
function getExplorerUrl(networkId, address) {
    switch(networkId) {
        case 1:
            return `https://etherscan.io/token/${address}`;
        case 5:
            return `https://goerli.etherscan.io/token/${address}`;
        case 11155111:
            return `https://sepolia.etherscan.io/token/${address}`;
        default:
            return '#';
    }
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
        // Show connecting message
        const connectButton = document.getElementById('connectWallet');
        const originalButtonText = connectButton.textContent;
        connectButton.textContent = 'Connecting...';
        connectButton.disabled = true;
        
        // Call the blockchain.js connectWallet function through fetch API
        const response = await fetch('/api/connect-wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // If the API call fails, try direct browser connection
        if (!response.ok) {
            return connectWalletDirect();
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to connect wallet');
        }
        
        // Set global variables
        walletAddress = data.wallet.address;
        walletBalance = data.wallet.balance;
        
        // Check if the network is supported
        const networkCheck = await fetch('/api/check-network');
        const networkData = await networkCheck.json();
        
        // Display network warning if needed
        if (networkData.success && !networkData.networkInfo.supported) {
            alert(`You are connected to ${networkData.networkInfo.current}, which is not supported. Please switch to ${networkData.networkInfo.required} in your wallet.`);
        }
        
        // Update UI
        updateUI();
        
        // Get token balance
        if (walletAddress) {
            const balanceResponse = await fetch(`/api/token-balance/${walletAddress}`);
            const balanceData = await balanceResponse.json();
            
            if (balanceData.success) {
                const userTokenBalance = document.getElementById('userTokenBalance');
                if (userTokenBalance) {
                    userTokenBalance.textContent = parseFloat(balanceData.balance).toFixed(2);
                }
            }
        }
        
        // Reset button state
        connectButton.textContent = 'Connected';
        connectButton.disabled = true;
        
        return walletAddress;
    } catch (error) {
        console.error('Error connecting wallet:', error);
        
        // Try direct browser connection as fallback
        return connectWalletDirect();
    }
}

// Direct browser connection to MetaMask (fallback)
const connectWalletDirect = async () => {
    try {
        if (!window.ethereum) {
            alert('Please install MetaMask to connect your wallet');
            return null;
        }
        
        // Show connecting message
        const connectButton = document.getElementById('connectWallet');
        if (connectButton) {
            connectButton.textContent = 'Connecting...';
            connectButton.disabled = true;
        }
        
        // Request accounts directly from MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found or user rejected the connection');
        }
        
        // Get the first account
        walletAddress = accounts[0];
        
        // Get wallet balance
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(walletAddress);
        walletBalance = ethers.utils.formatEther(balance);
        
        // Get network info
        const network = await provider.getNetwork();
        const networkName = network.name !== 'unknown' ? network.name : `Chain ID ${network.chainId}`;
        
        // Set button state
        if (connectButton) {
            connectButton.textContent = 'Connected';
            connectButton.disabled = true;
        }
        
        // Update UI with wallet info
        updateUI();
        
        // Check if we have a contract for this network
        const supportedNetworks = [1, 5, 11155111, 1337]; // Mainnet, Goerli, Sepolia, Local
        const isSupported = supportedNetworks.includes(network.chainId);
        
        if (!isSupported) {
            alert(`You are connected to ${networkName}, which is not fully supported. Some features may not work correctly.`);
        }
        
        // Get token balance if available
        try {
            const tokenContract = new ethers.Contract(contractAddress, contractABI, provider);
            const tokenBalance = await tokenContract.balanceOf(walletAddress);
            const formattedBalance = parseFloat(ethers.utils.formatUnits(tokenBalance, 18)).toFixed(2);
            
            const userTokenBalance = document.getElementById('userTokenBalance');
            if (userTokenBalance) {
                userTokenBalance.textContent = formattedBalance;
            }
        } catch (error) {
            console.error('Error fetching token balance:', error);
        }
        
        console.log(`Wallet connected: ${walletAddress}`);
        console.log(`Network: ${networkName} (${network.chainId})`);
        console.log(`Balance: ${walletBalance} ETH`);
        
        return walletAddress;
    } catch (error) {
        console.error('Error in direct wallet connection:', error);
        
        // Reset button state
        const connectButton = document.getElementById('connectWallet');
        if (connectButton) {
            connectButton.textContent = 'Connect Wallet';
            connectButton.disabled = false;
        }
        
        alert(`Failed to connect wallet: ${error.message}`);
        return null;
    }
}

// Function to update UI with wallet info
function updateUI() {
    const walletSection = document.querySelector('.wallet-info');
    if (walletSection && walletAddress) {
        // Format wallet address for display (first 6 and last 4 characters)
        const shortAddress = `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
        
        // Find or create wallet display elements
        let addressDisplay = document.getElementById('walletAddress');
        let balanceDisplay = document.getElementById('walletBalance');
        let tokenBalanceDisplay = document.getElementById('userTokenBalance');
        
        if (!addressDisplay) {
            const walletInfoDiv = document.createElement('div');
            walletInfoDiv.className = 'wallet-connected';
            
            addressDisplay = document.createElement('div');
            addressDisplay.id = 'walletAddress';
            addressDisplay.className = 'wallet-address';
            
            balanceDisplay = document.createElement('div');
            balanceDisplay.id = 'walletBalance';
            balanceDisplay.className = 'wallet-balance';
            
            tokenBalanceDisplay = document.createElement('div');
            tokenBalanceDisplay.id = 'userTokenBalance';
            tokenBalanceDisplay.className = 'token-balance';
            
            const walletLabel = document.createElement('div');
            walletLabel.className = 'wallet-label';
            walletLabel.textContent = 'Connected Wallet:';
            
            const ethLabel = document.createElement('div');
            ethLabel.className = 'balance-label';
            ethLabel.textContent = 'ETH Balance:';
            
            const tokenLabel = document.createElement('div');
            tokenLabel.className = 'balance-label';
            tokenLabel.textContent = 'AHV Balance:';
            
            walletInfoDiv.appendChild(walletLabel);
            walletInfoDiv.appendChild(addressDisplay);
            walletInfoDiv.appendChild(ethLabel);
            walletInfoDiv.appendChild(balanceDisplay);
            walletInfoDiv.appendChild(tokenLabel);
            walletInfoDiv.appendChild(tokenBalanceDisplay);
            
            walletSection.appendChild(walletInfoDiv);
        }
        
        // Update the display values
        addressDisplay.textContent = shortAddress;
        balanceDisplay.textContent = `${parseFloat(walletBalance).toFixed(4)} ETH`;
        
        // Update the connect button
        const connectButton = document.getElementById('connectWallet');
        if (connectButton) {
            connectButton.textContent = 'Connected';
            connectButton.disabled = true;
        }
    }
}

// Function to add a transaction to the user's history
async function addTransaction(type, amount, tokenSymbol, status) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        if (!currentUser || !currentUser.loggedIn) {
            console.log('User not logged in, skipping transaction recording');
            return null;
        }
        
        const token = localStorage.getItem('ahsanverseToken');
        if (!token) {
            console.log('No auth token found, skipping transaction recording');
            return null;
        }
        
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                amount,
                token: tokenSymbol,
                status
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error adding transaction:', data.message);
            return null;
        }
        
        return data.transaction;
    } catch (error) {
        console.error('Error adding transaction:', error);
        return null;
    }
}

// Function to update a transaction's status
async function updateTransactionStatus(transactionId, status, transactionHash = null) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('ahsanverseCurrentUser') || '{}');
        if (!currentUser || !currentUser.loggedIn) {
            console.log('User not logged in, skipping transaction update');
            return false;
        }
        
        const token = localStorage.getItem('ahsanverseToken');
        if (!token) {
            console.log('No auth token found, skipping transaction update');
            return false;
        }
        
        const response = await fetch('/api/update-transaction', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactionId,
                status,
                transactionHash
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error updating transaction:', data.message);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error updating transaction:', error);
        return false;
    }
}