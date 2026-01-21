/*
  Warnings:

  - You are about to drop the column `parentId` on the `category` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `category` DROP FOREIGN KEY `Category_parentId_fkey`;

-- DropIndex
DROP INDEX `Category_parentId_idx` ON `category`;

-- AlterTable
ALTER TABLE `category` DROP COLUMN `parentId`;
