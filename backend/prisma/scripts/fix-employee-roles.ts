import "dotenv/config";
import { prisma } from "../../src/shared/lib/prisma";

// One-off data repair for accounts created with the wrong role: an employer
// never has its own employerId, so `role = EMPLOYER && employerId != null`
// rows are mis-affected employees and are switched back to EMPLOYEE.
//
// Usage (run from backend/):
//   npx tsx prisma/scripts/fix-employee-roles.ts          dry run, prints rows
//   npx tsx prisma/scripts/fix-employee-roles.ts --apply  applies the changes

const APPLY = process.argv.includes("--apply");

type BrokenRow = {
  id: string;
  name: string;
  email: string;
  employerId: string | null;
};

async function main(): Promise<void> {
  const broken: BrokenRow[] = await prisma.user.findMany({
    where: { role: "EMPLOYER", employerId: { not: null } },
    select: { id: true, name: true, email: true, employerId: true },
    orderBy: { createdAt: "asc" },
  });

  if (broken.length === 0) {
    console.log("Nothing to repair: no user has role EMPLOYER together with a non-null employerId.");
    return;
  }

  console.log(`Found ${broken.length} user(s) with role EMPLOYER and a non-null employerId:`);

  for (const row of broken) {
    console.log(`  - id=${row.id} name="${row.name}" email=${row.email} employerId=${row.employerId}`);
  }

  if (!APPLY) {
    console.log("Dry run: no changes were made. Re-run with --apply to set these users' role to EMPLOYEE.");
    return;
  }

  const result = await prisma.user.updateMany({
    where: { role: "EMPLOYER", employerId: { not: null } },
    data: { role: "EMPLOYEE" },
  });

  console.log(`Repaired ${result.count} user(s): role changed from EMPLOYER to EMPLOYEE.`);
}

main()
  .catch((error) => {
    console.error("Repair failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
