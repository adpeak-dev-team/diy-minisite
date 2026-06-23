-- =====================================================================
-- minisite frontend Settings 타입에 맞춰 land 테이블 확장
-- =====================================================================
-- 제약:
--   - DROP 금지 (레거시 SvelteKit 라이브 사이트가 옛 컬럼을 계속 읽음)
--   - ADD / MODIFY 만 허용
--   - 데이터 잘림 방지를 위해 길이 확장만 함
--   - 운영 DB는 백업 후 실행
-- =====================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1) ADD: Settings의 nested 객체를 담을 JSON(TEXT) 컬럼
--    옛 컬럼은 그대로 두고, 새 기능 데이터만 여기로 들어감
-- ---------------------------------------------------------------------
ALTER TABLE `land`
  ADD COLUMN `ld_json_bottom`    TEXT NULL COMMENT 'Settings.bottomFixed 전체(height/font/phone/consult)',
  ADD COLUMN `ld_json_countdown` TEXT NULL COMMENT 'Settings.countdown 전체',
  ADD COLUMN `ld_json_enabled`   TEXT NULL COMMENT 'Settings.enabled 플래그(privacy 제외, ld_personal_info_view 사용)',
  ADD COLUMN `ld_json_footer`    TEXT NULL COMMENT 'Settings.footer 확장(ceo/bizNumber/font)',
  ADD COLUMN `ld_json_location`  TEXT NULL COMMENT 'Settings.location(address+embedUrl)',
  ADD COLUMN `ld_json_header_menus` TEXT NULL COMMENT 'Settings.header.menus 전체 (옛 ld_json_menus 는 subMenus로 사용 중이라 별도 슬롯)';

-- ---------------------------------------------------------------------
-- 2) MODIFY: 짧은 컬럼 길이 확장 (잘림 방지, 안전)
-- ---------------------------------------------------------------------
ALTER TABLE `land`
  MODIFY COLUMN `ld_db_input_subject`    VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MODIFY COLUMN `ld_logo`                VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MODIFY COLUMN `ld_ph_img`              VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MODIFY COLUMN `ld_invite_image`        VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MODIFY COLUMN `ld_popup_img`           VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MODIFY COLUMN `ld_mobile_bt_event_img` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  MODIFY COLUMN `ld_mobile_bt_phone_img` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

COMMIT;

-- =====================================================================
-- 롤백 참고 (필요 시)
-- =====================================================================
-- ALTER TABLE `land`
--   DROP COLUMN `ld_json_bottom`,
--   DROP COLUMN `ld_json_countdown`,
--   DROP COLUMN `ld_json_enabled`,
--   DROP COLUMN `ld_json_footer`,
--   DROP COLUMN `ld_json_location`,
--   DROP COLUMN `ld_json_header_menus`;
-- (MODIFY 롤백은 백업 복원 권장)
