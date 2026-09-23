-- ============================================================
-- WedPix — per-subscription extra add-ons
-- Adds optional feature overrides that force a capability ON
-- regardless of the base plan (video / zip / slideshow).
-- Effective feature = plan_default OR extra_flag.
-- Run once on the production database.
-- ============================================================

ALTER TABLE subscriptions
  ADD COLUMN extra_video     TINYINT(1) NOT NULL DEFAULT 0 AFTER plan,
  ADD COLUMN extra_zip       TINYINT(1) NOT NULL DEFAULT 0 AFTER extra_video,
  ADD COLUMN extra_slideshow TINYINT(1) NOT NULL DEFAULT 0 AFTER extra_zip;
