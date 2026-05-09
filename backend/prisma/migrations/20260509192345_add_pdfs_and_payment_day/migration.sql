-- AlterTable
ALTER TABLE `companies` ADD COLUMN `contract_pdf_url` TEXT NULL,
    ADD COLUMN `onboarding_pdf_url` TEXT NULL,
    ADD COLUMN `payment_day` INTEGER NULL;
