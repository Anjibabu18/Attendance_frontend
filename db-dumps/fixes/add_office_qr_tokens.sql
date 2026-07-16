CREATE TABLE IF NOT EXISTS `office_qr_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(100) NOT NULL,
  `office_location_id` int NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `office_qr_tokens_token_key` (`token`),
  KEY `office_qr_tokens_office_location_id_idx` (`office_location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `office_qr_tokens`
  ADD COLUMN IF NOT EXISTS `token` varchar(100) NOT NULL,
  ADD COLUMN IF NOT EXISTS `office_location_id` int NOT NULL,
  ADD COLUMN IF NOT EXISTS `expires_at` datetime(3) NOT NULL,
  ADD COLUMN IF NOT EXISTS `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS `office_qr_tokens_token_key` ON `office_qr_tokens` (`token`);
CREATE INDEX IF NOT EXISTS `office_qr_tokens_office_location_id_idx` ON `office_qr_tokens` (`office_location_id`);