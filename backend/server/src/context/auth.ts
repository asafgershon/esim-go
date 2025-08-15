import { cleanEnv, str } from "envalid";
import jwt from "jsonwebtoken";
import type { IncomingMessage } from "node:http";
import type { User } from "../types";
// TODO: Implement user repository for eSIM Go
// import { getUserById } from "./repositories/users.repository";

const env = cleanEnv(process.env, {
  JWT_SECRET: str(),
});

export const sign = (user: User) => {
  const sessionToken = jwt.sign(
    { userId: user.id, type: "session" },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: "refresh" },
    env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return {
    sessionToken,
    refreshToken,
  };
};

export const verify = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export const checkAuth = async (token: string) => {
  if (!token) {
    return {
      token,
      user: null,
      isAuthenticated: false,
    };
  }
  try {
    const { userId } = verify(token) as { userId: string };
    // TODO: Implement getUserById for eSIM Go
    // const user = await getUserById(userId);
    const user = null; // Placeholder until user repository is implemented
    return {
      token,
      user,
      isAuthenticated: !!user,
    };
  } catch (error) {
    return {
      token,
      user: null,
      isAuthenticated: false,
    };
  }
};

export const getToken = (request: IncomingMessage) => {
  return request?.headers?.authorization?.split(" ")?.[1];
};
