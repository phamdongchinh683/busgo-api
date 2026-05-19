// import z from 'zod'

// export const QueueRegistry = {
//     'chat-messages': z.object({
//         action: z.string(),
//         data: z.unknown(),
//     }),
// }

// export type QueueSuffix = keyof typeof QueueRegistry

// export type QueueMessage<T extends QueueSuffix> = z.infer<(typeof QueueRegistry)[T]>
