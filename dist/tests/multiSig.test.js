"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const MultiSigJson = __importStar(require("../artifacts/contracts/MultiSigWalletWithRelay.sol/MultiSigWallet.json"));
describe("MultiSig Tests", function () {
    let coSigner;
    let ownerA;
    let ownerB;
    let ownerC;
    let multiSigWallet;
    before(async function () {
        const accounts = await hardhat_1.ethers.getSigners();
        coSigner = accounts[0];
        ownerA = accounts[1];
        ownerB = accounts[2];
        ownerC = accounts[3];
    });
    it("Successfully deploys a multiSig wallet contract with ownerA and ownerB", async function () {
        multiSigWallet = (await hardhat_1.waffle.deployContract(coSigner, MultiSigJson, [
            [ownerA.address, ownerB.address],
            2,
        ]));
        chai_1.expect(multiSigWallet.address).to.properAddress;
        const owners = await multiSigWallet.getOwners();
        chai_1.expect(owners).to.contain(ownerA.address);
        chai_1.expect(owners).to.contain(ownerB.address);
    });
    it("Successfully replaces ownerB with ownerC", async () => {
        var _a, _b, _c;
        // populate replaceOwner transaction using ownerA wallet
        const data = (await multiSigWallet
            .connect(ownerA)
            .populateTransaction.replaceOwner(ownerB.address, ownerC.address)).data;
        // get multiSig owner tx nonce
        const ownerANonce = await multiSigWallet.nonces(ownerA.address);
        // generate prepare submit transaction hash for signature by ownerA
        const ownerAHashToSign = hardhat_1.ethers.utils.arrayify(await multiSigWallet
            .connect(ownerA)
            .prepareSubmitTransaction(multiSigWallet.address, 0, data, ownerANonce));
        // generate ownerA signature
        const ownerASig = hardhat_1.ethers.utils.joinSignature(await ownerA.signMessage(ownerAHashToSign));
        const submissionResult = await (await multiSigWallet.submitTransactionByRelay(multiSigWallet.address, 0, data, ownerASig, ownerA.address)).wait();
        const transactionId = (_c = (_b = (_a = submissionResult.events) === null || _a === void 0 ? void 0 : _a.find((e) => e.eventSignature == "Submission(uint256)")) === null || _b === void 0 ? void 0 : _b.args) === null || _c === void 0 ? void 0 : _c.transactionId;
        chai_1.expect(transactionId).to.equal(0);
        // get nonce of ownerB
        const ownerBNonce = await multiSigWallet.nonces(ownerB.address);
        // generate prepare confirm transaction hash for signature by coSigner
        const ownerBHashToSign = hardhat_1.ethers.utils.arrayify(await multiSigWallet
            .connect(ownerB)
            .prepareConfirmTransaction(transactionId, ownerBNonce));
        // generate coSigner signature
        const ownerBSig = hardhat_1.ethers.utils.joinSignature(await ownerB.signMessage(ownerBHashToSign));
        // 3. confirmTransactionByRelay using ownerB wallet
        await chai_1.expect(multiSigWallet.confirmTransactionByRelay(transactionId, ownerBSig, ownerB.address)).to.emit(multiSigWallet, "Execution");
        const owners = await multiSigWallet.getOwners();
        chai_1.expect(owners).to.contain(ownerA.address);
        chai_1.expect(owners).to.contain(ownerC.address);
    });
});
//# sourceMappingURL=multiSig.test.js.map