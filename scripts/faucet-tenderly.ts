import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Setting balance for:", deployer.address);

    // Kirim request ke Tenderly RPC untuk set balance (100 ETH)
    // Tenderly Virtual Testnets support tenderly_setBalance
    await ethers.provider.send("tenderly_setBalance", [
        deployer.address,
        "0x56BC75E2D63100000" // 100 ETH in Hex
    ]);

    const newBalance = await ethers.provider.getBalance(deployer.address);
    console.log("New Balance:", ethers.formatEther(newBalance), "ETH ✅");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
