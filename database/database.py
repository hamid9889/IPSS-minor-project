-- ============================================================
-- IPSS - Intelligent Product Scheduling System
-- Database Schema for MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS ipss_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ipss_db;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 1. Users Table
-- Stores operator and administrator accounts with hashed passwords
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR',
    designation VARCHAR(100) DEFAULT 'Staff',
    department VARCHAR(100) DEFAULT 'Production',
    employee_id VARCHAR(50) DEFAULT 'IPSS-001',
    phone VARCHAR(30) DEFAULT '',
    dob VARCHAR(30) DEFAULT '',
    gender VARCHAR(20) DEFAULT 'Male',
    address VARCHAR(255) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Products Table
-- Master catalog of manufactured goods
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    processing_time FLOAT NOT NULL,
    preferred_line VARCHAR(50) DEFAULT 'All Machines',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Machines Table
-- Factory production lines and machines
CREATE TABLE machines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_name VARCHAR(100) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Orders Table
-- Production batch requests
-- Foreign keys: product_id -> products.id, user_id -> users.id
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    deadline VARCHAR(50) NOT NULL,
    processing_time FLOAT DEFAULT 0.05,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    user_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Schedules Table
-- Optimized timeline allocations
-- Foreign keys: machine_id -> machines.id, order_id -> orders.id
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    machine_id INT NOT NULL,
    order_id INT NOT NULL,
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedules_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedules_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Activities Table
-- Shopfloor event logs
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    activity_type VARCHAR(20) DEFAULT 'info',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
