-- Update existing NULL phone values to empty string before making NOT NULL
UPDATE `patients` SET `phone` = '' WHERE `phone` IS NULL;

-- AlterTable
ALTER TABLE `patients` MODIFY `phone` varchar(191) NOT NULL;
