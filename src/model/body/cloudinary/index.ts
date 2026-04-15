import z from 'zod'

export const PresignedImageUploadResponse = z.object({
    acceptedMimeTypes: z.array(z.string()),
    allowedFormats: z.string(),
    apiKey: z.string(),
    cloudName: z.string(),
    folder: z.string(),
    signature: z.string(),
    signatureValidSeconds: z.number(),
    timestamp: z.string(),
    uploadUrl: z.string(),
})

export type PresignedImageUploadResponse = z.infer<typeof PresignedImageUploadResponse>
