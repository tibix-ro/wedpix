-- ============================================================
-- WedPix — Wedding Photo Share System
-- Database Schema
-- ============================================================
-- NOTE: On cPanel shared hosting the database (srgsgxsh_wedpix)
-- must be created in cPanel → MySQL Databases BEFORE running this.
-- Do NOT run CREATE DATABASE here — you likely lack the privilege.
-- Import this file via phpMyAdmin after selecting your database.
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
