import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return encoder.encode(secret);
}

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string | null;
}

export async function signJwt(payload: JwtPayload, expiresIn = "1h") {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) ?? null,
    };
  } catch {
    return null;
  }
}
