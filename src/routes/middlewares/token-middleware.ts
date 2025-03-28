import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { jwtSecretKey } from "../../environment.js";

export const tokenMiddleware = createMiddleware<{
  Variables: {
    userId: string;
  };
}>(async (context, next) => {
  // Extract token from the 'token' header
  const token = context.req.header("token");

  if (!token) {
    return context.json(
      {
        message: "Missing Token",
      },
      401
    );
  }

  try {
    const payload = jwt.verify(token, jwtSecretKey) as jwt.JwtPayload;

    const userId = payload.sub;

    if (!userId) {
      return context.json(
        {
          message: "Unauthorized",
        },
        401
      );
    }

    // Set userId in the context for downstream use
    context.set("userId", userId);

    // Proceed to the next middleware or route handler
    await next();
  } catch (e) {
    // If token verification fails (e.g., invalid or expired token), return 401 Unauthorized
    return context.json(
      {
        message: "Unauthorized",
      },
      401
    );
  }
});