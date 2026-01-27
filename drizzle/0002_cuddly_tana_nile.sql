ALTER TABLE `role_permissions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permission_unique` UNIQUE(`role_id`,`permission_id`);