// Vercel Serverless Function — ITO 经营分析AI助理 LLM 代理
// API Key 通过环境变量 API_KEY 传入（在 Vercel 控制台设置）

const API_KEY = process.env.API_KEY || '';
const API_URL = process.env.API_URL || 'https://api.chatanywhere.tech/v1/chat/completions';
const MODEL   = process.env.MODEL || 'gpt-4o-mini';
const SYS_MSG = '你是ITO品牌（高端行李箱/包袋品牌）经营分析AI助理的AI引擎。规则：1) 回答简洁，结论先行，每段不超过3句话；2) 绝对保留原始渠道名称（天猫、京东、抖音等）和原始数字，不要用"业务A/B"代替；3) 基于提供的数据分析，不编造；4) 使用中文。';

export default async function handler(req, res) {
  // 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  // CORS 头（允许 GitHub Pages 前端调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'API_KEY 未配置，请在 Vercel 环境变量中设置' });
  }

  try {
    const { prompt, context, data } = req.body || {};
    const userMsg = data
      ? `请分析以下ITO品牌（高端行李箱/包袋品牌）的经营数据。**重要**：渠道名称是天猫、京东、抖音摩登旗舰店、抖音箱包旗舰店等，请直接使用这些原始名称，不要改为业务A/B/C。回答简洁结论先行。\n\n${data}\n\n问题：${prompt}`
      : `${context||''}\n\n问题：${prompt}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYS_MSG },
          { role: 'user', content: userMsg }
        ],
        max_tokens: 1024,
        temperature: 0.3
      })
    });

    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch(e) { result = {}; }

    const reply = result.choices?.[0]?.message?.content || ('LLM返回异常: ' + text.slice(0, 200));
    return res.status(200).json({ reply });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
