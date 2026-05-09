-- AlterTable: adiciona campos de período do tráfego pago
-- Usa IF NOT EXISTS para ser idempotente
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `traffic_budget_start_at` DATETIME(3) NULL;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `traffic_budget_end_at`   DATETIME(3) NULL;
