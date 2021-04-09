import { ethers } from 'hardhat';
import { TestERC20 } from '../../typechain/TestERC20';
import { FlashBot } from '../../typechain/FlashBot';

interface FlashBotFixture {
  weth: TestERC20;
  flashBot: FlashBot;
}

export const flashBotFixture = async (): Promise<FlashBotFixture> => {
  const flashBotFactory = await ethers.getContractFactory('FlashBot');
  const tokenFactory = await ethers.getContractFactory('TestERC20');

  const weth = (await tokenFactory.deploy('Weth', 'WETH')) as TestERC20;
  const flashBot = (await flashBotFactory.deploy(weth.address)) as FlashBot;

  return { weth, flashBot };
};
