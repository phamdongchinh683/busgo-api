import { z } from 'zod'

export function PublicApiId<TPublicId extends z.ZodType, TInternalId extends z.ZodType>(
    publicId: TPublicId,
    _internalId: TInternalId
): z.ZodType<z.output<TPublicId> | z.output<TInternalId>> {
    return publicId as z.ZodType<z.output<TPublicId> | z.output<TInternalId>>
}
