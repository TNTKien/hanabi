CREATE TABLE `fish_collection` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`fish_type` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `gacha_banners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game` text NOT NULL,
	`character_id` integer NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gacha_collection` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`game` text NOT NULL,
	`character_id` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`username` text,
	`xu` integer DEFAULT 10000 NOT NULL,
	`last_lucky` integer,
	`last_box` integer,
	`last_fish` integer,
	`buff_active` integer DEFAULT false,
	`buff_multiplier` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
