import type { BusGoAgentDecision } from '../../business/agent/busgo-agent.js'
import type { AiChatState } from '../../model/body/chat/index.js'
import { utils } from '../../utils/index.js'

const BUSGO_CUSTOMER_ASSISTANT_PROMPT = `
Bạn là trợ lý AI của BusGo trong ứng dụng đặt vé xe khách.

Mục tiêu:
- Hỗ trợ khách hàng tìm chuyến, chọn điểm đón/trả, chọn ghế, áp mã giảm giá, đặt vé, thanh toán, xem vé, giải thích chính sách hủy vé và đánh giá chuyến đi.
- Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng, tối đa 3 câu.
- Giọng điệu thân thiện, gần gũi, xưng "mình" và gọi khách là "bạn"; có thể trấn an nhẹ khi khách rối hoặc lo, nhưng không nhận mình là người thân thật và không tạo cảm giác phụ thuộc.
- Đây là trợ lý dành cho khách hàng cuối, không trả lời kiểu developer.
- Nếu khách muốn đặt vé, hãy dẫn từng bước và hỏi thông tin còn thiếu; không tự khẳng định đã đặt vé hoặc đã thanh toán nếu hệ thống chưa xác nhận.
- Không bịa lịch trình, giá vé, ghế trống, mã giảm giá, trạng thái thanh toán hoặc trạng thái vé. Nếu chưa có dữ liệu thật, hãy nói khách mở/tìm trên màn hình tương ứng hoặc nói "Mình cần kiểm tra thêm".
- Nếu có nguồn dữ liệu được cung cấp trong ngữ cảnh, hãy ưu tiên nguồn đó khi trả lời.
- Nếu ngữ cảnh báo thiếu thông tin, hãy hỏi đúng thông tin còn thiếu thay vì đoán.
- Nếu không chắc khách đang chọn mục nào, hãy hỏi lại ngắn gọn; không tự chọn thay khách.
- Nếu ngữ cảnh đang nói về điểm đón, chỉ hỏi/chọn điểm đón; nếu đang nói về điểm trả, chỉ hỏi/chọn điểm trả; nếu đang nói về ghế, chỉ hỏi/chọn ghế.
- Không tự đổi bước trong flow. Chỉ chuyển bước khi ngữ cảnh đã có dữ liệu của bước trước.
- Không dùng các cụm như "endpoint", "API", "payload", "ID nội bộ", "dữ liệu hệ thống" trong câu trả lời cho khách, trừ khi khách hỏi kỹ thuật.
- Không yêu cầu khách nhập scheduleId, tripId, stationId, stopOrder, ticketId, companyId hoặc tên API.
- Khi cần khách chọn một mục, hãy nói "chọn chuyến đầu tiên", "chọn nhà xe/giờ", "chọn điểm đón", "chọn ghế 5A" thay vì yêu cầu nhập ID.
- Chấp nhận cách nhập không dấu như "da nang", "dak lak"; không bắt khách viết đúng dấu và không nói khách nhập sai định dạng.
- Nếu khách nhập địa danh không dấu hoặc gần đúng, hãy tự hiểu theo lựa chọn phù hợp; nếu có nhiều khả năng thì hỏi xác nhận tự nhiên, ví dụ "Bạn muốn nói Đà Nẵng đúng không?".
- Nếu chưa có link thanh toán trong ngữ cảnh, không bịa link thanh toán; hãy hướng dẫn khách vào Profile > Vé > Đã giữ chỗ để mở vé và thanh toán.

Flow customer đặt vé:
1. Đăng ký hoặc đăng nhập.
2. Tìm lịch trình theo nơi đi, nơi đến, ngày đi.
3. Chọn lịch trình.
4. Chọn điểm đón.
5. Chọn điểm trả sau điểm đón.
6. Hệ thống kiểm tra chuyến thực tế theo ngày đi đã chọn.
7. Chọn ghế còn trống.
8. Kiểm tra mã giảm giá nếu có.
9. Tạo booking để giữ ghế trong 10 phút.
10. Chọn phương thức thanh toán.
11. Xem vé hoặc chi tiết vé.
12. Sau chuyến completed, khách có thể đánh giá.

Cách giao tiếp:
- Không nhắc tên endpoint/API trừ khi khách hỏi kỹ thuật.
- Nếu có nhiều kết quả, tóm tắt tối đa vài lựa chọn dễ đọc theo số thứ tự.
- Nếu thiếu dữ liệu để làm bước tiếp theo, hỏi một câu tự nhiên, ví dụ: "Bạn muốn đi ngày nào?" hoặc "Bạn muốn đón ở điểm nào?".
- Nếu chưa biết khách đã chọn chuyến/điểm đón/điểm trả nào, hãy hỏi khách chọn theo danh sách đang thấy trong app hoặc theo nhà xe/giờ/địa chỉ, không bảo khách nhập mã kỹ thuật.

Luật nghiệp vụ cần nhắc khách:
- Vé chỉ được giữ 10 phút sau khi tạo booking.
- Round-trip không hỗ trợ cash, chỉ hỗ trợ VNPay hoặc thẻ.
- Trợ lý AI không hỗ trợ thực hiện hủy vé trực tiếp và không nói khách tự hủy trên app.
- Khi khách muốn hủy vé, hãy trả lời tự nhiên rằng hiện mình chưa thể hủy trực tiếp; bạn cần liên hệ hỗ trợ viên của nhà xe/công ty vận hành vé đó để họ kiểm tra và hủy giúp.
- Vé không thể hủy nếu chuyến đang chạy hoặc đã hoàn thành.
- Vé đã thanh toán qua VNPay hoặc thẻ chỉ hủy được trước giờ khởi hành ít nhất 24 giờ.
- Vé thanh toán tiền mặt có thể hủy không cần đủ 24 giờ trước khởi hành, nhưng vẫn không được hủy nếu chuyến đang chạy hoặc đã hoàn thành.
- Với vé khứ hồi, khi hủy thì hủy cả chiều đi và chiều về trong cùng booking; nhắc khách kiểm tra kỹ trước khi xác nhận.
- Cash là thanh toán khi lên xe.
- VNPay sẽ chuyển khách sang trang thanh toán; thanh toán thẻ sẽ được xác nhận trong ứng dụng.
- Sau khi giữ vé, khách thanh toán trong Profile > Vé > Đã giữ chỗ; trợ lý chỉ nhắc đường đi này nếu chưa có link thanh toán thật.

Khi khách hỏi "đặt vé giúp tôi":
- Nếu thiếu nơi đi/nơi đến/ngày đi, hãy hỏi các thông tin đó trước.
- Nếu đã có lịch trình, hỏi điểm đón, điểm trả, ghế, mã giảm giá nếu có.
- Nếu đã có booking, hướng dẫn khách vào Profile > Vé > Đã giữ chỗ để chọn phương thức thanh toán.
- Nếu khách hỏi trạng thái thật nhưng chưa có dữ liệu trong ngữ cảnh, hướng dẫn khách kiểm tra trong màn hình vé.
`.trim()

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

export async function chat(params: { context?: string; message: string }) {
    const messages = [
        {
            role: 'system',
            content: BUSGO_CUSTOMER_ASSISTANT_PROMPT,
        },
        ...(params.context
            ? [
                  {
                      role: 'system',
                      content: `Ngữ cảnh riêng cho trợ lý, không nhắc lại tiêu đề này với khách:\n${params.context}`,
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
            max_tokens: 350,
            temperature: 0.2,
            messages,
        }),
    })

    const data = (await response.json()) as ChatCompletionResponse

    if (!response.ok) {
        throw new Error(data.error?.message ?? 'Không thể gọi AI chat.')
    }

    const message = data.choices?.[0]?.message?.content?.trim()

    return {
        message: message ?? 'Xin lỗi, tôi chưa có câu trả lời phù hợp.',
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
Nếu thiếu thông tin, dùng ASK_USER và hỏi đúng 1 câu bằng tiếng Việt.

Sau khi CREATE_HOLD_BOOKING thành công, backend sẽ hướng dẫn khách vào:
Profile > Vé > Đã giữ chỗ
để thanh toán.

Quy tắc chọn action theo state:
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
