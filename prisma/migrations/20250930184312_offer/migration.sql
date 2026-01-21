-- CreateTable
CREATE TABLE `Offer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `offerType` ENUM('DISCOUNT_PERCENTAGE', 'DISCOUNT_AMOUNT', 'BUY_ONE_GET_ONE', 'FREE_SHIPPING', 'SPECIAL_OFFER') NOT NULL,
    `target` ENUM('ALL_PRODUCTS', 'SPECIFIC_PRODUCTS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_BRANDS') NOT NULL DEFAULT 'ALL_PRODUCTS',
    `discountPercentage` INTEGER NULL,
    `discountAmount` INTEGER NULL,
    `minPurchaseAmount` INTEGER NULL,
    `maxDiscountAmount` INTEGER NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Offer_isActive_idx`(`isActive`),
    INDEX `Offer_startDate_endDate_idx`(`startDate`, `endDate`),
    INDEX `Offer_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfferProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offerId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,

    INDEX `OfferProduct_productId_idx`(`productId`),
    UNIQUE INDEX `OfferProduct_offerId_productId_key`(`offerId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfferCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offerId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,

    INDEX `OfferCategory_categoryId_idx`(`categoryId`),
    UNIQUE INDEX `OfferCategory_offerId_categoryId_key`(`offerId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfferBrand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offerId` INTEGER NOT NULL,
    `brandId` INTEGER NOT NULL,

    INDEX `OfferBrand_brandId_idx`(`brandId`),
    UNIQUE INDEX `OfferBrand_offerId_brandId_key`(`offerId`, `brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OfferProduct` ADD CONSTRAINT `OfferProduct_offerId_fkey` FOREIGN KEY (`offerId`) REFERENCES `Offer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfferProduct` ADD CONSTRAINT `OfferProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfferCategory` ADD CONSTRAINT `OfferCategory_offerId_fkey` FOREIGN KEY (`offerId`) REFERENCES `Offer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfferCategory` ADD CONSTRAINT `OfferCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfferBrand` ADD CONSTRAINT `OfferBrand_offerId_fkey` FOREIGN KEY (`offerId`) REFERENCES `Offer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfferBrand` ADD CONSTRAINT `OfferBrand_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
