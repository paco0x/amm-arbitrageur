import { ethers } from "hardhat";
import { TestMath } from "../typechain/TestMath";

import { expect } from "./shared/expect";

const { BigNumber } = ethers;

describe("MathTest", () => {
  let math: TestMath;

  beforeEach(async () => {
    const mathTestFactory = await ethers.getContractFactory("TestMath");
    math = (await mathTestFactory.deploy()) as TestMath;
  });

  it("Should calculate square root corectly", async () => {
    const input = BigNumber.from("100");
    const res = await math._sqrt(input);
    console.log(res.toString());
    expect(res).to.be.eq(BigNumber.from(10));
  });
});
