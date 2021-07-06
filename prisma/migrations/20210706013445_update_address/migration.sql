/*
  Warnings:

  - You are about to drop the column `multiSigAdress` on the `User` table. All the data in the column will be lost.
  - Added the required column `clientAdress` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `multiSigAddress` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "multiSigAdress",
ADD COLUMN     "clientAdress" TEXT NOT NULL,
ADD COLUMN     "multiSigAddress" TEXT NOT NULL;
