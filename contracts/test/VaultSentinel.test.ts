import { expect } from "chai";
import { ethers } from "hardhat";
import { VaultSentinel, MockERC20 } from "../../typechain-types";

describe("VaultSentinel", function () {
    let vault: VaultSentinel;
    let token: MockERC20;
    let owner: any, user: any, cre: any;

    beforeEach(async function () {
        [owner, user, cre] = await ethers.getSigners();

        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        token = await MockERC20Factory.deploy("Mock USD", "mUSD", 18) as MockERC20;
        await token.waitForDeployment();

        const VaultSentinelFactory = await ethers.getContractFactory("VaultSentinel");
        vault = await VaultSentinelFactory.deploy(
            await token.getAddress(),
            cre.address,
            70
        ) as VaultSentinel;
        await vault.waitForDeployment();

        // Fund user and approve vault
        await token.mint(user.address, ethers.parseEther("100"));
        await token.connect(user).approve(await vault.getAddress(), ethers.parseEther("100"));
    });

    it("should accept user deposit", async function () {
        await vault.connect(user).deposit(ethers.parseEther("100"));
        expect(await vault.getUserBalance(user.address)).to.equal(ethers.parseEther("100"));
    });

    it("should allow CRE to write risk score", async function () {
        await vault.connect(cre).setRiskScore(42);
        expect(await vault.lastRiskScore()).to.equal(42);
    });

    it("should reject non-CRE risk score write", async function () {
        await expect(vault.connect(user).setRiskScore(42)).to.be.revertedWith("Unauthorized");
    });

    it("should trigger emergency and return funds to user", async function () {
        await vault.connect(user).deposit(ethers.parseEther("100"));
        const balanceBefore = await token.balanceOf(user.address);

        await vault.connect(cre).triggerEmergency();

        expect(await vault.vaultState()).to.equal(2); // EMERGENCY = 2
        expect(await token.balanceOf(user.address)).to.equal(
            balanceBefore + ethers.parseEther("100")
        );
    });

    it("should block deposits in EMERGENCY state", async function () {
        await vault.connect(cre).triggerEmergency();
        await expect(
            vault.connect(user).deposit(ethers.parseEther("10"))
        ).to.be.revertedWith("Vault is in emergency");
    });

    it("should allow owner to reset vault to ACTIVE", async function () {
        await vault.connect(cre).triggerEmergency();
        await vault.connect(owner).resetVault();
        expect(await vault.vaultState()).to.equal(0); // ACTIVE = 0
    });
});
