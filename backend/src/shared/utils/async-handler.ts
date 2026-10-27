import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

type AsyncRequestHandler<P extends ParamsDictionary = ParamsDictionary, ReqBody = unknown> = (
  req: Request<P, unknown, ReqBody>,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler<P extends ParamsDictionary = ParamsDictionary, ReqBody = unknown>(
  handler: AsyncRequestHandler<P, ReqBody>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as Request<P, unknown, ReqBody>, res, next)).catch(next);
  };
}
