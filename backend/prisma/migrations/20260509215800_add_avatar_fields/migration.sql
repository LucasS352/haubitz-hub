-- AlterTable: adiciona campo avatar nas tabelas users e companies
-- Usa IF NOT EXISTS para evitar erro se a coluna já existir (idempotente)
ALTER TABLE `users`     ADD COLUMN IF NOT EXISTS `avatar` VARCHAR(191) NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `avatar` VARCHAR(191) NULL;
