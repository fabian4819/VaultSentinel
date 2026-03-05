import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // 1. Deploy the 2 MockERC20 tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);

    const steth = await MockERC20.deploy("Mock stETH", "stETH", 18);
    await steth.waitForDeployment();
    const stethAddress = await steth.getAddress();
    console.log("MockstETH deployed to:", stethAddress);

    // Mint some mock tokens to the deployer for testing
    await usdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
    await steth.mint(deployer.address, ethers.parseEther("100"));

    // 2. Deploy VaultSentinel
    // authorizedCaller = deployer initially; update after CRE wallet is known
    const VaultSentinel = await ethers.getContractFactory("VaultSentinel");
    const vault = await VaultSentinel.deploy(
        deployer.address, // placeholder — update with setAuthorizedCaller after CRE setup
        70                // risk threshold: score >= 70 triggers emergency
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("VaultSentinel deployed to:", vaultAddress);

    // 3. Whitelist tokens in the vault
    console.log("Whitelisting tokens...");
    await vault.addSupportedToken(usdcAddress);
    await vault.addSupportedToken(stethAddress);
    console.log("Whitelist complete.");

    // Save addresses
    const addresses = {
        vaultSentinel: vaultAddress,
        mockUSDC: usdcAddress,
        mockStETH: stethAddress,
        network: "tenderly-mainnet-fork",
        chainId: 9991,
        deployer: deployer.address,
    };

    fs.writeFileSync("deployment.json", JSON.stringify(addresses, null, 2));
    console.log("\n✅ Addresses saved to deployment.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
