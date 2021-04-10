import { ethers, run } from 'hardhat';
import { FlashBot } from '../typechain/FlashBot';

async function main() {
  await run('compile');
  const flashBot: FlashBot = (await ethers.getContractAt(
    'FlashBot',
    '0x1A4F45df12e1DB2b6A2b89650F159792d1d62Df1'
  )) as FlashBot;

  const owner = await flashBot.owner();
  console.log(`Owner: ${owner}`);

  const tokens = await flashBot.getBaseTokens();
  console.log('Base tokens: ', tokens);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
