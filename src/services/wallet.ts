import { CeloProvider, CeloWallet } from "@celo-tools/celo-ethers-wrapper";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";

import config from "../config";
import { MultiSigWallet } from "../types/MultiSigWallet";
import { MultiSigWallet__factory } from "../types/factories/MultiSigWallet__factory";
import { log } from "./logger";

export const getCeloProvider = async () => {
  const provider = new CeloProvider(config.BLOCKCHAIN_NETWORK);
  await provider.ready;
  return provider;
};

export const getGuardianWallet = async () => {
  const provider = await getCeloProvider();
  const pk = config.GUARDIAN_WALLET_PK;
  return new CeloWallet(pk, provider);
};

export async function replaceMultiSigOwner({
  id,
  newClientAddress,
  prisma,
}: {
  id: string;
  newClientAddress: string;
  prisma: PrismaClient;
}) {
  let txId: string | null;
  try {
    // instantiate Guardian Wallet
    const guardianWallet = await getGuardianWallet();
    console.log("wallet.ts -- guardianWallet:", guardianWallet);

    // fetchuser with id
    const user = await prisma.user.findUnique({ where: { id } });

    // MultiSigWallet
    if (!user) throw new Error("User does not exist");

    const { multiSigAddress, userId, clientAddress } = user;

    const multiSigWallet = new ethers.Contract(
      multiSigAddress,
      MultiSigWallet__factory.createInterface(),
      guardianWallet
    ) as MultiSigWallet;
    console.log("wallet.ts -- multiSigWallet:", multiSigWallet);

    // connect GuardianWallet and replace old clientAddress with new generated client address
    const data = (
      await multiSigWallet
        .connect(guardianWallet)
        .populateTransaction.replaceOwner(clientAddress, newClientAddress)
    ).data;

    console.log("wallet.ts -- data:", data);
    if (!data) throw new Error("Cannot populate replaceOwner tx with owner A");

    // get multiSig owner tx nonce
    console.log("wallet.ts -- guardianWallet.address:", guardianWallet.address);
    const guardianNonce = await multiSigWallet.nonces(guardianWallet.address);

    console.log("wallet.ts -- guardianNonce:", guardianNonce);

    // generate prepare submit transaction hash for signature by ownerA
    const guardianHashToSign = ethers.utils.arrayify(
      await multiSigWallet
        .connect(guardianWallet)
        .prepareSubmitTransaction(
          multiSigWallet.address,
          0,
          data,
          guardianNonce
        )
    );
    console.log("wallet.ts -- guardianHashToSign:", guardianHashToSign);

    // generate ownerA signature
    const guardianSig = ethers.utils.joinSignature(
      await guardianWallet.signMessage(guardianHashToSign)
    );
    console.log("wallet.ts -- guardianSig:", guardianSig);
    
    // generate new transaction
    const submissionResult = await (
      await multiSigWallet.submitTransactionByRelay(
        multiSigWallet.address,
        0,
        data,
        guardianSig,
        guardianWallet.address
      )
    ).wait();
    console.log("wallet.ts -- submissionResult:", submissionResult);

    // fetch transactionId from submissionResult events
    const transactionId = submissionResult.events?.find(
      (e: any) => e.eventSignature == "Submission(uint256)"
    )?.args?.transactionId;
    console.log("wallet.ts -- transactionId:", transactionId);

    if (!transactionId)
      throw new Error("TransactionID invalid, try again bitch");

    // update new clientAddress on user
    await prisma.user.update({
      where: { userId },
      data: { clientAddress: newClientAddress },
    });

    txId = transactionId;
  } catch (e) {
    log.error("Error replacing owner: " + e, {
      id,
      newClientAddress,
    });
    txId = null;
  }

  return { transactionId: txId };
}
