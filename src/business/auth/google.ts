import { HttpErr } from "../../app/index.js";
import { dal } from "../../database/index.js";
import { service } from "../../service/index.js"
import { AuthUserRole, AuthUserStatus } from "../../database/auth/user/type.js";
import { auth } from "../../app/jwt/index.js";
import { AuthGoogleBody } from "../../model/body/auth/index.js";
import { utils } from "../../utils/index.js";


export async function verifyToken(params: {
    payload: AuthGoogleBody;
  }) {
    const {
      payload: { idToken, role },
    } = params;
  
    const info = await service.google.verifyToken({ idToken });

    if (!info.email)
      throw new HttpErr.UnprocessableEntity("Email not found", "EMAIL_NOT_FOUND");
  
    const user = await dal.auth.user.cmd.authUpsertByEmail({
      data: {
        email: info.email,
        username: 'google_' + utils.random.generateRandomNumber(6).toString(),
        password: utils.password.hashPassword(info.email),
        fullName: info.given_name + ' ' + info.family_name,
        phone: "0000000000",
        role,
        status: AuthUserStatus.enum.active,
        lastChangeContact: utils.time.getNow().toDate(),
      },
    });

    return {
      message: 'OK',
      token: auth.generateToken(user),
      user,
    };
  }
  