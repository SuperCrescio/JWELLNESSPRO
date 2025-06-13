
export async function getAIUIResponse(apiKey, messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${errText}`);
  }
  const data = await response.json();
  const message = data.choices?.[0]?.message?.content;
  if (!message) throw new Error('OpenAI response missing content');
  try {
    return JSON.parse(message);
  } catch (err) {
    throw new Error('Failed to parse OpenAI response: ' + err.message);
  }
}
