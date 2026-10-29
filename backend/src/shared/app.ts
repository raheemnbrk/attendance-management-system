import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import { globalLimiter } from "./middleware/rate-limit.middleware";
import { userRouter } from "../features/user/user.routes";
import { adminRouter } from "../features/admin/admin.routes";
import { attendanceRouter } from "../features/attendance/attendance.routes";

export function createApp() {
  const app = express();

  // Needed behind a reverse proxy (nginx, load balancer...) so the real client
  // IP from X-Forwarded-For is used for logging and rate limiting.
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok" } });
  });

  app.use("/api", globalLimiter);
  app.use("/api/users", userRouter);
  app.use("/api/users", adminRouter);
  app.use("/api/attendance", attendanceRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
