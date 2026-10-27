import { env } from "../src/shared/config/env";
import { prisma } from "../src/shared/lib/prisma";
import { isoToUtcMidnight, todayISO } from "../src/shared/utils/date";
import { hashPassword } from "../src/shared/utils/password";

const EMPLOYER_EMAIL = "employer@example.com";
const EMPLOYER_PASSWORD = "Employer123!";
const EMPLOYEE_EMAIL = "employee@example.com";
const EMPLOYEE_PASSWORD = "Employee123!";

async function main(): Promise<void> {
  const [adminPasswordHash, employerPasswordHash, employeePasswordHash] = await Promise.all([
    hashPassword(env.SEED_ADMIN_PASSWORD),
    hashPassword(EMPLOYER_PASSWORD),
    hashPassword(EMPLOYEE_PASSWORD),
  ]);

  await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: {
      name: "Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "APPROVED",
      rejectionReason: null,
      reviewedAt: new Date(),
      isActive: true,
    },
    create: {
      name: "Admin",
      email: env.SEED_ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: EMPLOYER_EMAIL },
    update: {
      name: "Employer",
      passwordHash: employerPasswordHash,
      role: "EMPLOYER",
      company: "Example Company",
      status: "APPROVED",
      rejectionReason: null,
      reviewedAt: new Date(),
      isActive: true,
    },
    create: {
      name: "Employer",
      email: EMPLOYER_EMAIL,
      passwordHash: employerPasswordHash,
      role: "EMPLOYER",
      company: "Example Company",
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: EMPLOYEE_EMAIL },
    update: {
      name: "Employee",
      passwordHash: employeePasswordHash,
      role: "EMPLOYEE",
      department: "Engineering",
      status: "APPROVED",
      employerId: employer.id,
      isActive: true,
    },
    create: {
      name: "Employee",
      email: EMPLOYEE_EMAIL,
      passwordHash: employeePasswordHash,
      role: "EMPLOYEE",
      department: "Engineering",
      status: "APPROVED",
      employerId: employer.id,
    },
  });

  const today = isoToUtcMidnight(todayISO());

  for (let i = 1; i <= 5; i++) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const checkIn = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const workedMinutes = 480 + i * 15;
    const checkOut = new Date(checkIn.getTime() + workedMinutes * 60 * 1000);

    await prisma.attendance.upsert({
      where: { userId_date: { userId: employee.id, date } },
      update: { checkIn, checkOut },
      create: {
        userId: employee.id,
        date,
        checkIn,
        checkOut,
      },
    });
  }

  console.log(`Seeded admin user: ${env.SEED_ADMIN_EMAIL}`);
  console.log(`Seeded employer user: ${EMPLOYER_EMAIL}`);
  console.log(`Seeded employee user: ${EMPLOYEE_EMAIL} (employer: ${EMPLOYER_EMAIL})`);
  console.log(`Seeded attendance records for ${EMPLOYEE_EMAIL} over the last 5 days`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
