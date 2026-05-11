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

const waitSec = Math.min(20, Math.max(0, Number(process.env.SQS_WAIT_TIME_SECONDS ?? 20)))
const visibilitySec = Math.min(43200, Math.max(0, Number(process.env.SQS_VISIBILITY_TIMEOUT ?? 60)))
const idleSleepMs = Math.max(0, Number(process.env.SQS_IDLE_SLEEP_MS ?? 0))
const errorBackoffMs = Math.max(1000, Number(process.env.SQS_ERROR_BACKOFF_MS ?? 3000))
const startupJitterMsMax = Math.max(0, Number(process.env.SQS_STARTUP_JITTER_MS ?? 3000))
const maxRunSeconds = Math.max(0, Number(process.env.WORKER_MAX_RUN_SECONDS ?? 0))
const maxRunJitterSeconds = Math.max(0, Number(process.env.WORKER_MAX_RUN_JITTER_SECONDS ?? 300))

let stopping = false

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function setupShutdownHooks() {
    const onShutdown = (signal: NodeJS.Signals) => {
        stopping = true
        console.log(`[lambda-ws] received ${signal}, shutting down loop...`)
    }
    process.once('SIGINT', onShutdown)
    process.once('SIGTERM', onShutdown)
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
    setupShutdownHooks()
    const startupDelayMs =
        startupJitterMsMax > 0 ? Math.floor(Math.random() * (startupJitterMsMax + 1)) : 0
    if (startupDelayMs > 0) {
        console.log('[lambda-ws] startup jitter delay', { startupDelayMs })
        await sleep(startupDelayMs)
    }

    const recycleDeadlineMs =
        maxRunSeconds > 0
            ? Date.now() + (maxRunSeconds + Math.floor(Math.random() * (maxRunJitterSeconds + 1))) * 1000
            : 0



    while (!stopping) {
        if (recycleDeadlineMs > 0 && Date.now() >= recycleDeadlineMs) {
            console.log('[lambda-ws] recycle deadline reached, exiting for rolling restart')
            break
        }

        try {
            const out = await sqs.send(
                new ReceiveMessageCommand({
                    QueueUrl: queueUrlValue,
                    MaxNumberOfMessages: 10,
                    WaitTimeSeconds: waitSec,
                    VisibilityTimeout: visibilitySec,
                })
            )

            const messages = out.Messages ?? []
            if (messages.length === 0 && idleSleepMs > 0) {
                await sleep(idleSleepMs)
                continue
            }

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
        } catch (err) {
            console.error(err)
            await sleep(errorBackoffMs)
        }
    }
    console.log('[lambda-ws] loop stopped')
}

if (process.argv[1]?.includes('lambda-ws')) {
    runLoop().catch(err => {
        console.error('[lambda-ws] fatal', err)
        process.exit(1)
    })
}

