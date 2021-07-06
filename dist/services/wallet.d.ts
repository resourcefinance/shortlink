import { CeloProvider, CeloWallet } from "@celo-tools/celo-ethers-wrapper";
import { PrismaClient } from "@prisma/client";
export declare const getCeloProvider: () => Promise<CeloProvider>;
export declare const getGuardianWallet: () => Promise<CeloWallet>;
export declare function replaceMultiSigOwner({ id, newClientAddress, prisma, }: {
    id: string;
    newClientAddress: string;
    prisma: PrismaClient;
}): Promise<{
    transactionId: string | null;
}>;
