-- =====================================================================
-- land 행 1개를 까서 현재 프론트의 Settings 타입과 모양이 맞는지 확인
-- ---------------------------------------------------------------------
-- 사용법:
--   1) 아래 @target 값을 실제 운영중 도메인으로 바꿈
--   2) mysql 클라이언트에서 실행. 한 줄씩 보고 싶으면 ; 대신 \G 사용
--      (예: SOURCE inspect_land_row.sql;  또는 각 쿼리 끝을 \G 로 바꿔 실행)
-- =====================================================================

SET @target := 'CHANGE_ME_도메인';   -- ← 여기 바꾸기

-- ---------------------------------------------------------------------
-- A. 단일 컬럼 값들 — Settings의 1:1 매핑 필드 점검
--    체크할 것:
--      - ld_db_input_subject: 잘려서 들어간 한글이 있는지
--      - ld_invite_bool / ld_reserve_msg_bool / ld_personal_info_view:
--        'on'/'off' 외 값이 들어있는지 (대문자/빈문자/null)
--      - 이미지 URL 컬럼들이 100/255자 안에서 잘렸는지
-- ---------------------------------------------------------------------
SELECT
  ld_id, ld_domain, ld_font, ld_Interaction, ld_site,
  ld_description,
  ld_db_input_subject, CHAR_LENGTH(ld_db_input_subject) AS dbtitle_len,
  ld_invite_bool, ld_reserve_msg_bool, ld_personal_info_view,
  ld_btn_message, ld_complete_msg,
  ld_logo, ld_ph_img, ld_card_image, ld_invite_image, ld_popup_img,
  ld_mobile_bt_event_img, ld_mobile_bt_phone_img,
  ld_kakao, ld_sms_num, ld_sms_content,
  LEFT(ld_footer, 200) AS ld_footer_head,
  ld_ft_name, ld_ft_phone, ld_ft_address,
  ld_location,
  LEFT(ld_consent_info, 200) AS ld_consent_info_head,
  LEFT(ld_invite_message, 200) AS ld_invite_message_head,
  LEFT(ld_add_scripts, 200)    AS ld_add_scripts_head
FROM land WHERE ld_domain = @target;

-- ---------------------------------------------------------------------
-- B. JSON-ish 컬럼들의 유효성 + 최상위 모양
--    체크할 것:
--      - *_valid = 1 인지 (0이면 JSON 파싱 자체가 안 됨)
--      - main_type / menus_type 이 ARRAY 인지 (OBJECT면 모양 다름)
-- ---------------------------------------------------------------------
SELECT
  JSON_VALID(ld_json_header) AS header_valid,
  JSON_TYPE (ld_json_header) AS header_type,
  JSON_KEYS (ld_json_header) AS header_keys,
  JSON_VALID(ld_json_menus)  AS menus_valid,
  JSON_TYPE (ld_json_menus)  AS menus_type,
  JSON_LENGTH(ld_json_menus) AS menus_count,
  JSON_VALID(ld_json_main)   AS main_valid,
  JSON_TYPE (ld_json_main)   AS main_type,
  JSON_LENGTH(ld_json_main)  AS sections_count
FROM land WHERE ld_domain = @target;

-- ---------------------------------------------------------------------
-- C. ld_json_header 전체 — Settings.header와 키 비교
--
--    Settings.header 기대 키:
--      logoImage, logoSize, logoAlign,
--      phoneImage, phoneSize, phoneAlign,
--      color, padding, menuEnabled, menus, menuFont
-- ---------------------------------------------------------------------
SELECT JSON_PRETTY(ld_json_header) AS header_json
FROM land WHERE ld_domain = @target;

-- ---------------------------------------------------------------------
-- D. ld_json_main 첫 번째 섹션 — Settings.sections[0] (Section) 와 키 비교
--
--    Section 기대 키:
--      id, type, title, image, content,
--      effect?, animation?, textPosition?, formVariant?, formData?
--    type 허용값: hero | image | text | html | youtube | form
-- ---------------------------------------------------------------------
SELECT
  JSON_KEYS  (JSON_EXTRACT(ld_json_main, '$[0]')) AS first_section_keys,
  JSON_EXTRACT(ld_json_main, '$[0].type')         AS first_section_type,
  JSON_PRETTY(JSON_EXTRACT(ld_json_main, '$[0]')) AS first_section
FROM land WHERE ld_domain = @target;

-- 모든 섹션의 type 분포 (지원 안 되는 type이 섞여있는지 보기)
SELECT
  ROW_NUMBER() OVER () AS idx,
  JSON_UNQUOTE(JSON_EXTRACT(j.section, '$.type')) AS section_type,
  JSON_KEYS(j.section)                            AS keys
FROM land,
     JSON_TABLE(ld_json_main, '$[*]' COLUMNS (section JSON PATH '$')) j
WHERE ld_domain = @target;

-- ---------------------------------------------------------------------
-- E. ld_json_menus 첫 메뉴 — MenuItem 키 비교
--
--    MenuItem 기대 키: id, name, link, linkType?
--    linkType: 'subpage' | 'url'  (없으면 라우팅 동작 다름)
-- ---------------------------------------------------------------------
SELECT
  JSON_KEYS  (JSON_EXTRACT(ld_json_menus, '$[0]')) AS first_menu_keys,
  JSON_PRETTY(ld_json_menus)                       AS menus_json
FROM land WHERE ld_domain = @target;

-- ---------------------------------------------------------------------
-- F. 서브페이지 5개 슬롯 상태
--
--    SubPage 기대 키: id, slug, title, sections
-- ---------------------------------------------------------------------
SELECT
  (ld_pg0 IS NOT NULL AND ld_pg0 <> '') AS pg0_used, JSON_VALID(ld_pg0) AS pg0_valid, JSON_KEYS(ld_pg0) AS pg0_keys,
  (ld_pg1 IS NOT NULL AND ld_pg1 <> '') AS pg1_used, JSON_VALID(ld_pg1) AS pg1_valid, JSON_KEYS(ld_pg1) AS pg1_keys,
  (ld_pg2 IS NOT NULL AND ld_pg2 <> '') AS pg2_used, JSON_VALID(ld_pg2) AS pg2_valid, JSON_KEYS(ld_pg2) AS pg2_keys,
  (ld_pg3 IS NOT NULL AND ld_pg3 <> '') AS pg3_used, JSON_VALID(ld_pg3) AS pg3_valid, JSON_KEYS(ld_pg3) AS pg3_keys,
  (ld_pg4 IS NOT NULL AND ld_pg4 <> '') AS pg4_used, JSON_VALID(ld_pg4) AS pg4_valid, JSON_KEYS(ld_pg4) AS pg4_keys
FROM land WHERE ld_domain = @target;

-- 첫 사용중인 서브페이지 전체 보기 (필요시 ld_pg0을 ld_pg1~4로 바꿔서 실행)
SELECT JSON_PRETTY(ld_pg0) AS pg0_json
FROM land WHERE ld_domain = @target;

-- ---------------------------------------------------------------------
-- G. DROP 후보 컬럼들에 실제 데이터가 들어있는지 (있으면 함부로 DROP 금지)
-- ---------------------------------------------------------------------
SELECT
  ld_bgcolor, ld_txtcolor,
  LEFT(ld_banner_img, 80) AS banner_img,
  LEFT(ld_main_img,   80) AS main_img,
  LEFT(ld_event_img,  80) AS event_img,
  ld_view_type, ld_db_location,
  ld_phone_num,
  ld_name, ld_menu
FROM land WHERE ld_domain = @target;

-- 전체 행에서 DROP 후보 컬럼이 비어있지 않은 비율 — 운영중 데이터가 의존하는지
SELECT
  COUNT(*) AS total_rows,
  SUM(ld_bgcolor      IS NOT NULL AND ld_bgcolor      <> '') AS has_bgcolor,
  SUM(ld_txtcolor     IS NOT NULL AND ld_txtcolor     <> '') AS has_txtcolor,
  SUM(ld_banner_img   IS NOT NULL AND ld_banner_img   <> '') AS has_banner,
  SUM(ld_main_img     IS NOT NULL AND ld_main_img     <> '') AS has_main_img,
  SUM(ld_event_img    IS NOT NULL AND ld_event_img    <> '') AS has_event_img,
  SUM(ld_view_type    IS NOT NULL AND ld_view_type    <> '') AS has_view_type,
  SUM(ld_db_location  IS NOT NULL AND ld_db_location  <> '') AS has_db_location,
  SUM(ld_phone_num    IS NOT NULL AND ld_phone_num    <> '') AS has_phone_num,
  SUM(ld_sms_content  IS NOT NULL AND ld_sms_content  <> '') AS has_sms_content
FROM land;

-- =====================================================================
-- 참고: Settings 최상위 키 (src/app/setting/types.ts)
--   domain, headerStyle, font, siteDescription, additionalScript,
--   header, sections, subPages, subMenus, popupImage, info,
--   bottomFixed, countdown, quickConnect, location, footer,
--   privacyPolicy, completeMessage, enabled
-- =====================================================================
