export async function chat(params: { message: string }) {
    const response = await fetch('https://inference.do-ai.run/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: process.env.OPENAI_CHAT_MODEL ?? '',
            max_tokens: 100,
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là trợ lý BusGo. Trả lời ngắn gọn dưới 3 câu.',
                },
                {
                    role: 'user',
                    content: params.message,
                },
            ],
        }),
    })
        .then(response => response.json())
        .then(data => {
            return data
        })

    return {
        message: response.choices?.[0]?.message?.content,
    }
}
