CREATE TABLE `reservations` (
  `id` text PRIMARY KEY NOT NULL,
  `customer_id` text NOT NULL,
  `table_id` text NOT NULL,
  `reservation_date` text NOT NULL,
  `start_time` text NOT NULL,
  `end_time` text NOT NULL,
  `guest_count` integer NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action
);
