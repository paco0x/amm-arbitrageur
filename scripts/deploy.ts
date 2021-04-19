import { ethers, run } from 'hardhat';

async function main() {
  await run('compile');
  const FlashBot = await ethers.getContractFactory('FlashBot');
  const flashBot = await FlashBot.deploy('ADDR'); // deployer address

  console.log(`FlashBot deployed to ${flashBot.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
