-- Add browser face recognition descriptor storage for employees.
-- Run this once in GoDaddy phpMyAdmin if employees.face_descriptor is missing.
ALTER TABLE `employees`
  ADD COLUMN `face_descriptor` TEXT NULL AFTER `profile_photo_public_id`;