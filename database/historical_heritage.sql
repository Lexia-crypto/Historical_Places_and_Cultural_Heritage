CREATE DATABASE IF NOT EXISTS historical_heritage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE historical_heritage;
CREATE TABLE IF NOT EXISTS categories (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL UNIQUE
);
INSERT IGNORE INTO categories(name) VALUES
('Historical Place'),('Built Heritage'),('Cultural Tradition'),
('Festival or Celebration'),('Traditional Craft'),('Oral History');
CREATE TABLE IF NOT EXISTS heritage_records (
 id INT AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(200) NOT NULL,
 category_id INT NOT NULL DEFAULT 1,
 municipality VARCHAR(120) DEFAULT '',
 barangay VARCHAR(120) DEFAULT '',
 description TEXT,
 historical_significance TEXT,
 cultural_practices TEXT,
 year_period VARCHAR(120) DEFAULT '',
 source_name VARCHAR(255) DEFAULT '',
 source_url VARCHAR(500) DEFAULT '',
 verification_status ENUM('pending','verified') DEFAULT 'pending',
 image_path VARCHAR(500) DEFAULT '',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES categories(id)
);
-- Add only records researched and verified by your group.
