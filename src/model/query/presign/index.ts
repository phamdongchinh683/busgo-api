    
import z from 'zod'

export const PresignedImageUploadQuery = z.object({
    folder: z.string(),
    id: z.string(),
})

export type PresignedImageUploadQuery = z.infer<typeof PresignedImageUploadQuery>