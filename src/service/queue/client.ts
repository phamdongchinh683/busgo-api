// import { SendMessageCommand, type SendMessageCommandOutput, SQSClient } from '@aws-sdk/client-sqs'
// import { type QueueMessage, QueueRegistry, type QueueSuffix } from './type.js'

// let sqs: SQSClient | null = null

// function client(): SQSClient {
//     if (sqs) return sqs
//     const region = process.env.AWS_REGION ?? 'us-east-1'
//     const ak = process.env.AWS_ACCESS_KEY_ID ?? ''
//     const sk = process.env.AWS_SECRET_ACCESS_KEY ?? ''
//     const ep = process.env.AWS_ENDPOINT ?? ''
//     sqs = new SQSClient({
//         region,
//         ...(ep ? { endpoint: ep } : {}),
//         ...(ak && sk ? { credentials: { accessKeyId: ak, secretAccessKey: sk } } : {}),
//     })
//     return sqs
// }

// export const connect = client

// export function queueUrl(s: QueueSuffix): string {
//     const base = process.env.AWS_ENDPOINT?.replace(/\/+$/, '')
//     const acct = process.env.AWS_LOCAL_ACCOUNT_ID ?? ''

//     return `${base}/${acct}/${s}`
// }

// export async function sendMessage<T extends QueueSuffix>(
//     s: T,
//     msg: QueueMessage<T>,
//     opt?: { delaySeconds?: number; messageDeduplicationId?: string; messageGroupId?: string }
// ): Promise<SendMessageCommandOutput> {
//     const body = QueueRegistry[s].parse(msg)
//     return client().send(
//         new SendMessageCommand({
//             QueueUrl: queueUrl(s),
//             MessageBody: JSON.stringify(body),
//             ...(opt?.delaySeconds != null ? { DelaySeconds: opt.delaySeconds } : {}),
//             ...(opt?.messageDeduplicationId != null
//                 ? { MessageDeduplicationId: opt.messageDeduplicationId }
//                 : {}),
//             ...(opt?.messageGroupId != null ? { MessageGroupId: opt.messageGroupId } : {}),
//         })
//     )
// }
