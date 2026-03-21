import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { createElement } from "react";
import { ExpiryAlertEmail } from "../../../../../emails/ExpiryAlertEmail";

const DAYS_BEFORE = [90, 30, 7];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  let failed = 0;

  for (const days of DAYS_BEFORE) {
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const certs = await prisma.certificate.findMany({
      where: {
        deletedAt: null,
        expiryDate: { gte: start, lte: end },
        user: { notificationsEnabled: true, deletedAt: null },
      },
      include: { user: { select: { email: true, name: true } } },
    });

    for (const cert of certs) {
      try {
        await prisma.notificationLog.upsert({
          where: { certificateId_daysBefore: { certificateId: cert.id, daysBefore: days } },
          create: {
            userId: cert.userId,
            certificateId: cert.id,
            daysBefore: days,
            status: "PENDING",
          },
          update: {},
        });

        const log = await prisma.notificationLog.findUnique({
          where: { certificateId_daysBefore: { certificateId: cert.id, daysBefore: days } },
        });

        if (log?.status === "SENT") continue;

        await sendEmail({
          to: cert.user.email,
          subject: `Your certificate "${cert.name}" expires in ${days} days`,
          template: createElement(ExpiryAlertEmail, {
            name: cert.user.name ?? "there",
            certName: cert.name,
            issuer: cert.issuer,
            daysBefore: days,
            expiryDate: cert.expiryDate!.toISOString(),
            certUrl: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${cert.id}`,
          }),
        });

        await prisma.notificationLog.update({
          where: { certificateId_daysBefore: { certificateId: cert.id, daysBefore: days } },
          data: { status: "SENT", sentAt: new Date() },
        });

        sent++;
      } catch (err) {
        await prisma.notificationLog.update({
          where: { certificateId_daysBefore: { certificateId: cert.id, daysBefore: days } },
          data: {
            status: "FAILED",
            errorMessage: err instanceof Error ? err.message : "Unknown error",
          },
        }).catch(() => {});
        failed++;
      }
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}
