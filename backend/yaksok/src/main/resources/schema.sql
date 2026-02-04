-- ========================================
-- DROP TABLES (Reset)
-- ========================================
DROP TABLE IF EXISTS notification_log;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS notification_setting;
DROP TABLE IF EXISTS intake_record;
DROP TABLE IF EXISTS user_product;
DROP TABLE IF EXISTS product_ingredient;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS ingredient;
DROP TABLE IF EXISTS user_disease;
DROP TABLE IF EXISTS disease;
DROP TABLE IF EXISTS user_fcm_token;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS shedlock;

-- ========================================
-- ingredient
-- ========================================
CREATE TABLE IF NOT EXISTS ingredient (
                                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          ingredient_name VARCHAR(255) UNIQUE,
    min_intake_value DECIMAL,
    max_intake_value DECIMAL,
    display_unit VARCHAR(255)
    ) ENGINE=InnoDB;

-- ========================================
-- product
-- ========================================
CREATE TABLE IF NOT EXISTS product (
                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       PRDLST_NM VARCHAR(255),
    PRIMARY_FNCLTY TEXT,
    NTK_MTHD TEXT,
    IFTKN_ATNT_MATR_CN TEXT
    ) ENGINE=InnoDB;

-- ========================================
-- product_ingredient
-- ========================================
CREATE TABLE IF NOT EXISTS product_ingredient (
                                                  id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                  product_id BIGINT NOT NULL,
                                                  ingredient_id BIGINT NOT NULL,
                                                  ingredient_amount DECIMAL,
                                                  amount_unit VARCHAR(255),

    CONSTRAINT uk_product_ingredient UNIQUE (product_id, ingredient_id),
    CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES product(id),
    CONSTRAINT fk_pi_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredient(id)
    ) ENGINE=InnoDB;

-- ========================================
-- user (예약어 → 백틱 필수)
-- ========================================
CREATE TABLE IF NOT EXISTS `user` (
                                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                      email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(255),
    oauth_provider VARCHAR(255),
    oauth_id VARCHAR(255),
    status VARCHAR(255),
    last_login_at DATETIME,
    age_group VARCHAR(255),
    gender VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

-- ========================================
-- user_product
-- ========================================
CREATE TABLE IF NOT EXISTS user_product (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            user_id BIGINT NOT NULL,
                                            product_id BIGINT,
                                            nickname VARCHAR(255),
                                            daily_dose INT,
                                            dose_amount DECIMAL,
                                            dose_unit VARCHAR(255),
                                            active BOOLEAN,
                                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES `user`(id),
    CONSTRAINT fk_up_product FOREIGN KEY (product_id) REFERENCES product(id)
    ) ENGINE=InnoDB;

-- ========================================
-- intake_record
-- ========================================
CREATE TABLE IF NOT EXISTS intake_record (
                                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             user_product_id BIGINT NOT NULL,
                                             taken BOOLEAN NOT NULL,
                                             intake_date DATE NOT NULL,
                                             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                                             CONSTRAINT fk_ir_user_product FOREIGN KEY (user_product_id)
                                                 REFERENCES user_product(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================
-- notification_setting
-- ========================================
CREATE TABLE IF NOT EXISTS notification (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     user_id BIGINT NOT NULL,
                                     user_product_id BIGINT NOT NULL,
                                     intake_time TIME,
                                     enabled BOOLEAN,
                                     isTaken BOOLEAN,
                                     category VARCHAR(255),
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_n_user FOREIGN KEY (user_id) REFERENCES `user`(id),
    CONSTRAINT fk_ns_user_product FOREIGN KEY (user_product_id) REFERENCES user_product(id)
    ) ENGINE=InnoDB;

-- ========================================
-- notification_log
-- ========================================
CREATE TABLE IF NOT EXISTS notification_log (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         user_id BIGINT NOT NULL,
                                         user_product_id BIGINT,
                                         notification_type VARCHAR(255),
    sent_at DATETIME,

    CONSTRAINT fk_nl_user FOREIGN KEY (user_id) REFERENCES `user`(id),
    CONSTRAINT fk_nl_user_product FOREIGN KEY (user_product_id) REFERENCES user_product(id)
    ) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS notification_setting (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            user_id BIGINT NOT NULL,
                                            quiet_start DATETIME NOT NULL,
                                            quiet_end DATETIME NOT NULL,
                                            enabled BOOLEAN,

                                            CONSTRAINT fk_ns_user FOREIGN KEY (user_id) REFERENCES `user`(id)
) ENGINE=InnoDB;

-- ========================================
-- disease
-- ========================================
CREATE TABLE IF NOT EXISTS disease (
                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       sick_name VARCHAR(255) UNIQUE
    ) ENGINE=InnoDB;

-- ========================================
-- user_disease
-- ========================================
CREATE TABLE IF NOT EXISTS user_disease (
                                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                            user_id BIGINT NOT NULL,
                                            disease_id BIGINT NOT NULL,

                                            CONSTRAINT fk_ud_user FOREIGN KEY (user_id) REFERENCES `user`(id),
    CONSTRAINT fk_ud_disease FOREIGN KEY (disease_id) REFERENCES disease(id)
    ) ENGINE=InnoDB;

-- ========================================
-- user_fcm_token
-- ========================================
CREATE TABLE IF NOT EXISTS user_fcm_token (
                                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              user_id BIGINT NOT NULL,
                                              token VARCHAR(512) NOT NULL,
                                              platform VARCHAR(50),         -- WEB / ANDROID / IOS
                                              active BOOLEAN DEFAULT TRUE,   -- 실패 시 비활성화 용도
                                              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                                                  ON UPDATE CURRENT_TIMESTAMP,

                                              CONSTRAINT fk_uft_user
                                                  FOREIGN KEY (user_id) REFERENCES `user`(id),

                                              CONSTRAINT uk_user_fcm_token
                                                  UNIQUE (user_id, token)
) ENGINE=InnoDB;

CREATE TABLE shedlock (
                          name VARCHAR(64) NOT NULL,
                          lock_until TIMESTAMP(3) NOT NULL,
                          locked_at TIMESTAMP(3) NOT NULL,
                          locked_by VARCHAR(255) NOT NULL,
                          PRIMARY KEY (name)
) ENGINE=InnoDB;


-- ========================================
-- INDEXES (조건부 생성)
-- ========================================

-- user_product.user_id
SET @idx := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'user_product'
      AND index_name = 'idx_user_product_user'
);
SET @sql := IF(@idx = 0,
               'CREATE INDEX idx_user_product_user ON user_product(user_id)',
               'SELECT 1'
            );
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user_product.product_id
SET @idx := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'user_product'
      AND index_name = 'idx_user_product_product'
);
SET @sql := IF(@idx = 0,
               'CREATE INDEX idx_user_product_product ON user_product(product_id)',
               'SELECT 1'
            );
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- intake_record(user_product_id, intake_date)
SET @idx := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'intake_record'
      AND index_name = 'idx_intake_record_user_product_date'
);
SET @sql := IF(@idx = 0,
               'CREATE INDEX idx_intake_record_user_product_date ON intake_record(user_product_id, intake_date)',
               'SELECT 1'
            );
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- notification_log.user_id
SET @idx := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'notification_log'
      AND index_name = 'idx_notification_log_user'
);
SET @sql := IF(@idx = 0,
               'CREATE INDEX idx_notification_log_user ON notification_log(user_id)',
               'SELECT 1'
            );
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user_fcm_token.user_id
SET @idx := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE table_schema = DATABASE()
      AND table_name = 'user_fcm_token'
      AND index_name = 'idx_user_fcm_token_user'
);
SET @sql := IF(@idx = 0,
               'CREATE INDEX idx_user_fcm_token_user ON user_fcm_token(user_id)',
               'SELECT 1'
            );
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

