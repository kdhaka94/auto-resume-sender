import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export async function logSentEmail(email: string, postContent: string, status: string = 'AWAITING_CONFIRMATION') {
  return await prisma.sentEmail.create({
    data: {
      email,
      postContent,
      status,
      viewed_at: []
    }
  });
}

export async function getSentEmails() {
  return await prisma.sentEmail.findMany({
    orderBy: {
      sent_at: 'desc'
    }
  });
}

export async function addViewedTimestamp(emailId: number) {
  const email = await prisma.sentEmail.findUnique({
    where: { id: emailId }
  });

  if (!email) return;

  await prisma.sentEmail.update({
    where: { id: emailId },
    data: {
      viewed_at: {
        push: new Date()
      }
    }
  });
}