import { ethers } from "ethers";
import { MultiSigWallet } from "../types/MultiSigWallet";
import { MultiSigWallet__factory } from "../types/factories/MultiSigWallet__factory";

import { getGuardianWallet } from "../services/wallet";
import { tryWithGas } from "../utils";

describe("Guardian Wallet", function () {
  let multiSig;
  let guardian;
  let addresses;

  beforeAll(async function () {
    //   deploy multisig
    guardian = await getGuardianWallet();
    addresses = [
      guardian.address,
      "0xAbeB77559A15F520A9e79982ACd6Cf8951b94949",
    ];

    const walletFactory = new MultiSigWallet__factory(guardian);
    const deployResult = await (
      await walletFactory.deploy(addresses, 2)
    ).deployTransaction.wait();

    const multiSigAddress = deployResult.contractAddress;
    multiSig = new ethers.Contract(
      multiSigAddress,
      MultiSigWallet__factory.createInterface(),
      guardian
    ) as MultiSigWallet;
  });

  it("Successfully creates replaceMultiSigOwner tx", async function () {
    const newClient = "0x820177b52a29e16201de057578575eaba40e68de";
    const data = (
      await multiSig
        .connect(guardian)
        .populateTransaction.replaceOwner(addresses[1], newClient)
    ).data;

    if (!data)
      throw new Error(
        "Cannot populate replaceOwner tx with new client address"
      );

    // get multiSig owner tx nonce
    const guardianNonce = await multiSig.nonces(guardian.address);

    // generate prepare submit transaction hash for signature by ownerA
    const guardianHashToSign = ethers.utils.arrayify(
      await multiSig
        .connect(guardian)
        .prepareSubmitTransaction(multiSig.address, 0, data, guardianNonce)
    );

    // generate ownerA signature
    const guardianSig = ethers.utils.joinSignature(
      await guardian.signMessage(guardianHashToSign)
    );

    const gas = await multiSig.estimateGas.submitTransactionByRelay(
      multiSig.address,
      0,
      data,
      guardianSig,
      guardian.address
    );

    const func = multiSig.submitTransactionByRelay;

    const args = [multiSig.address, 0, data, guardianSig, guardian.address];

    const confirmTxResponse = await (await tryWithGas(func, args, gas)).wait();

    const transactionId = ethers.utils.formatUnits(
      confirmTxResponse.events?.find(
        (e: any) => e.eventSignature == "Submission(uint256)"
      )?.args?.transactionId,
      "wei"
    );

    expect(transactionId).toEqual("0");
  });
});
