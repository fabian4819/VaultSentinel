import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // Deploy VaultSentinel
    // authorizedCaller = deployer initially; update after CRE wallet is known
    const VaultSentinel = await ethers.getContractFactory("VaultSentinel");
    const vault = await VaultSentinel.deploy(
        deployer.address, // placeholder — update with setAuthorizedCaller after CRE setup
        70                // risk threshold: score >= 70 triggers emergency
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("VaultSentinel deployed to:", vaultAddress);

    // Save addresses
    const addresses = {
        vaultSentinel: vaultAddress,
        network: "tenderly-mainnet-fork",
        chainId: 9991,
        deployer: deployer.address,
    };
    fs.writeFileSync("deployment.json", JSON.stringify(addresses, null, 2));
    console.log("\n✅ Addresses saved to deployment.json");
    console.log(JSON.stringify(addresses, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
