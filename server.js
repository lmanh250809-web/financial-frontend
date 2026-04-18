// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Đổi tên biến

if (!OPENROUTER_API_KEY) {
  console.error('❌ Thiếu OPENROUTER_API_KEY trong file .env');
  process.exit(1);
}

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Thiếu message' });

  const systemPrompt = `Bạn là chuyên gia tài chính cá nhân, tư vấn dựa trên dữ liệu thực tế từ dashboard của người dùng.
Dữ liệu hiện tại: Mục tiêu: ${context.target} VND, Tiết kiệm/tháng: ${context.monthlySave} VND, Lãi suất: ${context.interestRate}%/năm, Thời gian: ${context.months} tháng, Lạm phát: ${context.inflation}%/năm, Tổng tiền dự kiến: ${context.currentFV} VND.
Trả lời ngắn gọn, cụ thể, có số liệu. Nếu câu hỏi ngoài tài chính, lịch sự từ chối.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://your-app.vercel.app', // Thay bằng URL frontend của bạn
        'X-Title': 'Financial Dashboard'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // Dùng model của OpenAI qua OpenRouter
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Lỗi API');
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server chạy tại http://localhost:${PORT}`);
});