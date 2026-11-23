CREATE TABLE "worker_lease" (
    "instance_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heartbeat_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stopped_at" TIMESTAMPTZ(6),
    CONSTRAINT "worker_lease_pkey" PRIMARY KEY ("instance_id")
);

CREATE INDEX "worker_lease_heartbeat_idx" ON "worker_lease"("heartbeat_at");

CREATE TABLE "job_dispatch" (
    "id" UUID NOT NULL,
    "queue_name" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload_hash" CHAR(64) NOT NULL,
    "job_id" UUID NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "result_code" TEXT,
    "failure_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    CONSTRAINT "job_dispatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_dispatch_job_id_key" ON "job_dispatch"("job_id");
CREATE UNIQUE INDEX "job_dispatch_queue_idempotency_key" ON "job_dispatch"("queue_name", "idempotency_key");
