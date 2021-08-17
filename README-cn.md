# AMM Arbitrageur
## 套利原理

合约目前仅支持兼容 UniswapV2 接口的 AMM 之间套利。

假设我们要在 代币 TokenX 和代币 WETH 的交易对中套利，那么有交易对 TokenX/WETH：

- 这里的 WETH 称作 Base Token，它可以是任意代币，但必须是「有价值」的，例如 USDT/USDC/DAI/BUSD/WBNB... 等等
- 这里的 TokenX 称为 Quote Token，它可以是任意代币，即使毫无价值也没问题，因为套利结束后不会保留 Quote Token
- 套利结束后，只会保留 Base Token，即赚取的利润是以 Base Token 计价的
- 如果一个交易对中两个代币都可以作为 Base Token，那么会保留任意一个（随机）

套利使用 Uniswap v2 的 flashswap 功能，套利的流程为：

- 假设有交易对 Pair0 和 Pair1，只要他们之间有差价，就可以进行套利条件（抛开 gas 费的考虑）
- 调用合约开始套利
- 合约计算 Quote Token 的价格，假设 Pair0 中 Quote Token 价格较低，那么套利过程为：

1. 通过 flash swap ，从 Pair0 中借取数量为 x 的 Quote Token，此时我们产生了一笔负债，在交易结束前，我们需要向 Pair0 偿还数量为 y1 的 Base Token（借出 Token 和还入 Token 不同，这个是 Uni flash swap 的功能，只要保证交易对 k 值不变即可）
2. 将借来的 Quote Token 在 Pair1 中全部卖出，得到数量为 y2 的 Base Token
3. 向 Pair0 偿还 Base Token，数量为 y1
4. 交易结束，净利润为 y2 - y1

这里的关键点是计算需要借出的 Quote Token 数量，使得套利的收益最大化。

我们假设 Pair0 和 Pair1 的初始状态如下：

|                 | Pair0 | Pair1 |
| :---------------| :---- | :---- |
| Base Token 余额  | a1    |   a2  |
| Quote Token 余额 | b1    |   b2  |

那么有：

<img src="https://latex.codecogs.com/svg.image?\Delta&space;a_1&space;=&space;\frac{\Delta&space;b_1&space;\cdot&space;a_1}{b_1&space;-&space;\Delta&space;b_1}&space;\&space;\&space;\&space;\Delta&space;a_2&space;=&space;\frac{\Delta&space;b_2&space;\cdot&space;a_2}{b_2&space;&plus;&space;\Delta&space;b_2}" title="\Delta a_1 = \frac{\Delta b_1 \cdot a_1}{b_1 - \Delta b_1} \ \ \ \Delta a_2 = \frac{\Delta b_2 \cdot a_2}{b_2 + \Delta b_2}" />

因为借出的 Quote Token 数量相同，即 `Delta b1` = `Delta b2`，我们令 `x = \Delta b`，那么利润与 x 关系的函数为：

<img src="https://latex.codecogs.com/svg.image?f(x)&space;=&space;\Delta&space;a_2&space;-&space;\Delta&space;a_1&space;=&space;\frac&space;{a_2&space;\cdot&space;x}{b_2&plus;x}&space;-&space;\frac&space;{a_1&space;\cdot&space;x}{b_1-x}" title="f(x) = \Delta a_2 - \Delta a_1 = \frac {a_2 \cdot x}{b_2+x} - \frac {a_1 \cdot x}{b_1-x}" />

我们需要求出当利润最大时 x 的值，此时 x 即为我们需要借出的 Quote Token 数量。先对上面的函数求导：

<img src="https://latex.codecogs.com/svg.image?f'(x)&space;=&space;\frac{a_2b_2}{(b_2&plus;x)^2}&space;-&space;&space;\frac{a_1b_1}{(b_1-x)^2}" title="f'(x) = \frac{a_2b_2}{(b_2+x)^2} - \frac{a_1b_1}{(b_1-x)^2}" />

导函数为 0 时，函数有极限值，我们可以通过一些条件设定，忽略极小值时的解。可以解出：

<img src="https://latex.codecogs.com/svg.image?\frac{a_2b_2}{(b_2&plus;x)^2}&space;-&space;&space;\frac{a_1b_1}{(b_1-x)^2}&space;=&space;0&space;" title="\frac{a_2b_2}{(b_2+x)^2} - \frac{a_1b_1}{(b_1-x)^2} = 0 " />

<img src="https://latex.codecogs.com/svg.image?(a_1b_1-a_2b_2)x^2&space;&plus;&space;2b_1b_2(a_1&plus;a_2)x&space;&plus;&space;b_1b_2(a_1b_2&space;-&space;a_2b_1)&space;=&space;0&space;" title="(a_1b_1-a_2b_2)x^2 + 2b_1b_2(a_1+a_2)x + b_1b_2(a_1b_2 - a_2b_1) = 0 " />

我们可以令：

<img src="https://latex.codecogs.com/svg.image?\begin{cases}a&space;=&space;a_1b_1&space;-&space;a_2b_2&space;\\b&space;=&space;2b_1b_2(a_1&space;&plus;&space;a_2)&space;\\c&space;=&space;b_1b_2(a_1b_2&space;-&space;a_2b_1)\end{cases}&space;" title="\begin{cases}a = a_1b_1 - a_2b_2 \\b = 2b_1b_2(a_1 + a_2) \\c = b_1b_2(a_1b_2 - a_2b_1)\end{cases} " />

那么前面的方程式化为一般的一元二次方程：

<img src="https://latex.codecogs.com/svg.image?ax^2&plus;bx&plus;c=0&space;" title="ax^2+bx+c=0 " />

解得：

<img src="https://latex.codecogs.com/svg.image?\begin{cases}x=\displaystyle&space;\frac{-b&space;\pm&space;\sqrt{b^2-4ac}}{2a}&space;\\0&space;<&space;x&space;<&space;b_1&space;\\x&space;<&space;b_2\end{cases}" title="\begin{cases}x=\displaystyle \frac{-b \pm \sqrt{b^2-4ac}}{2a} \\0 < x < b_1 \\x < b_2\end{cases}" />

最后求出满足条件的 x 值，即为我们需要借贷的 Quote Token 数量。

## 部署合约
1. 编辑 `hardhat.config.ts` 中的网络配置。（目前都是 BSC 的地址）。

2. 拷贝私钥配置文件：

```bash
$ cp .secret.ts.sample .secret.ts
```

3. 填入部署账户的私钥和地址信息。运行脚本部署合约：


```bash
$ hardhat --network XXX run scripts/deploy.ts

```

## Bot

合约提供了 `getProfit(address pool1, address pool2)` 接口，可以计算出两个交易对之间套利的最大利润（以 Base Tokne计价）。

Bot 需要在多个 AMM DEX 的多个代币对之间，调用 `getProfit()` 查询利润，一但利润满足设定的阈值，即可调用 `flashArbitrage(pool1, pool2)` 进行套利，获得的收益将保存在合约中。

项目实现了 typescript 版本的 bot，运行方式：

```bash
$ yarn run bot
```

## BSC 上可套利的 DEX

- [PancakeSwap](https://pancakeswap.finance/)
- [MDEX](https://bsc.mdex.com/)
- [BakerySwap](https://www.bakeryswap.org/#/swap)
- [JulSwap](https://julswap.com/#/)
- [~~ValueDeFi~~](https://bsc.valuedefi.io/) （暂不支持）

## 运行 UT

```bash
$ hardhat test
```
