CREATE TABLE `data_points` (
	`id` text PRIMARY KEY NOT NULL,
	`series_id` text NOT NULL,
	`date` text NOT NULL,
	`value` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `data_series`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `data_series` (
	`id` text PRIMARY KEY NOT NULL,
	`data_source_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit` text,
	`frequency` text,
	`last_updated` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`config` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_fetched_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interpretations` (
	`id` text PRIMARY KEY NOT NULL,
	`regression_id` text NOT NULL,
	`content` text NOT NULL,
	`style` text NOT NULL,
	`model` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`regression_id`) REFERENCES `regressions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `regressions` (
	`id` text PRIMARY KEY NOT NULL,
	`target` text NOT NULL,
	`features` text NOT NULL,
	`config` text NOT NULL,
	`coefficients` text,
	`model_fit` text,
	`residuals` text,
	`diagnostics` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_points_series_date_idx` ON `data_points` (`series_id`,`date`);--> statement-breakpoint
CREATE INDEX `data_points_series_idx` ON `data_points` (`series_id`);--> statement-breakpoint
CREATE INDEX `data_series_source_idx` ON `data_series` (`data_source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `data_series_code_idx` ON `data_series` (`code`);--> statement-breakpoint
CREATE INDEX `data_sources_type_idx` ON `data_sources` (`type`);--> statement-breakpoint
CREATE INDEX `data_sources_active_idx` ON `data_sources` (`is_active`);--> statement-breakpoint
CREATE INDEX `interpretations_regression_idx` ON `interpretations` (`regression_id`);--> statement-breakpoint
CREATE INDEX `regressions_created_at_idx` ON `regressions` (`created_at`);--> statement-breakpoint
CREATE INDEX `regressions_status_idx` ON `regressions` (`status`);