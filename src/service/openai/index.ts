import type { BusGoAgentDecision } from '../../business/agent/busgo-agent.js'
import type { AiChatState } from '../../model/body/chat/index.js'
import { utils } from '../../utils/index.js'

const BUSGO_AGENT_ACTIONS = [
    'ASK_USER',
    'SEARCH_SCHEDULES',
    'LIST_PICKUP_STOPS',
    'LIST_DROPOFF_STOPS',
    'CHECK_AVAILABLE_SEATS',
    'CREATE_HOLD_BOOKING',
    'GET_PROMOTIONS',
    'GET_BOOKING',
] as const

const BUSGO_AGENT_FALLBACK_DECISION: BusGoAgentDecision = {
    action: 'ASK_USER',
    args: {},
    reply: 'Xin lỗi, mình chưa hiểu rõ. Bạn muốn tìm chuyến hay đặt vé?',
}

type ChatCompletionResponse = {
    choices?: Array<{
        message?: {
            content?: string
        }
    }>
    error?: {
        message?: string
    }
}

export async function decideBusGoAgentAction(params: {
    message: string
    state?: AiChatState
    context?: string
}): Promise<BusGoAgentDecision> {
    const today = utils.time.getTodayCalendarDateString()
    const tomorrow = utils.time.formatCalendarDate(
        utils.time.getRelativeAppCalendarDate(1),
        'YYYY-MM-DD'
    )
    const dayAfterTomorrow = utils.time.formatCalendarDate(
        utils.time.getRelativeAppCalendarDate(2),
        'YYYY-MM-DD'
    )
    const prompt = `
Bạn là BusGo Booking Agent.

Bạn đọc tin nhắn khách hàng và quyết định action tiếp theo cho backend.

Bạn chỉ được trả về JSON hợp lệ, không Markdown.

Các action được phép:
ASK_USER
SEARCH_SCHEDULES
LIST_PICKUP_STOPS
LIST_DROPOFF_STOPS
CHECK_AVAILABLE_SEATS
CREATE_HOLD_BOOKING
GET_PROMOTIONS
GET_BOOKING

Không được xử lý thanh toán trực tiếp.
Không được tạo dữ liệu giả.
Không được xác nhận booking thành công nếu backend chưa chạy tool thành công.
Không được yêu cầu khách nhập ID nội bộ.
Agent hiện chỉ hỗ trợ đặt vé một chiều, không được tự xử lý vé khứ hồi.
Nếu thiếu thông tin, dùng ASK_USER và hỏi đúng 1 câu bằng tiếng Việt.

Sau khi CREATE_HOLD_BOOKING thành công, backend sẽ hướng dẫn khách vào:
Profile > Vé > Đã giữ chỗ
để thanh toán.

Quy tắc chọn action theo state:
- Luôn ưu tiên state hiện tại, không hỏi lại thông tin đã có trong state.
- Chưa đủ nơi đi, nơi đến hoặc ngày đi: ASK_USER.
- Đủ nơi đi, nơi đến và ngày đi: SEARCH_SCHEDULES.
- state.stage=schedules_listed và khách chọn chuyến: LIST_PICKUP_STOPS.
- state.stage=pickup_listed và khách chọn điểm đón: LIST_DROPOFF_STOPS.
- state.stage=dropoff_listed và khách chọn điểm trả: CHECK_AVAILABLE_SEATS.
- state.stage=seat_listed và khách chọn hoặc yêu cầu giữ ghế: CREATE_HOLD_BOOKING.
- Khách hỏi khuyến mãi hoặc mã giảm giá: GET_PROMOTIONS.
- Khách hỏi vé, booking hoặc trạng thái giữ chỗ: GET_BOOKING.

Hiểu tiếng Việt tự nhiên:
- "hôm nay" = ${today} theo Asia/Ho_Chi_Minh
- "mai", "ngày mai" = ${tomorrow}
- "mốt", "ngày kia" = ${dayAfterTomorrow}
- "sáng mai" = ${tomorrow}, preferredTime = morning
- "tối nay" = ${today}, preferredTime = evening
- "đà nưang", "da nang", "dn" = Đà Nẵng
- "dak lak", "đắc lắc", "đắk lắk" = Đắk Lắk
- "sg", "sài gòn", "hcm" = TP. Hồ Chí Minh

Output JSON shape:
{
  "action": "SEARCH_SCHEDULES",
  "args": {
    "from": "Đà Nẵng",
    "to": "Đắk Lắk",
    "departureDate": "${tomorrow}",
    "passengers": 1,
    "preferredTime": null
  },
  "reply": null
}

Nếu thiếu thông tin:
{
  "action": "ASK_USER",
  "args": {},
  "reply": "Bạn muốn đi từ đâu?"
}
`.trim()
    const messages = [
        {
            role: 'system',
            content: prompt,
        },
        ...(params.context
            ? [
                  {
                      role: 'system',
                      content: `Ngữ cảnh luồng hiện tại:\n${params.context}`,
                  },
              ]
            : []),
        ...(params.state
            ? [
                  {
                      role: 'system',
                      content: `State hiện tại:\n${JSON.stringify(params.state)}`,
                  },
              ]
            : []),
        {
            role: 'user',
            content: params.message,
        },
    ]

    const response = await fetch('https://inference.do-ai.run/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: process.env.OPENAI_CHAT_MODEL ?? '',
            max_tokens: 500,
            temperature: 0,
            messages,
        }),
    })

    const data = (await response.json()) as ChatCompletionResponse

    if (!response.ok) {
        throw new Error(data.error?.message ?? 'Không thể gọi BusGo Booking Agent.')
    }

    return parseBusGoAgentDecision(data.choices?.[0]?.message?.content)
}

function parseBusGoAgentDecision(content?: string): BusGoAgentDecision {
    if (!content?.trim()) return BUSGO_AGENT_FALLBACK_DECISION

    const trimmed = content
        .trim()
        .replace(/^```(?:json)?\s*/iu, '')
        .replace(/\s*```$/u, '')
    const firstBrace = trimmed.indexOf('{')
    const lastBrace = trimmed.lastIndexOf('}')
    const json =
        firstBrace >= 0 && lastBrace > firstBrace
            ? trimmed.slice(firstBrace, lastBrace + 1)
            : trimmed

    try {
        const decision = JSON.parse(json) as Record<string, unknown>
        const action = decision.action
        const args = decision.args
        const reply = decision.reply

        if (
            typeof action !== 'string' ||
            !BUSGO_AGENT_ACTIONS.includes(action as (typeof BUSGO_AGENT_ACTIONS)[number]) ||
            typeof args !== 'object' ||
            args === null ||
            Array.isArray(args) ||
            (reply !== undefined && reply !== null && typeof reply !== 'string')
        ) {
            return BUSGO_AGENT_FALLBACK_DECISION
        }

        return {
            action: action as BusGoAgentDecision['action'],
            args: args as Record<string, unknown>,
            reply: reply as string | null | undefined,
        }
    } catch {
        return BUSGO_AGENT_FALLBACK_DECISION
    }
}
