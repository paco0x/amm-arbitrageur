import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';

describe('FlashBot', () => {
  let fb: Contract;

  beforeEach(async () => {
    const FlashBot = await ethers.getContractFactory('FlashBot');
    fb = await FlashBot.deploy();
  });

  it('Should set owner to deployer', async () => {
    const [owner] = await ethers.getSigners();
    const fbOwner = await fb.owner();
    expect(fbOwner).to.be.equal(owner.address);
  });

  it('Should be receivable', async () => {
    const [owner] = await ethers.getSigners();

    const amount = ethers.utils.parseEther('5.1');
    await owner.sendTransaction({
      to: fb.address,
      value: amount,
    });

    const balance = await ethers.provider.getBalance(fb.address);
    expect(balance).to.be.eq(amount);
  });

  it('Should be withdrawable', async () => {
    const [owner, addr1] = await ethers.getSigners();

    const amount = ethers.utils.parseEther('5.1');
    await addr1.sendTransaction({
      to: fb.address,
      value: amount,
    });

    const ownerBalanceBefore = await owner.getBalance();
    // let addr1 withdraw so the gas not spend on owner
    expect(await fb.connect(addr1).withdraw())
      .to.emit(fb, 'Withdrawn')
      .withArgs(owner.address, amount);

    const ownerBalanceAfter = await owner.getBalance();
    expect(ownerBalanceAfter).to.be.eq(ownerBalanceBefore.add(amount));
  });
});
