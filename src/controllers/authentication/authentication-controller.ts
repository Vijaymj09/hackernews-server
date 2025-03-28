import { createHash } from "crypto";
import {
  LogInWtihUsernameAndPasswordError,
  SignUpWithUsernameAndPasswordError,
  type LogInWithUsernameAndPasswordResult,
  type SignUpWithUsernameAndPasswordResult,
} from "./authentication-types.js"; 
import { prismaClient } from "../../extras/prisma.js"; 
import jwt from "jsonwebtoken";
import { jwtSecretKey } from "../../environment.js"; 

export const signUpWithUsernameAndPassword = async (parameters: {
  email: string; // Changed from username to email
  password: string;
  name?: string;
}): Promise<SignUpWithUsernameAndPasswordResult> => {
  // Check if user already exists
  const isUserExistingAlready = await checkIfUserExistsAlready({
    email: parameters.email,
  });

  if (isUserExistingAlready) {
    throw SignUpWithUsernameAndPasswordError.CONFLICTING_USERNAME;
  }

  // Create password hash
  const passwordHash = await createPasswordHash({
    password: parameters.password,
  });

  // Create new user
  const user = await prismaClient.user.create({
    data: {
      email: parameters.email, // Changed from username to email
      password: passwordHash,
      name: parameters.name ?? "",
    },
  });

  // Generate JWT token
  const token = createJWToken({
    id: user.id,
    email: user.email, // Changed from username to email
  });

  return {
    token,
    user,
  };
};

export const logInWithUsernameAndPassword = async (parameters: {
  email: string; // Changed from username to email
  password: string;
}): Promise<LogInWithUsernameAndPasswordResult> => {
  // Create password hash
  const passwordHash = createPasswordHash({
    password: parameters.password,
  });

  // Find user by email
  const user = await prismaClient.user.findUnique({
    where: {
      email: parameters.email, // Changed from username to email
    },
  });

  if (!user || user.password !== passwordHash) { 
    throw LogInWtihUsernameAndPasswordError.INCORRECT_USERNAME_OR_PASSWORD;
  }

  // Generate JWT token
  const token = createJWToken({
    id: user.id,
    email: user.email, // Changed from username to email
  });

  return {
    token,
    user,
  };
};

const createJWToken = (parameters: { id: string; email: string }): string => {
  const jwtPayload: jwt.JwtPayload = {
    iss: "hackernews-server",
    sub: parameters.id,
    email: parameters.email, // Changed from username to email
  };

  return jwt.sign(jwtPayload, jwtSecretKey, {
    expiresIn: "30d",
  });
};

const checkIfUserExistsAlready = async (parameters: { email: string }): Promise<boolean> => {
  const existingUser = await prismaClient.user.findUnique({
    where: {
      email: parameters.email, // Changed from username to email
    },
  });

  return !!existingUser;
};

const createPasswordHash = (parameters: { password: string }): string => {
  return createHash("sha256").update(parameters.password).digest("hex");
};
