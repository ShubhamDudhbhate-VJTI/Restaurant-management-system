CREATE TABLE `queue_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`table_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`offered_at` integer,
	`resolved_at` integer,
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `tables` ADD `offer_expires_at` integer;