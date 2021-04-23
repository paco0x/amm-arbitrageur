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

3. Edit the private and address field in above config. Then run the script to deploy:


```bash
$ hardhart --network XXX run scripts/deploy.ts

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
