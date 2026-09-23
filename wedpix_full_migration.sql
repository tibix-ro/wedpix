-- ============================================================
-- WedPix Full MySQL Migration Schema
-- Covers: legacy photo flow + full SaaS schema
-- Compatible with MySQL 5.7+ and MariaDB 10.3+
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ============================================================
-- 1) Core tables (create if missing)
-- ============================================================

CREATE TABLE IF NOT EXISTS photos (
  id              INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  filename        VARCHAR(255)      NOT NULL,
  original_name   VARCHAR(255)      NOT NULL,
  mime_type       VARCHAR(100)      NOT NULL,
  size_bytes      INT UNSIGNED      NOT NULL,
  width           SMALLINT UNSIGNED DEFAULT NULL,
  height          SMALLINT UNSIGNED DEFAULT NULL,
  uploader_name   VARCHAR(100)      NOT NULL,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id                           INT UNSIGNED       AUTO_INCREMENT PRIMARY KEY,
  name                         VARCHAR(150)       NOT NULL,
  email                        VARCHAR(255)       NOT NULL,
  password_hash                VARCHAR(255)       NOT NULL,
  email_verified               TINYINT(1)         NOT NULL DEFAULT 0,
  email_notifications_enabled  TINYINT(1)         NOT NULL DEFAULT 1,
  email_daily_summary          TINYINT(1)         NOT NULL DEFAULT 0,
  email_usage_alerts           TINYINT(1)         NOT NULL DEFAULT 1,
  email_expiry_alerts          TINYINT(1)         NOT NULL DEFAULT 1,
  stripe_customer_id           VARCHAR(100)       DEFAULT NULL,
  fiscal_type                  ENUM('PF','PJ')    DEFAULT 'PF',
  company_name                 VARCHAR(255)       DEFAULT NULL,
  cui                          VARCHAR(20)        DEFAULT NULL,
  reg_number                   VARCHAR(50)        DEFAULT NULL,
  address                      VARCHAR(255)       DEFAULT NULL,
  city                         VARCHAR(100)       DEFAULT NULL,
  county                       VARCHAR(100)       DEFAULT NULL,
  postal_code                  VARCHAR(20)        DEFAULT NULL,
  created_at                   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_stripe_cid (stripe_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id                INT UNSIGNED NOT NULL,
  plan                   ENUM('demo','silver','gold','platinum') NOT NULL,
  extra_video            TINYINT(1)   NOT NULL DEFAULT 0,
  extra_zip              TINYINT(1)   NOT NULL DEFAULT 0,
  extra_slideshow        TINYINT(1)   NOT NULL DEFAULT 0,
  extra_validity_days    INT UNSIGNED NOT NULL DEFAULT 0,
  extra_photo_limit      INT UNSIGNED NOT NULL DEFAULT 0,
  status                 ENUM('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
  stripe_session_id      VARCHAR(255) DEFAULT NULL,
  stripe_payment_intent  VARCHAR(255) DEFAULT NULL,
  price_ron              DECIMAL(8,2) NOT NULL,
  started_at             DATETIME     DEFAULT NULL,
  expires_at             DATETIME     DEFAULT NULL,
  created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sub_user_status (user_id, status),
  INDEX idx_sub_stripe_session (stripe_session_id),
  CONSTRAINT fk_subscriptions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  subscription_id  INT UNSIGNED NOT NULL,
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(255) NOT NULL,
  description      TEXT         DEFAULT NULL,
  event_date       DATE         DEFAULT NULL,
  cover_image      VARCHAR(255) DEFAULT NULL,
  status           ENUM('active','expired','archived') NOT NULL DEFAULT 'active',
  expires_at       DATETIME     DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_events_slug (slug),
  INDEX idx_events_user_id (user_id),
  INDEX idx_events_status (status),
  INDEX idx_events_expires (expires_at),
  CONSTRAINT fk_events_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS images (
  id              INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  event_id        INT UNSIGNED      NOT NULL,
  filename        VARCHAR(255)      NOT NULL,
  original_name   VARCHAR(255)      NOT NULL,
  mime_type       VARCHAR(100)      NOT NULL,
  size_bytes      INT UNSIGNED      NOT NULL,
  width           SMALLINT UNSIGNED DEFAULT NULL,
  height          SMALLINT UNSIGNED DEFAULT NULL,
  uploader_name   VARCHAR(100)      NOT NULL,
  is_video        TINYINT(1)        NOT NULL DEFAULT 0,
  is_hidden       TINYINT(1)        NOT NULL DEFAULT 0,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_images_event_created (event_id, created_at),
  INDEX idx_images_event_id (event_id),
  INDEX idx_images_is_hidden (is_hidden),
  CONSTRAINT fk_images_event
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id                  INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  subscription_id     INT UNSIGNED  NOT NULL,
  user_id             INT UNSIGNED  NOT NULL,
  invoice_number      VARCHAR(50)   NOT NULL,
  fiscal_type         ENUM('PF','PJ') NOT NULL,
  seller_name         VARCHAR(150)  NOT NULL DEFAULT 'NIXART ROMANIA SRL',
  seller_cui          VARCHAR(20)   NOT NULL DEFAULT '47207003',
  seller_address      VARCHAR(255)  NOT NULL DEFAULT 'Bacau, Romania',
  seller_phone        VARCHAR(20)   NOT NULL DEFAULT '+40 750 222 962',
  seller_email        VARCHAR(100)  NOT NULL DEFAULT 'billing@wedpix.ro',
  client_name         VARCHAR(255)  NOT NULL,
  client_cui          VARCHAR(20)   DEFAULT NULL,
  client_address      VARCHAR(255)  DEFAULT NULL,
  client_city         VARCHAR(100)  DEFAULT NULL,
  client_county       VARCHAR(100)  DEFAULT NULL,
  client_postal_code  VARCHAR(20)   DEFAULT NULL,
  description         VARCHAR(255)  NOT NULL,
  amount_pretax       DECIMAL(10,2) NOT NULL,
  vat_rate            DECIMAL(4,2)  NOT NULL DEFAULT 19.00,
  vat_amount          DECIMAL(10,2) NOT NULL,
  total_amount        DECIMAL(10,2) NOT NULL,
  currency            CHAR(3)       NOT NULL DEFAULT 'RON',
  payment_method      VARCHAR(50)   NOT NULL DEFAULT 'Stripe',
  status              ENUM('draft','issued','paid','cancelled') NOT NULL DEFAULT 'issued',
  issued_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_at              DATETIME      DEFAULT NULL,
  paid_at             DATETIME      DEFAULT NULL,
  notes               TEXT          DEFAULT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invoices_number (invoice_number),
  INDEX idx_invoices_user_date (user_id, issued_at),
  INDEX idx_invoices_status (status),
  CONSTRAINT fk_invoices_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2) Migration helpers (for existing DBs that were created with
--    older/incomplete schemas)
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing $$
CREATE PROCEDURE add_column_if_missing(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = p_table
          AND column_name = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS add_index_if_missing $$
CREATE PROCEDURE add_index_if_missing(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_index_sql TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = p_table
          AND index_name = p_index
    ) THEN
        SET @sql = p_index_sql;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DROP PROCEDURE IF EXISTS add_fk_if_missing $$
CREATE PROCEDURE add_fk_if_missing(
    IN p_table VARCHAR(64),
    IN p_constraint VARCHAR(64),
    IN p_fk_sql TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = DATABASE()
          AND table_name = p_table
          AND constraint_name = p_constraint
          AND constraint_type = 'FOREIGN KEY'
    ) THEN
        SET @sql = p_fk_sql;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END $$

DELIMITER ;

-- users
CALL add_column_if_missing('users', 'email_notifications_enabled', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('users', 'email_daily_summary', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('users', 'email_usage_alerts', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('users', 'email_expiry_alerts', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL add_column_if_missing('users', 'stripe_customer_id', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('users', 'fiscal_type', "ENUM('PF','PJ') DEFAULT 'PF'");
CALL add_column_if_missing('users', 'company_name', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_missing('users', 'cui', 'VARCHAR(20) DEFAULT NULL');
CALL add_column_if_missing('users', 'reg_number', 'VARCHAR(50) DEFAULT NULL');
CALL add_column_if_missing('users', 'address', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_missing('users', 'city', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('users', 'county', 'VARCHAR(100) DEFAULT NULL');
CALL add_column_if_missing('users', 'postal_code', 'VARCHAR(20) DEFAULT NULL');

-- subscriptions
CALL add_column_if_missing('subscriptions', 'stripe_payment_intent', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_missing('subscriptions', 'started_at', 'DATETIME DEFAULT NULL');
CALL add_column_if_missing('subscriptions', 'expires_at', 'DATETIME DEFAULT NULL');

-- events
CALL add_column_if_missing('events', 'status', "ENUM('active','expired','archived') NOT NULL DEFAULT 'active'");
CALL add_column_if_missing('events', 'expires_at', 'DATETIME DEFAULT NULL');
CALL add_column_if_missing('events', 'cover_image', 'VARCHAR(255) DEFAULT NULL');

-- images
CALL add_column_if_missing('images', 'is_video',     'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('images', 'is_hidden',    'TINYINT(1) NOT NULL DEFAULT 0');
CALL add_column_if_missing('images', 'likes_count',  'INT UNSIGNED NOT NULL DEFAULT 0');

-- missing indexes commonly required by API queries
CALL add_index_if_missing('users', 'idx_users_stripe_cid', 'ALTER TABLE `users` ADD INDEX `idx_users_stripe_cid` (`stripe_customer_id`)');
CALL add_index_if_missing('subscriptions', 'idx_sub_user_status', 'ALTER TABLE `subscriptions` ADD INDEX `idx_sub_user_status` (`user_id`, `status`)');
CALL add_index_if_missing('subscriptions', 'idx_sub_stripe_session', 'ALTER TABLE `subscriptions` ADD INDEX `idx_sub_stripe_session` (`stripe_session_id`)');
CALL add_index_if_missing('events', 'idx_events_user_id', 'ALTER TABLE `events` ADD INDEX `idx_events_user_id` (`user_id`)');
CALL add_index_if_missing('events', 'idx_events_status', 'ALTER TABLE `events` ADD INDEX `idx_events_status` (`status`)');
CALL add_index_if_missing('events', 'idx_events_expires', 'ALTER TABLE `events` ADD INDEX `idx_events_expires` (`expires_at`)');
CALL add_index_if_missing('images', 'idx_images_event_created', 'ALTER TABLE `images` ADD INDEX `idx_images_event_created` (`event_id`, `created_at`)');
CALL add_index_if_missing('images', 'idx_images_event_id', 'ALTER TABLE `images` ADD INDEX `idx_images_event_id` (`event_id`)');
CALL add_index_if_missing('images', 'idx_images_is_hidden', 'ALTER TABLE `images` ADD INDEX `idx_images_is_hidden` (`is_hidden`)');
CALL add_index_if_missing('invoices', 'idx_invoices_user_date', 'ALTER TABLE `invoices` ADD INDEX `idx_invoices_user_date` (`user_id`, `issued_at`)');
CALL add_index_if_missing('invoices', 'idx_invoices_status', 'ALTER TABLE `invoices` ADD INDEX `idx_invoices_status` (`status`)');

-- foreign keys for legacy DBs that were imported without constraints
SET @old_fk_checks = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

CALL add_fk_if_missing('subscriptions', 'fk_subscriptions_user',
  'ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE');
CALL add_fk_if_missing('events', 'fk_events_user',
  'ALTER TABLE `events` ADD CONSTRAINT `fk_events_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE');
CALL add_fk_if_missing('events', 'fk_events_subscription',
  'ALTER TABLE `events` ADD CONSTRAINT `fk_events_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT');
CALL add_fk_if_missing('images', 'fk_images_event',
  'ALTER TABLE `images` ADD CONSTRAINT `fk_images_event` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE');
CALL add_fk_if_missing('invoices', 'fk_invoices_subscription',
  'ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoices_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE');
CALL add_fk_if_missing('invoices', 'fk_invoices_user',
  'ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoices_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE');

SET FOREIGN_KEY_CHECKS = @old_fk_checks;

-- Cleanup helper procedures
DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
DROP PROCEDURE IF EXISTS add_fk_if_missing;

-- ============================================================
-- End of migration
-- ============================================================
