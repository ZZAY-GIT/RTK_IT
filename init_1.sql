-- Пользователи системы

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash BYTEA NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'operator', 'admin', 'viewer'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Роботы

CREATE TABLE robots (
    id VARCHAR(50) PRIMARY KEY, -- 'RB-001'
    status VARCHAR(50) DEFAULT 'active',
    battery_level INTEGER,
    last_update TIMESTAMP,
    current_zone VARCHAR(10),
    current_row INTEGER,
    current_shelf INTEGER
);


-- Товары

CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY, -- 'TEL-4567'
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    min_stock INTEGER DEFAULT 10,
    optimal_stock INTEGER DEFAULT 100
);
-- История инвентаризации

CREATE TABLE inventory_history (
    id SERIAL PRIMARY KEY,
    robot_id VARCHAR(50) REFERENCES robots(id),
    product_id VARCHAR(50) REFERENCES products(id),
    quantity INTEGER NOT NULL,
    zone VARCHAR(10) NOT NULL,
    row_number INTEGER,
    shelf_number INTEGER,
    status VARCHAR(50), -- 'OK', 'LOW_STOCK', 'CRITICAL'
    scanned_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Прогнозы ИИ
CREATE TABLE ai_predictions (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id),
    days_until_stockout INTEGER,
    recommended_order INTEGER,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Индексы для оптимизации
CREATE INDEX idx_inventory_scanned ON inventory_history(scanned_at DESC);
CREATE INDEX idx_inventory_product ON inventory_history(product_id);
CREATE INDEX idx_inventory_zone ON inventory_history(zone);