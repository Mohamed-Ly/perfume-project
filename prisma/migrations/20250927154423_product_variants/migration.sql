-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `sizeMl` INTEGER NULL,
    `concentration` VARCHAR(191) NULL,
    `priceCents` INTEGER NOT NULL,
    `stockQty` INTEGER NOT NULL DEFAULT 0,
    `sku` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductVariant_productId_idx`(`productId`),
    INDEX `ProductVariant_sku_idx`(`sku`),
    INDEX `ProductVariant_barcode_idx`(`barcode`),
    UNIQUE INDEX `ProductVariant_productId_sizeMl_concentration_key`(`productId`, `sizeMl`, `concentration`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
