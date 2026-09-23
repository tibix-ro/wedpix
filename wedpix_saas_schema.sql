-- ============================================================
-- WedPix SaaS — Database Schema
-- ============================================================
-- Import via phpMyAdmin → select DB first (e.g. srgsgxsh_wedpix)
-- DO NOT run CREATE DATABASE — use cPanel MySQL Databases panel.
-- ============================================================

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(150)      NOT NULL,
  email               VARCHAR(255)      NOT NULL,
  password_hash       VARCHAR(255)      NOT NULL,
  email_verified      TINYINT(1)        NOT NULL DEFAULT 0,
  email_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
  email_daily_summary TINYINT(1)        NOT NULL DEFAULT 0,
  email_usage_alerts  TINYINT(1)        NOT NULL DEFAULT 1,
  email_expiry_alerts TINYINT(1)        NOT NULL DEFAULT 1,
  stripe_customer_id  VARCHAR(100)      DEFAULT NULL,
  fiscal_type         ENUM('PF','PJ')   DEFAULT 'PF',
  company_name        VARCHAR(255)      DEFAULT NULL,
  cui                 VARCHAR(20)       DEFAULT NULL,
  reg_number          VARCHAR(50)       DEFAULT NULL,
  address             VARCHAR(255)       DEFAULT NULL,
  city                VARCHAR(100)      DEFAULT NULL,
  county              VARCHAR(100)      DEFAULT NULL,
  postal_code         VARCHAR(20)       DEFAULT NULL,
  created_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE  KEY uq_email        (email),
  INDEX         idx_stripe_cid (stripe_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── subscriptions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id                 INT UNSIGNED  NOT NULL,
  plan                    ENUM('demo','silver','gold','platinum') NOT NULL,
  extra_video             TINYINT(1)    NOT NULL DEFAULT 0,
  extra_zip               TINYINT(1)    NOT NULL DEFAULT 0,
  extra_slideshow         TINYINT(1)    NOT NULL DEFAULT 0,
  extra_validity_days     INT UNSIGNED  NOT NULL DEFAULT 0,
  extra_photo_limit       INT UNSIGNED  NOT NULL DEFAULT 0,
  status                  ENUM('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
  stripe_session_id       VARCHAR(255)  DEFAULT NULL,
  stripe_payment_intent   VARCHAR(255)  DEFAULT NULL,
  price_ron               DECIMAL(8,2)  NOT NULL,
  started_at              DATETIME      DEFAULT NULL,
  expires_at              DATETIME      DEFAULT NULL,
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status   (user_id, status),
  INDEX idx_stripe_session (stripe_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED  NOT NULL,
  subscription_id   INT UNSIGNED  NOT NULL,
  name              VARCHAR(255)  NOT NULL,
  slug              VARCHAR(255)  NOT NULL,
  description       TEXT          DEFAULT NULL,
  event_date        DATE          DEFAULT NULL,
  cover_image       VARCHAR(255)  DEFAULT NULL,
  status            ENUM('active','expired','archived') NOT NULL DEFAULT 'active',
  expires_at        DATETIME      DEFAULT NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY  uq_slug      (slug),
  FOREIGN KEY (user_id)          REFERENCES users(id)          ON DELETE CASCADE,
  FOREIGN KEY (subscription_id)  REFERENCES subscriptions(id)  ON DELETE RESTRICT,
  INDEX idx_user_id   (user_id),
  INDEX idx_status    (status),
  INDEX idx_expires   (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── images ───────────────────────────────────────────────────
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
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_created (event_id, created_at),
  INDEX idx_event_id      (event_id),
  INDEX idx_is_hidden     (is_hidden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── invoices ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                  INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  subscription_id     INT UNSIGNED  NOT NULL,
  user_id             INT UNSIGNED  NOT NULL,
  invoice_number      VARCHAR(50)   NOT NULL,
  fiscal_type         ENUM('PF','PJ') NOT NULL,
  seller_name         VARCHAR(150)  NOT NULL DEFAULT 'TIBIX SRL',
  seller_cui          VARCHAR(20)   NOT NULL DEFAULT 'RO41914589',
  seller_address      VARCHAR(255)  NOT NULL DEFAULT 'București, România',
  seller_phone        VARCHAR(20)   NOT NULL DEFAULT '+40 XXX XXX XXX',
  seller_email        VARCHAR(100)  NOT NULL DEFAULT 'billing@tibix.ro',
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
  UNIQUE  KEY uq_number      (invoice_number),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  INDEX idx_user_date    (user_id, issued_at),
  INDEX idx_status       (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
