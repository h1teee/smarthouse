CREATE TABLE houses (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100), street VARCHAR(100), building VARCHAR(20),
    latitude FLOAT, longitude FLOAT,
    water_status VARCHAR(50) DEFAULT 'OK',
    electricity_status VARCHAR(50) DEFAULT 'OK',
    heating_status VARCHAR(50) DEFAULT 'OK'
);

CREATE TABLE utility_accounts (
    id SERIAL PRIMARY KEY,
    user_id INT,
    account_number VARCHAR(50)
);

CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(50),
    period VARCHAR(20),
    total_amount DECIMAL,
    is_paid BOOLEAN DEFAULT false
);

CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50), title VARCHAR(255),
    start_date VARCHAR(50), end_date VARCHAR(50),
    description TEXT, status VARCHAR(50) DEFAULT 'pending_uk'
);

CREATE TABLE partners (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE offers (
    id VARCHAR(50) PRIMARY KEY,
    partner_id VARCHAR(50) REFERENCES partners(id),
    badge_text VARCHAR(100), offer_text TEXT,
    icon_url TEXT, icon_bg_color VARCHAR(20),
    action_type VARCHAR(50), action_data TEXT,
    requires_zero_debt BOOLEAN DEFAULT true, is_active BOOLEAN DEFAULT true
);

-- Тестовые данные для жюри
INSERT INTO houses (city, street, building, latitude, longitude, electricity_status) VALUES ('Ростов-на-Дону', 'Садовая', '10', 47.222, 39.711, 'OUTAGE');
INSERT INTO utility_accounts (user_id, account_number) VALUES (1, '12345678');
INSERT INTO bills (account_number, period, total_amount, is_paid) VALUES ('12345678', '09/2026', 4500.50, true);
INSERT INTO requests (type, title, start_date, end_date, description, status) VALUES ('water', 'Отключение воды', '12.08', '26.08', 'Ремонт', 'pending_uk');
INSERT INTO partners (id, name) VALUES ('p_sbp', 'СБП'), ('p_vkusvill', 'ВкусВилл');
INSERT INTO offers (id, partner_id, badge_text, offer_text, icon_url, icon_bg_color, action_type, action_data, requires_zero_debt) 
VALUES 
('offer_101', 'p_sbp', 'Федеральный', 'Кешбэк 1%', 'url', '#000000', 'link', 'link', true),
('offer_102', 'p_vkusvill', 'Для ЖК', 'Скидка 200 ₽', 'url', '#00A859', 'promocode', 'PROMO', true);