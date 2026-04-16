// ============================================
// CLOUDFLARE WORKER — GEMINI API PROXY
// Deploy this at: dash.cloudflare.com → Workers & Pages
// ============================================

const GEMINI_API_KEY = 'AIzaSyC1UceRx12YvNu28dM9t3_bHBZXeyVFsFw'; // ← your key stays hidden here
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const SYSTEM_PROMPT = `You are an expert Pakistani law assistant and LLB professor. Your role is to:

1. Answer questions about Pakistani law with absolute accuracy
2. Reference Acts: Contract Act 1872, Code of Civil Procedure (CPC), Criminal Procedure Code (CrPC), Pakistan Penal Code (PPC), Constitution 1973, etc.
3. Explain legal concepts, court procedures, and case law
4. Provide citations in format: 'Section X of [Act Name]'
5. Include a disclaimer: '⚠️ Verify from official textbooks and courts'

For each answer:
- Start with the relevant section number in bold
- Explain the concept in simple Urdu-English mix if needed
- Provide real examples from Pakistani law
- Always end with 'Verify from: [official source]'

Keep answers detailed but accessible. Use bullet points for procedures.`;

export default {
  async fetch(request, env, ctx) {

    // ── CORS PREFLIGHT ──
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(),
      });
    }

    // ── ONLY ALLOW POST ──
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // ── PARSE REQUEST BODY ──
    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    if (!data || !data.prompt) {
      return jsonResponse({ error: 'Missing prompt field' }, 400);
    }

    const userPrompt         = data.prompt;
    const conversationHistory = data.history || [];

    // ── BUILD FULL PROMPT ──
    let fullPrompt = SYSTEM_PROMPT + '\n\n---\n\n';

    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n\n`;
      } else {
        fullPrompt += `Assistant: ${msg.content}\n\n`;
      }
    }
    fullPrompt += `User: ${userPrompt}\n\nAssistant: `;

    // ── CALL GEMINI API ──
    try {
      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      });

      const geminiData = await geminiRes.json();

      if (!geminiRes.ok) {
        const msg = geminiData?.error?.message || `Gemini API error ${geminiRes.status}`;
        return jsonResponse({ success: false, error: msg }, 500);
      }

      const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
                    || 'No response received.';

      return jsonResponse({ success: true, reply });

    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  },
};

// ── HELPERS ──
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
