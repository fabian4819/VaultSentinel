import { expect } from "chai";
import { ethers } from "hardhat";
import { VaultSentinel } from "../../typechain-types";

describe("VaultSentinel (Native ETH)", function () {
    let vault: VaultSentinel;
    let owner: any, user: any, cre: any;

    beforeEach(async function () {
        [owner, user, cre] = await ethers.getSigners();

        const VaultSentinelFactory = await ethers.getContractFactory("VaultSentinel");
        vault = await VaultSentinelFactory.deploy(
            cre.address,
            70
        ) as VaultSentinel;
        await vault.waitForDeployment();
    });

    it("should accept user ETH deposit", async function () {
        await vault.connect(user).deposit({ value: ethers.parseEther("1.0") });
        expect(await vault.getUserBalance(user.address)).to.equal(ethers.parseEther("1.0"));
    });

    it("should allow CRE to write risk score", async function () {
        await vault.connect(cre).setRiskScore(42);
        expect(await vault.lastRiskScore()).to.equal(42);
    });

    it("should reject non-CRE risk score write", async function () {
        await expect(vault.connect(user).setRiskScore(42)).to.be.revertedWith("Unauthorized");
    });

    it("should trigger emergency and return funds to user", async function () {
        await vault.connect(user).deposit({ value: ethers.parseEther("1.0") });

        const balanceBefore = await ethers.provider.getBalance(user.address);

        const tx = await vault.connect(cre).triggerEmergency();
        const receipt = await tx.wait();

        expect(await vault.vaultState()).to.equal(2); // EMERGENCY = 2

        // Check balance increased (approx 1 ETH, accounting for gas if any, though CRE pays gas here)
        const balanceAfter = await ethers.provider.getBalance(user.address);
        expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1.0"));
    });

    it("should block deposits in EMERGENCY state", async function () {
        await vault.connect(cre).triggerEmergency();
        await expect(
            vault.connect(user).deposit({ value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("Vault is in emergency");
    });

    it("should allow owner to reset vault to ACTIVE", async function () {
        await vault.connect(cre).triggerEmergency();
        await vault.connect(owner).resetVault();
        expect(await vault.vaultState()).to.equal(0); // ACTIVE = 0
    });
});
