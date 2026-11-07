import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../shared/app";
import { prisma } from "../../shared/lib/prisma";
import { signAccessToken } from "../../shared/utils/jwt";

// Route-level checks for the entrance QR endpoint: the exact URL the Entry QR
// dashboard uses must exist on the mounted attendance router, employers mint a
// short-lived token, employees and unapproved accounts are rejected.
// Test users are created in (and removed from) the real database; no seeded
// rows are touched.

const app = createApp();

const employerEmail = "qr-routes-employer@example.com";
const employeeEmail = "qr-routes-employee@example.com";
const pendingEmployerEmail = "qr-routes-pending@example.com";

const testUserIds: string[] = [];

beforeAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [employerEmail, employeeEmail, pendingEmployerEmail] } },
  });

  const employer = await prisma.user.create({
    data: {
      name: "QR Routes Employer",
      email: employerEmail,
      passwordHash: "test-hash",
      role: "EMPLOYER",
      status: "APPROVED",
    },
  });
  testUserIds.push(employer.id);

  const employee = await prisma.user.create({
    data: {
      name: "QR Routes Employee",
      email: employeeEmail,
      passwordHash: "test-hash",
      role: "EMPLOYEE",
      status: "APPROVED",
      employerId: employer.id,
    },
  });
  testUserIds.push(employee.id);

  const pending = await prisma.user.create({
    data: {
      name: "QR Routes Pending",
      email: pendingEmployerEmail,
      passwordHash: "test-hash",
      role: "EMPLOYER",
      status: "PENDING",
    },
  });
  testUserIds.push(pending.id);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
  await prisma.$disconnect();
});

async function accessTokenFor(email: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  return signAccessToken({ id: user.id, role: user.role });
}

describe("GET /api/attendance/entry-qr", () => {
  it("answers 401 without credentials", async () => {
    const response = await request(app).get("/api/attendance/entry-qr");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, message: "Authentication required" });
  });

  it("answers 401 with an invalid token", async () => {
    const response = await request(app)
      .get("/api/attendance/entry-qr")
      .set("Authorization", "Bearer not-a-jwt");

    expect(response.status).toBe(401);
  });

  it("mints a short-lived token for an approved employer", async () => {
    const token = await accessTokenFor(employerEmail);
    const response = await request(app)
      .get("/api/attendance/entry-qr")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.token.length).toBeGreaterThan(0);
    expect(typeof response.body.data.expiresAt).toBe("string");
    expect(Number.isNaN(Date.parse(response.body.data.expiresAt))).toBe(false);
    expect(response.body.data.ttlSeconds).toBe(30);
  });

  it("rejects an employee with 403", async () => {
    const token = await accessTokenFor(employeeEmail);
    const response = await request(app)
      .get("/api/attendance/entry-qr")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("rejects an unapproved employer with 403", async () => {
    const token = await accessTokenFor(pendingEmployerEmail);
    const response = await request(app)
      .get("/api/attendance/entry-qr")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Account is not approved");
  });
});
