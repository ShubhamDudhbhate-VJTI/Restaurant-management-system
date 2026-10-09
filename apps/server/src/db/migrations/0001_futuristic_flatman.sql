CREATE TABLE `tables` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`qr_token` text NOT NULL,
	`seats` integer NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tables_qr_token_unique` ON `tables` (`qr_token`);