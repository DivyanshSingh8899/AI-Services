const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function processAIResponse(message, aiBot, context = {}) {
  try {
    if (process.env.OPENAI_API_KEY) {
      const systemPrompt = buildSystemPrompt(aiBot);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: aiBot.aiModel?.model || 'gpt-3.5-turbo',
          temperature: aiBot.aiModel?.temperature ?? 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'I am sorry, I could not generate a response.';
      return { response: content, confidence: 0.8, resolved: true };
    }
  } catch (err) {
    console.error('OpenAI error:', err);
  }
  // Fallback mock
  return {
    response: `Thanks for your question about ${aiBot?.name || 'our services'}. Our team will follow up shortly.`,
    confidence: 0.5,
    resolved: false,
    suggestions: ['Would you like to book a demo?', 'Can I share our pricing plans?'],
    escalation: false
  };
}

function buildSystemPrompt(aiBot) {
  const business = aiBot?.trainingData?.businessInfo || {};
  const faqs = aiBot?.trainingData?.faqs || [];
  const faqText = faqs.slice(0, 20).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n');
  return `You are an AI customer support assistant for ${business.name || 'a small business'}. Be concise, friendly, and helpful. Use the following FAQs when relevant:\n${faqText}`;
}

module.exports = { processAIResponse };
