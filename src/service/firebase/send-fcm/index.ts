import { getFirebaseAccessToken } from '../common.js'

export async function sendFcm(params: {
    fcmTokens: string[]
    title: string
    body: string
    data?: Record<string, string>
}) {
    const accessToken = await getFirebaseAccessToken()
    const projectId = process.env.FIREBASE_PROJECT_ID ?? ''
    const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

    await Promise.all(
        params.fcmTokens.map(async token => {
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    message: {
                        token,
                        notification: {
                            title: params.title,
                            body: params.body,
                        },
                        data: params.data,
                    },
                }),
            })
        })
    )
    
    return
}
