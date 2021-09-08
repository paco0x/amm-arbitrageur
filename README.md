**Note**: This repo is not under maintenning. If you encounter problems when running. Please figure it out by yourself.

This repo is written only for POC. The bot is implemented simply for demostration. It's not robust enough to be competitve with other arb bots that are running in the network. If you want a production-ready arb bot, then you might need to implement a bot by yourself.

If you have any question, please read the issues first. You may find your answer there.

# AMM Arbitrageur

An arbitrageur contract can be used to argitrage between Uniswap V2 like AMMs. For Chinese: [中文说明](./README-cn.md)

## The rationale

There are a lot of AMMs on Ethereum and other blockchains that support EVM. Many of these AMMs are UniswapV2 fork project or have same interface with Uniswap V2. A list of these AMMs:

- Uniswap V2(Ethereum)
- Sushi Swap(Ethereum)
- Pancake Swap(BSC)
- MDEX(BSC/heco)
...

We can do arbitrage between these AMMs once the prices of same token pair diverges on different AMMs. We can encapsulate arbitrage transactions in one EVM transaction so that we won't lose any money even the price moves before we send transaction.

Suppose we'd like to do arbitrage transactions on token pair TokenX/WETH. The TokenX/WETH pair must exists on multiple AMMs on Ethereum(or other EVM compatible blockchains such as BSC).

- We call WETH as Base token. It can be any token that with actual value such as USDT/USDC/DAI/BUSD...
- We call TokenX as Quote token. It can be any token even it's a fake token without value. Quote tokens won't be reserved after arbitrage's done.
- After arbitrage, only the base tokens are reserved. So our profit is denominate in base token.
- If two tokens in a pair can both be considered as base token. Either one can be reserved after arbitrage.

The arbitrage can be done by using `flashswap` of Uniswap V2:

- Suppose pair0 and pair1 are two pairs of same two tokens on different AMMs. Once the price diverges, we can do arbitrage.
- We call the `FlashBot` contract to start arbitrage
- The contract calculates the price denominated in quote token. Suppose the price of quote token in Pair0 is lower:

1. By using flash sawp, the contract first borrow some quote tokens from Pair0, the amount is *x*. The contract need to repay the debt to Pair0. The deby can be denominated in base token. This is a functionality of Uniswap V2.
2. Sell all the borrowed quote tokens on Pair1. The contract get base tokens of amount *y2*.
3. Repay the debt to Pair0 in base token of amount *y1*.
4. The contract get profit of *y2* - *y1*.

The point of the process is to calculate how much of the amount *x* so we can get as much profit as possible.

Supoose the initial state of Pair0 and Pair1 are as follows:

|                    | Pair0 | Pair1 |
| :------------------| :---- | :---- |
| Base Token amount  | a1    |   a2  |
| Quote Token amount | b1    |   b2  |

So we get：

<img src="https://latex.codecogs.com/svg.image?\Delta&space;a_1&space;=&space;\frac{\Delta&space;b_1&space;\cdot&space;a_1}{b_1&space;-&space;\Delta&space;b_1}&space;\&space;\&space;\&space;\Delta&space;a_2&space;=&space;\frac{\Delta&space;b_2&space;\cdot&space;a_2}{b_2&space;&plus;&space;\Delta&space;b_2}" title="\Delta a_1 = \frac{\Delta b_1 \cdot a_1}{b_1 - \Delta b_1} \ \ \ \Delta a_2 = \frac{\Delta b_2 \cdot a_2}{b_2 + \Delta b_2}" />

The amount borrowed Quote Token are some, so `Delta b1` = `Delta b2`, let `x = \Delta b`, then the profit as a function of x is:

<img src="https://latex.codecogs.com/svg.image?f(x)&space;=&space;\Delta&space;a_2&space;-&space;\Delta&space;a_1&space;=&space;\frac&space;{a_2&space;\cdot&space;x}{b_2&plus;x}&space;-&space;\frac&space;{a_1&space;\cdot&space;x}{b_1-x}" title="f(x) = \Delta a_2 - \Delta a_1 = \frac {a_2 \cdot x}{b_2+x} - \frac {a_1 \cdot x}{b_1-x}" />

We wanna calculate the x value when the function get a maximum value. First we need to get the derivative of function:

<img src="https://latex.codecogs.com/svg.image?f'(x)&space;=&space;\frac{a_2b_2}{(b_2&plus;x)^2}&space;-&space;&space;\frac{a_1b_1}{(b_1-x)^2}" title="f'(x) = \frac{a_2b_2}{(b_2+x)^2} - \frac{a_1b_1}{(b_1-x)^2}" />

When the derivative function is 0, the function has a maximum/minimum value, and we can set some conditions to ignore the solution at the minimum. It is possible to solve

<img src="https://latex.codecogs.com/svg.image?\frac{a_2b_2}{(b_2&plus;x)^2}&space;-&space;&space;\frac{a_1b_1}{(b_1-x)^2}&space;=&space;0&space;" title="\frac{a_2b_2}{(b_2+x)^2} - \frac{a_1b_1}{(b_1-x)^2} = 0 " />

<img src="https://latex.codecogs.com/svg.image?(a_1b_1-a_2b_2)x^2&space;&plus;&space;2b_1b_2(a_1&plus;a_2)x&space;&plus;&space;b_1b_2(a_1b_2&space;-&space;a_2b_1)&space;=&space;0&space;" title="(a_1b_1-a_2b_2)x^2 + 2b_1b_2(a_1+a_2)x + b_1b_2(a_1b_2 - a_2b_1) = 0 " />

Let：

<img src="https://latex.codecogs.com/svg.image?\begin{cases}a&space;=&space;a_1b_1&space;-&space;a_2b_2&space;\\b&space;=&space;2b_1b_2(a_1&space;&plus;&space;a_2)&space;\\c&space;=&space;b_1b_2(a_1b_2&space;-&space;a_2b_1)\end{cases}&space;" title="\begin{cases}a = a_1b_1 - a_2b_2 \\b = 2b_1b_2(a_1 + a_2) \\c = b_1b_2(a_1b_2 - a_2b_1)\end{cases} " />

The previous equation is reduced to a general quadratic equation:

<img src="https://latex.codecogs.com/svg.image?ax^2&plus;bx&plus;c=0&space;" title="ax^2+bx+c=0 " />

We can get the solution:

<img src="https://latex.codecogs.com/svg.image?\begin{cases}x=\displaystyle&space;\frac{-b&space;\pm&space;\sqrt{b^2-4ac}}{2a}&space;\\0&space;<&space;x&space;<&space;b_1&space;\\x&space;<&space;b_2\end{cases}" title="\begin{cases}x=\displaystyle \frac{-b \pm \sqrt{b^2-4ac}}{2a} \\0 < x < b_1 \\x < b_2\end{cases}" />

The solution x is the amount we need to borrow from Pair0.

## Deploy the contract
1. Edit network config in `hardhat.config.ts`.(Currently it is BSC in the repo, you alse can use Ethereum mainnet)

2. Copy the secret sample config：

```bash
$ cp .secret.ts.sample .secret.ts
```

3. Edit the private and address field in above config.


4. Then run the script to deploy. By default, it deploys to BSC. If you wanna dpeloy to other network, you may need to change the network settings in `hardhat.config.ts`. You also need to change the WETH or other token address in the `deploy.ts`, it's WBNB address by default.


```bash
$ hardhart --network XXX run scripts/deploy.ts

```
For example,
```
$ npx hardhat --network bscTestnet run scripts/deploy.ts
```

## Bot implementation

The contract has a function `getProfit(address pool1, address pool2)`, which can be used to calculate the maximum profit between two pairs(denominated in base token).

The bot need to call `getProfit()` to get the possible profit between token pairs. Once it is profitable, bot calls `flashArbitrage(pool1, pool2)` to do the arbitrage. The profit will leaves in the contract address.

Contract owner can call `withdraw()` to withdraw the profit.

There already implemented a bot in typescript, to run it:

```bash
$ yarn run bot
```

## Available AMMs on BSC

- [PancakeSwap](https://pancakeswap.finance/)
- [MDEX](https://bsc.mdex.com/)
- [BakerySwap](https://www.bakeryswap.org/#/swap)
- [JulSwap](https://julswap.com/#/)
- [~~ValueDeFi~~](https://bsc.valuedefi.io/)(Not supported)

## Run UT

```bash
$ hardhat test
```

## FAQ

### Too much math, what the hell is this contract for?

To be simple, it moves the prices between different AMMs to the same level. You'll get profit by doing that. This contract helps you to get the maximum profit. And it uses flashswap so you only need little money(just some gas fees) to run it.

### How do I know the correctness of the contract?

By default, the tests use a forking network of the BSC mainnet(thanks to the powerful hardhat tool). The tests in `SwapTest.ts` demonstrate that the contract works correctly for arbitrage. You can check it by yourself.

### But I didn't make any profit by running your bot

Well, there are too many bots running in the wild, especially in ETH and BSC. The bot code in this repo is too simple to be competitive. You can't expect just running my code and earning a bunch of money. You need to find out some strategies to make your own money.

### How can I change the token pairs the bot is monitoring?

At the first time, the bot uses `bscBaseTokens`, `bscQuoteTokens`, and `bscDexes` in `tokens.ts` to automatically get all possible token pairs and saves them into `bsc-pairs.json`. So it can reuse the json file next time the bot launches.

If you want some other pairs. You can delete the `bsc-pairs.json` and edit the three variables above. Rerun the bot so it uses the new pairs. You can check the new pairs in `bsc-pairs.json`.

### Any suggestions to be competitive?

- Lower the network latency, you can use your own node.
- Higher gas price, make sure your transaction gets handled quickly enough to take the profit. This is just like a competition between bots if they find a profitable chance at the same time.
- Monitoring lesser tokens, the more you're monitoring, the lesser frequency the bot is looping. You can run multiple bots to monitor separate token pairs.
- Go to some other networks such as FTM/Matic/..., there may be lesser bots running on them.
- Do some other works such as liquidation, arbitrage in balancer/curve/0x... You need to implement these features by yourself.

### Why terminal stucks when runnging "npx hardhat compile"?

If you are running hardhat behind a proxy, maybe you will encounter the error like `HH502: Couldn't download compiler versions list. Please check your connection` when running `npx hardhat compile`. In order to go through this error, you need to set `HTTP_PROXY` or `HTTPS_PROXY` in your terminal. According to [this issue](https://github.com/nomiclabs/hardhat/issues/1280), the hardhat version 2.4.0 and the later version has supported `HTTP_PROXY` or `HTTPS_PROXY`. So you need to change the hardhat version from `2.1.2` to `2.4.0` or later in package.json.

### Error occurs when running "npx hardhat run --network xxx bot/index.ts"

The detailed error is `TSError: x Unable to compile TypeScript. bot/index.ts:63:13 - error TS2571: Object is of type 'unknown'`. Please make run your TypeScript version is ^4.2.4. You may meet this error if your TypeScipt version is above 4.4.x.
