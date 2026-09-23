-- ============================================================
-- WedPix — stackable per-subscription add-ons
-- Adds quantity-based overrides purchasable by the customer at
-- checkout (in addition to the boolean extra_* toggles):
--   - extra_validity_days: added on top of the plan's validity_days
--   - extra_photo_limit:   added on top of the plan's photo_limit
-- Effective value = plan_default + extra_amount (see effectivePlan()).
-- Run once on the production database.
-- ============================================================

ALTER TABLE subscriptions
  ADD COLUMN extra_validity_days INT UNSIGNED NOT NULL DEFAULT 0 AFTER extra_slideshow,
  ADD COLUMN extra_photo_limit   INT UNSIGNED NOT NULL DEFAULT 0 AFTER extra_validity_days;
