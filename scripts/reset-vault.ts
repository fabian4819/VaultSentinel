import { ethers } from "hardhat";
import * as fs from "fs";
const deploymentData = JSON.parse(fs.readFileSync("./deployment.json", "utf-8"));

async function main() {
    const [owner] = await ethers.getSigners();

    const vault = await ethers.getContractAt(
        "VaultSentinel",
        deploymentData.vaultSentinel,
        owner
    );

    console.log(`\n🔄 Resetting Vault to ACTIVE state...`);
    console.log(`   Vault: ${deploymentData.vaultSentinel}`);

    const tx = await vault.resetVault();
    console.log(`   Tx submitted: ${tx.hash}`);
    await tx.wait();
    
    const stateAfter = await vault.vaultState();
    const stateNames = ["🟢 ACTIVE", "🟡 GUARDED", "🔴 EMERGENCY"];
    console.log(`   Vault state: ${stateNames[Number(stateAfter)]} ✅`);
}

main().catch((e) => { 
    console.error(e); 
    process.exit(1); 
});
