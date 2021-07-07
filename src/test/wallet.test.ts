import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { customAlphabet } from "nanoid";
import request from "supertest";

import { main as controller } from "../controllers/main.controller";
import { createServer } from "../server";
import { getGuardianWallet } from "../services/wallet";
import { MultiSigWallet__factory } from "../types/factories/MultiSigWallet__factory";
import { MultiSigWallet } from "../types/MultiSigWallet";
import { tryWithGas } from "../services/utils";

const prisma = new PrismaClient();
const nanoid = customAlphabet("1234567890abcdef", 10);

describe("Guardian Test Suite", function () {
  let multiSig, guardian, addresses, data, app;
  const newClient = "0x7a7cE72c9c0410113e7C2608c584Ea05e683F4f5";
  const oldClient = "0xAbeB77559A15F520A9e79982ACd6Cf8951b94949";
  const email = nanoid() + "@resourcenetwork.co";

  beforeAll(async function () {
    //   init express app
    app = createServer(
      {
        prisma,
      },
      controller
    );

    //   deploy multisig
    guardian = await getGuardianWallet();
    addresses = [guardian.address, oldClient];

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

    data = {
      userId: nanoid(),
      multiSigAddress: multiSig.address,
      clientAddress: oldClient,
      email: email,
    };
  });

  it("should respond with status of 'OK'", async () => {
    return await request(app)
      .get("/api/")
      .then((response) => {
        const { text } = response;
        expect(text).toStrictEqual("OK");
      })
      .catch((err) => console.log(err));
  });

  it("should respond with a newly created user", async () => {
    return await request(app)
      .post("/api/register")
      .set("Content-Type", "application/json")
      .send(data)
      .then((response) => {
        const {
          body: { user },
        } = response;
        expect(user).toHaveProperty("userId");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("clientAddress");
        expect(user).toHaveProperty("multiSigAddress");
      })
      .catch((err) => console.log(err));
  });

  it("should call replaceMultiSigOwner successfully", async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("wallet.test.ts -- user:", user);
    expect(user).toBeTruthy();

    const toReplace = {
      validateEmailToken: user?.validateEmailToken,
      newClientAddress: newClient,
      email,
    };

    console.log("wallet.test.ts -- toReplace:", toReplace);

    return await request(app)
      .post("/api/recover")
      .set("Content-Type", "application/json")
      .send(toReplace)
      .then((response) => {
        const {
          body: { user, tx },
        } = response;

        console.log("wallet.test.ts -- user:", user);
        console.log("wallet.test.ts -- tx:", tx);
      })
      .catch((err) => console.log(err));
  });
});
