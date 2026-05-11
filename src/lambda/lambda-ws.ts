import { io } from 'socket.io-client'
import { DeleteMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs'
import { ZodError } from 'zod'

import { QueueRegistry } from '../service/queue/type.js'
import { connect as connectSqs, queueUrl } from '../service/queue/client.js'
import 'dotenv/config'

type SQSEvent = {
    Records: Array<{
        body: string
    }>
}


async function connectSocket() {
    const socket = io(process.env.SOCKET_SERVER_URL ?? '', {
        transports: ['websocket'],
        reconnection: false,
        auth: {
            token: process.env.INTERNAL_SOCKET_TOKEN ?? '',
            type: 'internal',
        },
    })

    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off('connect', onConnect)
            socket.off('connect_error', onError)
            reject(new Error('socket connect timeout'))
        }, 8000)

        const onConnect = () => {
            clearTimeout(timer)
            socket.off('connect_error', onError)
            resolve()
        }

        const onError = (err: Error) => {
            clearTimeout(timer)
            socket.off('connect', onConnect)
            reject(err)
        }

        socket.once('connect', onConnect)
        socket.once('connect_error', onError)
    })

    return socket
}

async function processRecords(records: Array<{ body: string }>) {
    const socket = await connectSocket()
    try {
        for (const record of records) {
            try {
                const raw = JSON.parse(record.body) as unknown
                const message = QueueRegistry['chat-messages'].parse(raw)
                if (message.action !== 'message:new') continue

                const d = message.data as Record<string, unknown>
                const boxId = String(d.boxId ?? '')
                const receiverId = String(d.receiverId ?? '')
                if (!boxId || !receiverId) continue

                socket.emit('message:new', {
                    targetId: boxId,
                    data: {
                        boxId,
                        senderName: d.senderName,
                        body: d.body,
                        senderId: d.senderId,
                        receiverId,
                        createdAt: d.createdAt ?? d.created_at,
                        ...(d.messageId != null ? { messageId: String(d.messageId) } : {}),
                    },
                })

                socket.emit('chat:unread:count', {
                    targetId: receiverId,
                    data: {
                        boxId,
                        lastMessage: d.lastMessage ?? d.body,
                        unreadReceiverCount: d.unreadReceiverCount,
                        unreadSenderCount: d.unreadSenderCount,
                    },
                })
            } catch (err) {
                if (err instanceof ZodError) {
                    console.error('[lambda-ws] invalid body:', record.body, err.message)
                    continue
                }
                throw err
            }
        }
    } finally {
        socket.disconnect()
    }
}

export const handler = async (event: SQSEvent) => {
    await processRecords(event.Records)
}

export async function runLoop() {
    const sqs = connectSqs()
    const queueUrlValue = queueUrl('chat-messages')

    for (;;) {
        const out = await sqs.send(
            new ReceiveMessageCommand({
                QueueUrl: queueUrlValue,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: 20,
                VisibilityTimeout: 60,
            })
        )

        const messages = out.Messages ?? []
        for (const m of messages) {
            if (!m.Body || !m.ReceiptHandle) continue

            try {
                await processRecords([{ body: m.Body }])
                await sqs.send(
                    new DeleteMessageCommand({
                        QueueUrl: queueUrlValue,
                        ReceiptHandle: m.ReceiptHandle,
                    })
                )
            } catch (err) {
                console.error('[lambda-ws] handle failed, message will retry:', err)
            }
        }
    }
}

if (process.argv[1]?.includes('lambda-ws')) {
    runLoop().catch(err => {
        console.error('[lambda-ws] fatal', err)
        process.exit(1)
    })
}

