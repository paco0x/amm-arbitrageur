import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { TestERC20 } from "../typechain/TestERC20";
import { FlashBot } from "../typechain/FlashBot";

import { flashBotFixture } from "./shared/fixtures";

describe("FlashBot access control", () => {
  let weth: TestERC20;
  let flashBot: FlashBot;

  beforeEach(async () => {
    ({ weth, flashBot } = await waffle.loadFixture(flashBotFixture));
  });

  it("Should set owner to deployer", async () => {
    const [owner] = await ethers.getSigners();
    const fbOwner = await flashBot.owner();
    expect(fbOwner).to.be.equal(owner.address);
  });

  it("Should be receivable", async () => {
    const [owner] = await ethers.getSigners();

    const amount = ethers.utils.parseEther("5.1");
    await owner.sendTransaction({
      to: flashBot.address,
      value: amount,
    });

    const balance = await ethers.provider.getBalance(flashBot.address);
    expect(balance).to.be.eq(amount);
  });

  it("Should be withdrawable", async () => {
    const [owner, addr1] = await ethers.getSigners();

    const amount = ethers.utils.parseEther("5.1");
    await addr1.sendTransaction({
      to: flashBot.address,
      value: amount,
    });

    const wethAmount = ethers.utils.parseEther("100.1");
    await weth.mint(flashBot.address, wethAmount);

    const balanceBefore = await owner.getBalance();
    const wethBlanceBefore = await weth.balanceOf(owner.address);

    // let addr1 withdraw so the gas not spend on owner
    expect(await flashBot.connect(addr1).withdraw())
      .to.emit(flashBot, "Withdrawn")
      .withArgs(owner.address, amount);

    const balanceAfter = await owner.getBalance();
    const wethBlanceAfter = await weth.balanceOf(owner.address);
    expect(balanceAfter).to.be.eq(balanceBefore.add(amount));
    expect(wethBlanceAfter).to.be.eq(wethBlanceBefore.add(wethAmount));
  });
});
