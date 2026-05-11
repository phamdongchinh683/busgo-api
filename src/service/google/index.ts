import { GoogleTokenInfo } from "./type.js";
import { HttpErr } from "../../app/index.js";
import { z } from "zod";

export async function verifyToken(params: { idToken: string }) {
    const { idToken } = params;
    const searchParams = new URLSearchParams({ id_token: idToken });
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?${searchParams.toString()}`,
    );
    const data = await response.json();
    const result = GoogleTokenInfo.safeParse(data);
    if (!result.success)
      throw new HttpErr.UnprocessableEntity(
        "Can not verify google Id token",
        "INVALID_TOKEN",
        z.looseObject({}).parse(data),
      );
    return result.data;
  }
  