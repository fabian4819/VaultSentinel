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

    const score = process.env.SCORE ? Number(process.env.SCORE) : 95;
    console.log(`\n🔴 Simulating attack: setting risk score to ${score}/100`);
    console.log(`   Vault: ${deploymentData.vaultSentinel}`);

    const stateBefore = await vault.vaultState();
    const stateNames = ["🟢 ACTIVE", "🟡 GUARDED", "🔴 EMERGENCY"];
    console.log(`   State before: ${stateNames[Number(stateBefore)]}`);

    const tx = await vault.setRiskScore(score);
    console.log(`   Tx submitted: ${tx.hash}`);
    await tx.wait();
    console.log(`   Tx confirmed ✅`);

    const stateAfter = await vault.vaultState();
    const lastScore = await vault.lastRiskScore();
    console.log(`\n   Risk score:  ${lastScore}/100`);
    console.log(`   Vault state: ${stateNames[Number(stateAfter)]}`);

    if (Number(stateAfter) === 2) {
        console.log(`\n   💸 Emergency triggered — all user funds returned automatically!`);
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
