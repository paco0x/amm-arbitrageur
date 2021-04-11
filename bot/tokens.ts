import fs from 'fs';
import path from 'path';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'hardhat';

import log from './log';

export enum Network {
  BSC = 'bsc',
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const bscBaseTokens: Tokens = {
  wbnb: { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' },
  usdt: { symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955' },
  busd: { symbol: 'BUSD', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56' },
};

const bscQuoteTokens: Tokens = {
  eth: { symbol: 'ETH', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' },
  btcb: { symbol: 'BTCB', address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c' },
  cake: { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
  bake: { symbol: 'BAKE', address: '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5' },
  alpaca: { symbol: 'ALPACA', address: '0x8f0528ce5ef7b51152a59745befdd91d97091d2f' },
  band: { symbol: 'BAND', address: '0xad6caeb32cd2c308980a548bd0bc5aa4306c6c18' },
  bbadger: { symbol: 'bBADGER', address: '0x1f7216fdb338247512ec99715587bb97bbf96eae' },
  beth: { symbol: 'BETH', address: '0x250632378E573c6Be1AC2f97Fcdf00515d0Aa91B' },
  cream: { symbol: 'CREAM', address: '0xd4cb328a82bdf5f03eb737f37fa6b370aef3e888' },
  dot: { symbol: 'DOT', address: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402' },
  doge: { symbol: 'DOGE', address: '0x4206931337dc273a630d328dA6441786BfaD668f' },
  mdx: { symbol: 'MDX', address: '0x9c65ab58d8d978db963e63f2bfb7121627e3a739' },
  inj: { symbol: 'INJ', address: '0xa2b726b1145a4773f68593cf171187d8ebe4d495' },
  beefy: { symbol: 'BEFI', address: '0xCa3F508B8e4Dd382eE878A314789373D80A5190A' },
  atm: { symbol: 'ATM', address: '0x25e9d05365c867e59c1904e7463af9f312296f9e' },
  badpad: { symbol: 'BSCPAD', address: '0x5a3010d4d8d3b5fb49f8b6e57fb9e48063f16700' },
  bunny: { symbol: 'BUNNY', address: '0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51' },
  eps: { symbol: 'EPS', address: '0xa7f552078dcc247c2684336020c03648500c6d9f' },
  iron: { symbol: 'IRON', address: '0x7b65b489fe53fce1f6548db886c08ad73111ddd8' },
  lina: { symbol: 'LINA', address: '0x762539b45a1dcce3d36d080f74d1aed37844b878' },
  alpha: { symbol: 'ALPHA', address: '0xa1faa113cbE53436Df28FF0aEe54275c13B40975' },
  venus: { symbol: 'XVS', address: '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63' },
  twt: { symbol: 'TWT', address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003' },
  link: { symbol: 'LINK', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD' },
  vai: { symbol: 'VAI', address: '0x4bd17003473389a42daf6a0a729f6fdb328bbbd7' },
  nerve: { symbol: 'NRV', address: '0x42f6f551ae042cbe50c739158b4f0cac0edb9096' },
  btcst: { symbol: 'BTCST', address: '0x78650b139471520656b9e7aa7a5e9276814a38e9' },
  auto: { symbol: 'AUTO', address: '0xa184088a740c695e156f91f5cc086a06bb78b827' },
  kickpad: { symbol: 'KICKPAD', address: '0xcfefa64b0ddd611b125157c41cd3827f2e8e8615' },
  oction: { symbol: 'OCTI', address: '0x6c1de9907263f0c12261d88b65ca18f31163f29d' },
  oneinch: { symbol: '1INCH', address: '0x111111111117dc0aa78b770fa6a738034120c302' },
  vancat: { symbol: 'VANCAT', address: '0x8597ba143ac509189e89aab3ba28d661a5dd9830' },
  sfp: { symbol: 'SFP', address: '0xd41fdb03ba84762dd66a0af1a6c8540ff1ba5dfb' },
  sparta: { symbol: 'SPARTA', address: '0xe4ae305ebe1abe663f261bc00534067c80ad677c' },
  tcake: { symbol: 'TCAKE', address: '0x3b831d36ed418e893f42d46ff308c326c239429f' },
  fairmoon: { symbol: 'FAIRMOON', address: '0xfe75cd11e283813ec44b4592476109ba3706cef6' },
  orakuru: { symbol: 'ORK', address: '0xced0ce92f4bdc3c2201e255faf12f05cf8206da8' },
  bgov: { symbol: 'BGOV', address: '0xf8e026dc4c0860771f691ecffbbdfe2fa51c77cf' },
  frontier: { symbol: 'FRONT', address: '0x928e55dab735aa8260af3cedada18b5f70c72f1b' },
  swampy: { symbol: 'SWAMP', address: '0xc5a49b4cbe004b6fd55b30ba1de6ac360ff9765d' },
  ele: { symbol: 'ELE', address: '0xacd7b3d9c10e97d0efa418903c0c7669e702e4c0' },
  bondly: { symbol: 'BONDLY', address: '0x96058f8c3e16576d9bd68766f3836d9a33158f89' },
  ramp: { symbol: 'RAMP', address: '0x8519ea49c997f50ceffa444d240fb655e89248aa' },
  googse: { symbol: 'EGG', address: '0xf952fc3ca7325cc27d15885d37117676d25bfda6' },
  aioz: { symbol: 'AIOZ', address: '0x33d08d8c7a168333a85285a68c0042b39fc3741d' },
  starter: { symbol: 'START', address: '0x31d0a7ada4d4c131eb612db48861211f63e57610' },
  dshare: { symbol: 'SBDO', address: '0x0d9319565be7f53cefe84ad201be3f40feae2740' },
  bdollar: { symbol: 'BDO', address: '0x190b589cf9fb8ddeabbfeae36a813ffb2a702454' },
  swipe: { symbol: 'SXP', address: '0x47bead2563dcbf3bf2c9407fea4dc236faba485a' },
  tornado: { symbol: 'TORN', address: '0x40318becc7106364D6C41981956423a7058b7455' },
  uni: { symbol: 'UNI', address: '0xbf5140a22578168fd562dccf235e5d43a02ce9b1' },
  lit: { symbol: 'LIT', address: '0xb59490aB09A0f526Cc7305822aC65f2Ab12f9723' },
  alice: { symbol: 'ALICE', address: '0xac51066d7bec65dc4589368da368b212745d63e8' },
  reef: { symbol: 'REEF', address: '0xf21768ccbc73ea5b6fd3c687208a7c2def2d966e' },
  pet: { symbol: 'PET', address: '0x4d4e595d643dc61ea7fcbf12e4b1aaa39f9975b8' },
};

const bscDexes: AmmFactories = {
  pancake: '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
  mdex: '0x3CD1C46068dAEa5Ebb0d3f55F6915B10648062B8',
  bakery: '0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7',
  julswap: '0x553990F2CBA90272390f62C5BDb1681fFc899675',
  // value: '0x1B8E12F839BD4e73A47adDF76cF7F0097d74c14C',
};

function getFactories(network: Network): AmmFactories {
  switch (network) {
    case Network.BSC:
      return bscDexes;
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

export function getTokens(network: Network): [Tokens, Tokens] {
  switch (network) {
    case Network.BSC:
      return [bscBaseTokens, bscQuoteTokens];
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

async function updatePairs(network: Network): Promise<ArbitragePair[]> {
  log.info('Updating arbitrage token pairs');
  const [baseTokens, quoteTokens] = getTokens(network);
  const factoryAddrs = getFactories(network);

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

function getPairsFile(network: Network) {
  return path.join(__dirname, `../pairs-${network}.json`);
}

export async function tryLoadPairs(network: Network): Promise<ArbitragePair[]> {
  let pairs: ArbitragePair[] | null;
  const pairsFile = getPairsFile(network);
  try {
    pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf-8'));
    log.info('Load pairs from json');
  } catch (err) {
    pairs = null;
  }

  if (pairs) {
    return pairs;
  }
  pairs = await updatePairs(network);

  fs.writeFileSync(pairsFile, JSON.stringify(pairs, null, 2));
  return pairs;
}
