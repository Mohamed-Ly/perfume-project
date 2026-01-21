-- AlterTable
ALTER TABLE `order` ADD COLUMN `cancelDeadline` DATETIME(3) NULL,
    ADD COLUMN `cancelledByUser` BOOLEAN NOT NULL DEFAULT false;
