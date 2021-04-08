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
    const [owner, addr1] = await ethers.getSigners();

    const fbOwner = await fb.owner();
    expect(fbOwner).to.be.equal(owner.address);
  });
});
