-- CreateTable
CREATE TABLE "sent_emails" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "postContent" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jobType" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed_at" TIMESTAMP(3)[],

    CONSTRAINT "sent_emails_pkey" PRIMARY KEY ("id")
);
