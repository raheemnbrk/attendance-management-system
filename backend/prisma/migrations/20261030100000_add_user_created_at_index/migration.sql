-- Indexes for the admin users list: created_at backs the default createdAt
-- sort, and the role/status composite already existed for the role/status
-- filters used by listAllUsers and listUserRoleCounts.
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
