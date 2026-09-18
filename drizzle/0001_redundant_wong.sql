CREATE TABLE `phone_auth_sessions` (
	`token` varchar(128) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phone_auth_sessions_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `phone_otp_codes` (
	`phone` varchar(20) NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phone_otp_codes_phone` PRIMARY KEY(`phone`)
);
--> statement-breakpoint
CREATE TABLE `phone_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(160) NOT NULL,
	`role` enum('client','provider') NOT NULL DEFAULT 'client',
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`city` varchar(120),
	`phoneVerified` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phone_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `phone_users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE INDEX `phone_session_phone_idx` ON `phone_auth_sessions` (`phone`);--> statement-breakpoint
CREATE INDEX `phone_session_expires_idx` ON `phone_auth_sessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `phone_otp_expires_idx` ON `phone_otp_codes` (`expiresAt`);