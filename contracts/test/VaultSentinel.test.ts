import { expect } from "chai";
import { ethers } from "hardhat";
import { VaultSentinel, MockERC20 } from "../../typechain-types";

describe("VaultSentinel V2 (Multi-Asset)", function () {
    let vault: VaultSentinel;
    let usdc: MockERC20;
    let steth: MockERC20;
    let owner: any, user1: any, user2: any, cre: any;

    beforeEach(async function () {
        [owner, user1, user2, cre] = await ethers.getSigners();

        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20Factory.deploy("Mock USDC", "USDC", 6) as MockERC20;
        steth = await MockERC20Factory.deploy("Mock stETH", "stETH", 18) as MockERC20;

        await usdc.waitForDeployment();
        await steth.waitForDeployment();

        const VaultSentinelFactory = await ethers.getContractFactory("VaultSentinel");
        vault = await VaultSentinelFactory.deploy(cre.address, 70) as VaultSentinel;
        await vault.waitForDeployment();

        await vault.connect(owner).addSupportedToken(await usdc.getAddress());
        await vault.connect(owner).addSupportedToken(await steth.getAddress());
    });

    it("should accept user ETH deposit", async function () {
        await vault.connect(user1).depositETH({ value: ethers.parseEther("1.0") });
        expect(await vault.getUserBalance(user1.address, ethers.ZeroAddress)).to.equal(ethers.parseEther("1.0"));
    });

    it("should accept supported ERC20 deposit", async function () {
        const amount = ethers.parseUnits("100", 6);
        await usdc.mint(user1.address, amount);
        await usdc.connect(user1).approve(await vault.getAddress(), amount);

        await vault.connect(user1).depositERC20(await usdc.getAddress(), amount);
        expect(await vault.getUserBalance(user1.address, await usdc.getAddress())).to.equal(amount);
    });

    it("should reject unsupported ERC20 deposit", async function () {
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        const badToken = await MockERC20Factory.deploy("Bad", "BAD", 18) as MockERC20;

        const amount = ethers.parseEther("100");
        await badToken.mint(user1.address, amount);
        await badToken.connect(user1).approve(await vault.getAddress(), amount);

        await expect(
            vault.connect(user1).depositERC20(await badToken.getAddress(), amount)
        ).to.be.revertedWith("Token not supported");
    });

    it("should sweep everything back to users on emergency", async function () {
        // User 1 deposits ETH
        await vault.connect(user1).depositETH({ value: ethers.parseEther("1.0") });

        // User 2 deposits USDC
        const usdcString = await usdc.getAddress();
        const amountUSDC = ethers.parseUnits("500", 6);
        await usdc.mint(user2.address, amountUSDC);
        await usdc.connect(user2).approve(await vault.getAddress(), amountUSDC);
        await vault.connect(user2).depositERC20(usdcString, amountUSDC);

        // User 1 ALSO deposits stETH
        const stethString = await steth.getAddress();
        const amountSteth = ethers.parseEther("5");
        await steth.mint(user1.address, amountSteth);
        await steth.connect(user1).approve(await vault.getAddress(), amountSteth);
        await vault.connect(user1).depositERC20(stethString, amountSteth);

        // Check pre-emergency balances
        expect(await vault.getUserBalance(user1.address, ethers.ZeroAddress)).to.equal(ethers.parseEther("1.0"));
        expect(await vault.getUserBalance(user2.address, usdcString)).to.equal(amountUSDC);

        const user1EthBefore = await ethers.provider.getBalance(user1.address);
        const user2UsdcBefore = await usdc.balanceOf(user2.address);
        const user1StethBefore = await steth.balanceOf(user1.address);

        // TRIGGER
        const tx = await vault.connect(cre).triggerEmergency();
        await tx.wait();

        // Check balances automatically refunded
        expect(await vault.getUserBalance(user1.address, ethers.ZeroAddress)).to.equal(0);
        expect(await vault.getUserBalance(user2.address, usdcString)).to.equal(0);
        expect(await vault.getUserBalance(user1.address, stethString)).to.equal(0);

        const user1EthAfter = await ethers.provider.getBalance(user1.address);
        const user2UsdcAfter = await usdc.balanceOf(user2.address);
        const user1StethAfter = await steth.balanceOf(user1.address);

        expect(user1EthAfter - user1EthBefore).to.equal(ethers.parseEther("1.0"));
        expect(user2UsdcAfter - user2UsdcBefore).to.equal(amountUSDC);
        expect(user1StethAfter - user1StethBefore).to.equal(amountSteth);
    });
});
