CREATE DATABASE IF NOT EXISTS vehicle_rental_db;
USE vehicle_rental_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Review;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Rental;
DROP TABLE IF EXISTS Booking;
DROP TABLE IF EXISTS Vehicle;
DROP TABLE IF EXISTS VehicleType;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS Branch;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS vehicle_types;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Branch (
    branch_id       INT PRIMARY KEY AUTO_INCREMENT,
    branch_name     VARCHAR(100) NOT NULL,
    address         VARCHAR(255) NOT NULL,
    city            VARCHAR(50) NOT NULL,
    contact_number  VARCHAR(20) NOT NULL,
    email           VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE Staff (
    staff_id        INT PRIMARY KEY AUTO_INCREMENT,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    phone           VARCHAR(20) NOT NULL,
    position        VARCHAR(50),
    password_hash   VARCHAR(255) NOT NULL,
    branch_id       INT,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE Customer (
    customer_id     INT PRIMARY KEY AUTO_INCREMENT,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    phone           VARCHAR(20) NOT NULL,
    address         VARCHAR(255),
    city            VARCHAR(50),
    status          ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    license_number  VARCHAR(50) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified     TINYINT(1) DEFAULT 0
) ENGINE = InnoDB;

CREATE TABLE VehicleType (
    type_id          INT PRIMARY KEY AUTO_INCREMENT,
    type_name        VARCHAR(50) NOT NULL,
    description      TEXT,
    daily_rate       DECIMAL(10,2) NOT NULL,
    weekly_rate      DECIMAL(10,2),
    seating_capacity INT NOT NULL,
    has_aircon       TINYINT(1) DEFAULT 1
) ENGINE = InnoDB;

CREATE TABLE Vehicle (
    vehicle_id      INT PRIMARY KEY AUTO_INCREMENT,
    plate_number    VARCHAR(20) NOT NULL UNIQUE,
    brand           VARCHAR(50) NOT NULL,
    model           VARCHAR(50) NOT NULL,
    year            YEAR NOT NULL,
    color           VARCHAR(30),
    mileage         INT DEFAULT 0,
    status          ENUM('Available', 'Rented', 'Maintenance', 'Unavailable') DEFAULT 'Available',
    type_id         INT NOT NULL,
    branch_id       INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id)   REFERENCES VehicleType(type_id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)    ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE Booking (
    booking_id      INT PRIMARY KEY AUTO_INCREMENT,
    customer_id     INT NOT NULL,
    vehicle_id      INT NOT NULL,
    staff_id        INT,
    pickup_date     DATETIME NOT NULL,
    return_date     DATETIME NOT NULL,
    pickup_location VARCHAR(255),
    return_location VARCHAR(255),
    total_amount    DECIMAL(10,2) NOT NULL,
    status          ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed') DEFAULT 'Pending',
    booking_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes           TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id)  REFERENCES Vehicle(vehicle_id)   ON DELETE RESTRICT,
    FOREIGN KEY (staff_id)    REFERENCES Staff(staff_id)       ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE Rental (
    rental_id           INT PRIMARY KEY AUTO_INCREMENT,
    booking_id          INT NOT NULL,
    branch_id           INT,
    actual_pickup       DATETIME,
    actual_return       DATETIME,
    pickup_mileage      INT,
    return_mileage      INT,
    condition_on_return TEXT,
    extra_charges       DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id)  REFERENCES Branch(branch_id)   ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE TABLE Payment (
    payment_id            INT PRIMARY KEY AUTO_INCREMENT,
    booking_id            INT NOT NULL,
    customer_id           INT NOT NULL,
    amount                DECIMAL(10,2) NOT NULL,
    payment_method        ENUM('Cash', 'Credit Card', 'Debit Card', 'GCash', 'Bank Transfer') NOT NULL,
    transaction_reference VARCHAR(100),
    status                ENUM('Pending', 'Paid', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id)  REFERENCES Booking(booking_id)   ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE Review (
    review_id    INT PRIMARY KEY AUTO_INCREMENT,
    customer_id  INT NOT NULL,
    vehicle_id   INT NOT NULL,
    rating       INT NOT NULL,
    comments     TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id)  REFERENCES Vehicle(vehicle_id)   ON DELETE CASCADE
) ENGINE = InnoDB;

INSERT INTO Branch (branch_name, address, city, contact_number, email) VALUES
('Main Branch', '123 Rizal St.', 'Naga City', '09171234567', 'main@rental.com');

INSERT INTO VehicleType (type_name, description, daily_rate, weekly_rate, seating_capacity, has_aircon) VALUES
('Sedan', 'Comfortable 4-5 seater', 1800.00, 11000.00, 5, 1),
('SUV', 'Spacious family vehicle', 2800.00, 17000.00, 7, 1),
('Van', 'Group transport', 3500.00, 21000.00, 12, 1);