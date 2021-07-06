import { ContractFunction, BigNumber } from "ethers";
import { CeloProvider, CeloWallet } from "@celo-tools/celo-ethers-wrapper";
import { Decimal } from "@prisma/client/runtime";

export const tryWithGas = async (
  func: ContractFunction,
  args: Array<any>,
  gas: BigNumber
) => {
  let tries = 0;
  let confirmed = false;
  while (!confirmed) {
    tries += 1;
    gas = gas.shl(1);
    let options = { gasLimit: gas };
    try {
      const result = await func(...args, options);
      await result.wait();
      confirmed = true;
      return result;
    } catch (e) {
      if (
        tries >= 5 ||
        (e.code !== "CALL_EXCEPTION" && e.code !== "UNPREDICTABLE_GAS_LIMIT")
      )
        throw e;
    }
  }
};
