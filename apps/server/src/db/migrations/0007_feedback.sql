CREATE TABLE `feedback` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text NOT NULL,
  `customer_id` text NOT NULL,
  `rating` integer NOT NULL,
  `comment` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
