/*
  Warnings:

  - A unique constraint covering the columns `[client_portal_token]` on the table `companies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `companies` ADD COLUMN `client_portal_token` VARCHAR(191) NULL,
    ADD COLUMN `contrato_info` TEXT NULL,
    ADD COLUMN `facebook_url` VARCHAR(191) NULL,
    ADD COLUMN `faturamento` DECIMAL(14, 2) NULL,
    ADD COLUMN `instagram_url` VARCHAR(191) NULL,
    ADD COLUMN `investimento` DECIMAL(14, 2) NULL,
    ADD COLUMN `meta_access_token` TEXT NULL,
    ADD COLUMN `pagamentos_info` TEXT NULL,
    ADD COLUMN `roi` DOUBLE NULL,
    ADD COLUMN `tiktok_url` VARCHAR(191) NULL,
    ADD COLUMN `trafego_pago_orcamento` DECIMAL(14, 2) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `companies_client_portal_token_key` ON `companies`(`client_portal_token`);
