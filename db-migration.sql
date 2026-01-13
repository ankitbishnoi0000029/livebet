-- Database migration script for game synchronization
-- Run this script to create the necessary tables for the synchronized game system

-- Create game_rounds table
CREATE TABLE IF NOT EXISTS `game_rounds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `round_number` int(11) NOT NULL,
  `round_start_time` datetime NOT NULL,
  `round_end_time` datetime NOT NULL,
  `a1_result` int(11) DEFAULT NULL,
  `a2_result` int(11) DEFAULT NULL,
  `b1_result` int(11) DEFAULT NULL,
  `b2_result` int(11) DEFAULT NULL,
  `c1_result` int(11) DEFAULT NULL,
  `c2_result` int(11) DEFAULT NULL,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_round_number` (`round_number`),
  INDEX `idx_round_start_time` (`round_start_time`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create game_history table (if not exists)
CREATE TABLE IF NOT EXISTS `game_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `round_start_time` datetime NOT NULL,
  `a1` int(11) DEFAULT NULL,
  `a2` int(11) DEFAULT NULL,
  `b1` int(11) DEFAULT NULL,
  `b2` int(11) DEFAULT NULL,
  `c1` int(11) DEFAULT NULL,
  `c2` int(11) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_round_start_time` (`round_start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user table for current selections (if not exists)
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `a1` int(11) DEFAULT NULL,
  `a2` int(11) DEFAULT NULL,
  `b1` int(11) DEFAULT NULL,
  `b2` int(11) DEFAULT NULL,
  `c1` int(11) DEFAULT NULL,
  `c2` int(11) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create game_results table for image-based results
CREATE TABLE IF NOT EXISTS `game_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `round_id` int(11) NOT NULL,
  `wheel_key` varchar(10) NOT NULL,
  `result_type` enum('numeric','image','mixed') DEFAULT 'numeric',
  `numeric_result` int(11) DEFAULT NULL,
  `image_result` varchar(255) DEFAULT NULL,
  `image_url` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`round_id`) REFERENCES `game_rounds`(`id`) ON DELETE CASCADE,
  INDEX `idx_round_wheel` (`round_id`, `wheel_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_selections table for image-based selections
CREATE TABLE IF NOT EXISTS `user_selections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `round_id` int(11) DEFAULT NULL,
  `wheel_key` varchar(10) NOT NULL,
  `selection_type` enum('numeric','image','mixed') DEFAULT 'numeric',
  `numeric_selection` int(11) DEFAULT NULL,
  `image_selection` varchar(255) DEFAULT NULL,
  `image_url` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`round_id`) REFERENCES `game_rounds`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_round` (`user_id`, `round_id`),
  INDEX `idx_wheel_key` (`wheel_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
-- INSERT INTO game_rounds (round_number, round_start_time, round_end_time, status) VALUES
-- (1, '2024-01-11 09:15:00', '2024-01-11 09:30:00', 'completed'),
-- (2, '2024-01-11 09:30:00', '2024-01-11 09:45:00', 'completed');
