-- AlterTable
ALTER TABLE "User" ADD COLUMN     "badgeDomainGroupOrder" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "certIssuerGroupOrder" TEXT NOT NULL DEFAULT '[]';
