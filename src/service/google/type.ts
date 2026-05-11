import { z } from "zod";

export const GoogleTokenInfo = z.object({
    azp: z.string(),
    email: z.string(),
    email_verified: z.string(),
    exp: z.string(),
    family_name: z.string().optional(),
    given_name: z.string().optional(),
    sub: z.string(),
  });
  export type GoogleTokenInfo = z.infer<typeof GoogleTokenInfo>;
  