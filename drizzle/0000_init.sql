CREATE TABLE `puzzle_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`puzzle_id` text NOT NULL,
	`puzzle_kind` text NOT NULL,
	`sentiment` text NOT NULL,
	`reason` text,
	`comment` text,
	`user_hash` text NOT NULL,
	`country` text,
	`app_version` text,
	`ts_score` real,
	`ts_action` text
);
--> statement-breakpoint
CREATE TABLE `puzzle_feedback_edges` (
	`feedback_id` integer NOT NULL,
	`edge_from` integer NOT NULL,
	`edge_to` integer NOT NULL,
	`word_from` text NOT NULL,
	`word_to` text NOT NULL,
	`clue_snapshot` text NOT NULL,
	PRIMARY KEY(`feedback_id`, `edge_from`, `edge_to`),
	FOREIGN KEY (`feedback_id`) REFERENCES `puzzle_feedback`(`id`) ON UPDATE no action ON DELETE cascade
);
