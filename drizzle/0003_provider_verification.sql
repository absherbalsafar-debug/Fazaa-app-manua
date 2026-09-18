CREATE TABLE `provider_verification_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `providerId` int NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejectionReason` text,
  `submittedAt` timestamp NOT NULL DEFAULT (now()),
  `reviewedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `provider_verification_requests_id` PRIMARY KEY(`id`),
  INDEX `provider_verification_provider_idx` (`providerId`),
  INDEX `provider_verification_status_idx` (`status`)
);
--> statement-breakpoint
CREATE TABLE `provider_verification_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `requestId` int NOT NULL,
  `type` enum('selfie','id_front','id_back','portfolio','certificate') NOT NULL,
  `objectPath` varchar(512) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `provider_verification_documents_id` PRIMARY KEY(`id`),
  INDEX `provider_verification_document_request_idx` (`requestId`)
);
