import lodash from 'lodash';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { InternalFuncTest } from '../typechain/InternalFuncTest';

const { BigNumber } = ethers;

describe('MathTest', () => {
  let flashBot: InternalFuncTest;

  beforeEach(async () => {
    const factory = await ethers.getContractFactory('InternalFuncTest');
    flashBot = (await factory.deploy()) as InternalFuncTest;
  });

  describe('#sqrt', () => {
    it('calculate square root correctly with small input', async () => {
      const input = BigNumber.from('100');
      const res = await flashBot._sqrt(input);
      expect(res).to.be.eq(BigNumber.from(10));
    });

    it('calculate square root correctly with large input', async () => {
      const input = ethers.utils.parseEther('10000');
      const res = await flashBot._sqrt(input);
      expect(res).to.be.eq(BigNumber.from('100000000000'));
    });
  });

  describe('#calcSolutionForQuadratic', () => {
    it('calculate right solution for quadratic', async () => {
      const [a, b, c] = ['59995000000', '120100000000000', '59500000000000000'].map((v) => ethers.utils.parseEther(v));
      const [x1, x2] = await flashBot._calcSolutionForQuadratic(a, b, c);

      expect(x1).to.be.eq(BigNumber.from('-900'));
      expect(x2).to.be.eq(BigNumber.from('-1101'));
    });

    it('calculate right solution for quadratic with negative number', async () => {
      const [a, b, c] = ['-10000000000', '2200000000000000', '-1000000000000000000'].map((v) =>
        ethers.utils.parseEther(v)
      );
      const [x1, x2] = await flashBot._calcSolutionForQuadratic(a, b, c);

      expect(x1).to.be.eq(BigNumber.from('455'));
      expect(x2).to.be.eq(BigNumber.from('219544'));
    });
  });

  describe('#calcBorrowAmount', () => {
    it('returns right amount with small liquidity pairs', async () => {
      const reserves = { a1: '5000', b1: '10', a2: '6000', b2: '10' };
      const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
      const res = await flashBot._calcBorrowAmount(input);
      // @ts-ignore
      expect(res).to.be.closeTo(ethers.utils.parseEther('0.45'), ethers.utils.parseEther('0.01'));
    });

    it('returns right amount with large liquidity pairs', async () => {
      const reserves = { a1: '1200000000', b1: '600000', a2: '1000000000', b2: '300000' };
      const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
      const res = await flashBot._calcBorrowAmount(input);
      // @ts-ignore
      expect(res).to.be.closeTo(ethers.utils.parseEther('53052.8604'), ethers.utils.parseEther('1500'));
    });

    it('returns right amount with big difference between liquidity pairs', async () => {
      const reserves = { a1: '1200000000', b1: '600000', a2: '100000', b2: '30' };
      const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
      const res = await flashBot._calcBorrowAmount(input);
      // @ts-ignore
      expect(res).to.be.closeTo(ethers.utils.parseEther('8.729'), ethers.utils.parseEther('0.01'));
    });

    it('revert with wrong order input', async () => {
      const reserves = { a1: '1000000000', b1: '300000', a2: '1200000000', b2: '600000' };
      const input = lodash.mapValues(reserves, (v) => ethers.utils.parseEther(v));
      await expect(flashBot._calcBorrowAmount(input)).to.be.revertedWith('Wrong input order');
    });
  });
});
