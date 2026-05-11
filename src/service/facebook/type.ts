import z from 'zod'

export const FacebookIdTokenPayload = z.object({
    email: z.email().optional(),
    family_name: z.string().optional(),
    given_name: z.string().optional(),
    sub: z.string().optional(),
})
export type FacebookIdTokenPayload = z.infer<typeof FacebookIdTokenPayload>

export const FacebookDebugTokenResp = z.object({
    data: z.object({
        app_id: z.string(),
        expires_at: z.number(),
        is_valid: z.boolean(),
    }),
})
export type FacebookDebugTokenResp = z.infer<typeof FacebookDebugTokenResp>

export const FacebookGetMeResp = z.object({
    email: z.email().optional(),
    first_name: z.string().optional(),
    id: z.string(),
    last_name: z.string().optional(),
})
export type FacebookGetMeResp = z.infer<typeof FacebookGetMeResp>
