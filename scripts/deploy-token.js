const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AhsanVerse Token contract...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Log initial balance
  const deployerBalance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(deployerBalance));

  // Deploy token contract
  const Token = await ethers.getContractFactory("AhsanVerseToken");
  const token = await Token.deploy();
  await token.deployed();

  console.log("AhsanVerse Token deployed to:", token.address);
  console.log("Token Name:", await token.name());
  console.log("Token Symbol:", await token.symbol());
  console.log("Total Supply:", ethers.utils.formatUnits(await token.totalSupply(), 18));
  console.log("Token Price:", ethers.utils.formatEther(await token.getTokenPrice()), "ETH");

  // Log contract information
  console.log("\nVerify contract on Etherscan with:");
  console.log(`npx hardhat verify --network <network> ${token.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 