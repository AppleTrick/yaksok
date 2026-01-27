-- -- =========================
-- -- ingredient (성분)
-- -- =========================
-- INSERT IGNORE INTO ingredient
-- (ingredient_name, min_intake_value, max_intake_value, base_unit, display_unit)
-- VALUES
--     ('Vitamin C', 75, 2000, 'mg', 'mg'),
--     ('Vitamin D', 10, 100, 'ug', 'μg'),
--     ('Magnesium', 200, 400, 'mg', 'mg'),
--     ('Omega-3', 500, 3000, 'mg', 'mg'),
--     ('Zinc', 8, 40, 'mg', 'mg');

-- -- =========================
-- -- product (영양제 제품)
-- -- =========================
-- INSERT IGNORE INTO product
-- (PRDLST_NM, PRIMARY_FNCLTY, NTK_MTHD, IFTKN_ATNT_MATR_CN)
-- VALUES
--     ('비타민C 1000', '항산화, 면역력 증진', '1일 1회 1정', '위장 장애가 있을 수 있음'),
--     ('종합비타민', '기초 영양 보충', '1일 1회 식후 섭취', '임산부는 전문가 상담 필요'),
--     ('오메가3 플러스', '혈행 개선', '1일 2회 1캡슐', '항응고제 복용 시 주의');

-- -- =========================
-- -- product_ingredient (제품-성분 매핑)
-- -- =========================
-- INSERT IGNORE INTO product_ingredient
-- (product_id, ingredient_id, ingredient_amount, amount_unit)
-- VALUES
--     (1, 1, 1000, 'mg'),
--     (2, 1, 100, 'mg'),
--     (2, 2, 10, 'ug'),
--     (2, 3, 100, 'mg'),
--     (3, 4, 1000, 'mg');

-- =========================
-- user (사용자)
-- =========================
INSERT IGNORE INTO `user`
(email, password, name, role, oauth_provider, status, age_group, gender)
VALUES
    ('parent@test.com', '1234', '부모님', 'PARENT', 'LOCAL', 'ACTIVE', '50S', 'F'),
    ('child@test.com', '1234', '자녀', 'CHILD', 'LOCAL', 'ACTIVE', '20S', 'M');

-- =========================
-- user_product (사용자 보유 영양제)
-- =========================
INSERT IGNORE INTO user_product
(user_id, target_member_id, product_id, nickname,
 daily_dose, dose_amount, dose_unit,
 start_date, end_date, active)
VALUES
    (1, 1, 1, '아침 비타민C', 1, 1, '정', '2026-01-01', '2026-03-31', true),
    (1, 2, 2, '종합비타민', 1, 1, '정', '2026-01-01', NULL, true),
    (2, 2, 3, '오메가3', 2, 1, '캡슐', '2026-01-10', NULL, true);

-- =========================
-- intake_record (복용 기록)
-- =========================
INSERT IGNORE INTO intake_record
(user_product_id, intake_date, intake_time, intake_status)
VALUES
    (1, '2026-01-19', '08:30:00', 'TAKEN'),
    (2, '2026-01-19', '09:00:00', 'MISSED'),
    (3, '2026-01-19', '20:00:00', 'TAKEN');

-- =========================
-- alert
-- =========================
INSERT IGNORE INTO alert
(user_product_id, intake_time, before_after,
 grace_minutes, quiet_start, quiet_end, enabled)
VALUES
    (1, '08:00:00', 'BEFORE', 10, '22:00:00', '07:00:00', true),
    (2, '09:00:00', 'AFTER', 15, '23:00:00', '07:00:00', true),
    (3, '20:00:00', 'BEFORE', 5, NULL, NULL, true);

-- =========================
-- alert_log (알림 로그)
-- =========================
INSERT IGNORE INTO alert_log
(user_id, user_product_id, alert_type, sent_at)
VALUES
    (1, 1, 'INTAKE_REMINDER', '2026-01-19 07:50:00'),
    (1, 2, 'INTAKE_MISSED', '2026-01-19 09:20:00'),
    (2, 3, 'INTAKE_REMINDER', '2026-01-19 19:50:00');
