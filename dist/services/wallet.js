"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceMultiSigOwner = exports.getGuardianWallet = exports.getCeloProvider = void 0;
const celo_ethers_wrapper_1 = require("@celo-tools/celo-ethers-wrapper");
const ethers_1 = require("ethers");
const config_1 = __importDefault(require("../config"));
const MultiSigWallet__factory_1 = require("../types/factories/MultiSigWallet__factory");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
const ts_retry_1 = require("ts-retry");
const getCeloProvider = async () => {
    const provider = new celo_ethers_wrapper_1.CeloProvider(config_1.default.BLOCKCHAIN_NETWORK);
    await provider.ready;
    return provider;
};
exports.getCeloProvider = getCeloProvider;
const getGuardianWallet = async () => {
    const provider = await exports.getCeloProvider();
    const pk = config_1.default.GUARDIAN_WALLET_PK;
    return new celo_ethers_wrapper_1.CeloWallet(pk, provider);
};
exports.getGuardianWallet = getGuardianWallet;
async function replaceMultiSigOwner({ id, newClientAddress, prisma, }) {
    var _a, _b, _c;
    let txId;
    try {
        // instantiate Guardian Wallet
        const guardianWallet = await exports.getGuardianWallet();
        // fetchuser with id
        const user = await prisma.user.findUnique({ where: { id } });
        // MultiSigWallet
        if (!user)
            throw new Error("User does not exist");
        const { multiSigAddress, userId, clientAddress } = user;
        const multiSigWallet = new ethers_1.ethers.Contract(multiSigAddress, MultiSigWallet__factory_1.MultiSigWallet__factory.createInterface(), guardianWallet);
        // connect GuardianWallet and replace old clientAddress with new generated client address
        const data = (await multiSigWallet
            .connect(guardianWallet)
            .populateTransaction.replaceOwner(clientAddress, newClientAddress)).data;
        if (!data)
            throw new Error("Cannot populate replaceOwner tx with owner A");
        // get multiSig owner tx nonce
        const guardianNonce = await multiSigWallet.nonces(guardianWallet.address);
        // generate prepare submit transaction hash for signature by ownerA
        const guardianHashToSign = ethers_1.ethers.utils.arrayify(await multiSigWallet
            .connect(guardianWallet)
            .prepareSubmitTransaction(multiSigWallet.address, 0, data, guardianNonce));
        // generate ownerA signature
        const guardianSig = ethers_1.ethers.utils.joinSignature(await guardianWallet.signMessage(guardianHashToSign));
        const gas = await multiSigWallet.estimateGas.submitTransactionByRelay(multiSigWallet.address, 0, data, guardianSig, guardianWallet.address);
        const func = multiSigWallet.submitTransactionByRelay;
        const args = [
            multiSigWallet.address,
            0,
            data,
            guardianSig,
            guardianWallet.address,
        ];
        const submitTxResponse = await ts_retry_1.retry(async () => {
            return await (await utils_1.tryWithGas(func, args, gas)).wait();
        }, { delay: 100, maxTry: 5 });
        const transactionId = ethers_1.ethers.utils.formatUnits((_c = (_b = (_a = submitTxResponse.events) === null || _a === void 0 ? void 0 : _a.find((e) => e.eventSignature == "Submission(uint256)")) === null || _b === void 0 ? void 0 : _b.args) === null || _c === void 0 ? void 0 : _c.transactionId, "wei");
        console.log("wallet.ts -- transactionId:", transactionId);
        if (!transactionId)
            throw new Error("TransactionID invalid, try again bitch");
        // update new clientAddress on user
        await prisma.user.update({
            where: { userId },
            data: { clientAddress: newClientAddress },
        });
        txId = transactionId;
    }
    catch (e) {
        logger_1.log.error("Error replacing owner: " + e, {
            id,
            newClientAddress,
        });
        txId = null;
    }
    return { transactionId: txId };
}
exports.replaceMultiSigOwner = replaceMultiSigOwner;
//# sourceMappingURL=wallet.js.map