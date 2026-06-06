import { createSigner, createVerifier } from "fast-jwt";
import { UserInfo } from "../../../model/common.js";
import { HttpErr } from "../../index.js";


const sign = createSigner({
  algorithm: "HS256",
  expiresIn: `36525 days`,
  key: process.env.JWT_SECRET,
});
const verify = createVerifier({ key: process.env.JWT_SECRET });

export const generateToken = (payload: UserInfo): string => {
  return sign(UserInfo.parse(payload));
};

interface Headers {
  authorization?: string;
  Authorization?: string;
}
const verifyToken = (headers: Headers): null | UserInfo => {
  const { authorization, Authorization } = headers;
  const authHeader = authorization ?? Authorization;
  if (!authHeader) return null;

  const bearer = "Bearer ";
  const token = authHeader.startsWith(bearer)
    ? authHeader.slice(bearer.length)
    : authHeader;

  let payload: unknown;
  try {
    payload = verify(token);
  } catch (error) {
    console.error(error);
    throw new HttpErr.Unauthorized("Invalid authorization header");
  }

  let userInfo: UserInfo;
  try {
    userInfo = UserInfo.parse(payload);
  } catch (error) {
    console.error(error);
    throw new HttpErr. Unauthorized("Invalid token payload");
  }

  return userInfo;
};

export const optionalAuthenticate = (headers: Headers): null | UserInfo => {
  const userInfo = verifyToken(headers);
  return userInfo;
};
export const requiredAuthenticate = (headers: Headers): UserInfo => {
  const userInfo = verifyToken(headers);
  if (!userInfo) throw new HttpErr.Unauthorized("Authentication required");
  return userInfo;
};

const signTemp = createSigner({
  algorithm: "HS256",
  expiresIn: "15m",
  key: process.env.JWT_SECRET,
});

export const generateTempToken = (payload: Record<string, unknown>): string => {
  return signTemp(payload);
};

export const requireRoles = (
  headers: Headers,
  roleNames: string[],
): UserInfo => {
  const userInfo = requiredAuthenticate(headers);
  const { role } = userInfo;
  if (!role) throw new HttpErr.Forbidden();
  return userInfo;
};
