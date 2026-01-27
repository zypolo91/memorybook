CREATE TABLE `system_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` varchar(20) NOT NULL,
	`action` varchar(100) NOT NULL,
	`module` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`details` json,
	`user_id` int,
	`user_agent` varchar(500),
	`ip` varchar(45),
	`request_id` varchar(100),
	`duration` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `system_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `permissions` ADD `parent_id` int;--> statement-breakpoint
ALTER TABLE `permissions` ADD `sort_order` int DEFAULT 0;