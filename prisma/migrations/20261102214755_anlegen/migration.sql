-- CreateTable
CREATE TABLE `checkins` (
    `id` CHAR(36) NOT NULL,
    `erstelltAm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `version` INTEGER NOT NULL,
    `schluesselId` CHAR(64) NOT NULL,
    `verschluesselterSchluessel` TEXT NOT NULL,
    `iv` VARCHAR(32) NOT NULL,
    `daten` TEXT NOT NULL,

    INDEX `checkins_erstelltAm_idx`(`erstelltAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
