const GEMINI_API_KEY = 'AIzaSyCEPACKf42uM_cHTMMsfrFdQ-JhnSA9yNM';
const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function testPayload() {
  const prompt = `Você é um assistente técnico especializado em extrair informações de histórico de tarefas. Abaixo está o histórico... Teste local.`;
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Data:", JSON.stringify(data, null, 2));
}

testPayload().catch(console.error);
