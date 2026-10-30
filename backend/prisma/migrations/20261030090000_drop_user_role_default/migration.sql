-- Change the User role column: drop the table-level default so every account
-- creation must supply the role explicitly. Employer-created users always get
-- EMPLOYEE from the service; employers register as EMPLOYER; admins are seeded.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
