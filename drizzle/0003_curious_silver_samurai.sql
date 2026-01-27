ALTER TABLE `users` ADD `status` varchar(20) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` timestamp;