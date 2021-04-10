import fs from 'fs';
import path from 'path';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import 'lodash.combinations';
import lodash from 'lodash';

import { FlashBot } from '../typechain/FlashBot';
import { getTokens, getFactories, Network } from './tokens';
import { getBnbPrice } from './basetoken-price';
import log from './log';
import config from './config';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const PAIRS_FILE = path.join(__dirname, '../pairs.json');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updatePairs(): Promise<ArbitragePair[]> {
  log.info('Updating arbitrage token pairs');
  const [baseTokens, quoteTokens] = getTokens(Network.BSC);
  const factoryAddrs = getFactories(Network.BSC);

  const factoryAbi = ['function getPair(address, address) view returns (address pair)'];
  let factories: Contract[] = [];

  log.info(`Fetch from dexes: ${Object.keys(factoryAddrs)}`);
  for (const key in factoryAddrs) {
    const addr = factoryAddrs[key];
    const factory = new ethers.Contract(addr, factoryAbi, ethers.provider);
    factories.push(factory);
  }

  let tokenPairs: TokenPair[] = [];
  for (const key in baseTokens) {
    const baseToken = baseTokens[key];
    for (const quoteKey in quoteTokens) {
      const quoteToken = quoteTokens[quoteKey];
      let tokenPair: TokenPair = { symbols: `${quoteToken.symbol}-${baseToken.symbol}`, pairs: [] };
      for (const factory of factories) {
        const pair = await factory.getPair(baseToken.address, quoteToken.address);
        if (pair != ZERO_ADDRESS) {
          tokenPair.pairs.push(pair);
        }
      }
      if (tokenPair.pairs.length >= 2) {
        tokenPairs.push(tokenPair);
      }
    }
  }

  let allPairs: ArbitragePair[] = [];
  for (const tokenPair of tokenPairs) {
    if (tokenPair.pairs.length < 2) {
      continue;
    } else if (tokenPair.pairs.length == 2) {
      allPairs.push(tokenPair as ArbitragePair);
    } else {
      // @ts-ignore
      const combinations = lodash.combinations(tokenPair.pairs, 2);
      for (const pair of combinations) {
        const arbitragePair: ArbitragePair = {
          symbols: tokenPair.symbols,
          pairs: pair,
        };
        allPairs.push(arbitragePair);
      }
    }
  }
  return allPairs;
}

async function tryLoadPairs(): Promise<ArbitragePair[]> {
  let pairs: ArbitragePair[] | null;
  try {
    pairs = JSON.parse(fs.readFileSync(PAIRS_FILE, 'utf-8'));
    log.info('Load pairs from json');
  } catch (err) {
    pairs = null;
  }

  if (pairs) {
    return pairs;
  }
  pairs = await updatePairs();

  fs.writeFileSync(PAIRS_FILE, JSON.stringify(pairs, null, 2));
  return pairs;
}

async function calcNetProfit(profitWei: BigNumber, address: string, baseTokens: Tokens): Promise<number> {
  let price = 1;
  if (baseTokens.wbnb.address == address) {
    price = await getBnbPrice();
  }
  let profit = parseFloat(ethers.utils.formatEther(profitWei));
  profit = profit * price;

  const gasCost = price * parseFloat(ethers.utils.formatEther(config.gasPrice)) * (config.gasLimit as number);
  return profit - gasCost;
}

async function main() {
  const pairs = await tryLoadPairs();
  const flashBot = (await ethers.getContractAt('FlashBot', '0x1A4F45df12e1DB2b6A2b89650F159792d1d62Df1')) as FlashBot;
  const [baseTokens] = getTokens(Network.BSC);

  while (true) {
    for (const pair of pairs) {
      const [pair0, pair1] = pair.pairs;

      let res: [BigNumber, string] & {
        profit: BigNumber;
        baseToken: string;
      };
      try {
        res = await flashBot.getProfit(pair0, pair1);
        log.info(`Profit on ${pair.symbols}: ${ethers.utils.formatEther(res.profit)}`);
      } catch (err) {
        log.debug(err);
        continue;
      }

      if (res.profit.gt(BigNumber.from('0'))) {
        const netProfit = await calcNetProfit(res.profit, res.baseToken, baseTokens);
        if (netProfit < config.minimumProfit) {
          continue;
        }

        log.info(`Calling flash arbitrage, net profit: ${netProfit}`);
        try {
          const response = await flashBot.flashArbitrage(pair0, pair1, {
            gasPrice: ethers.utils.parseUnits('10', 'gwei'),
            gasLimit: 300000,
          });
          const receipt = await response.wait(1);
          log.info(`Tx: ${receipt.transactionHash}`);
        } catch (err) {
          log.error(err);
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
