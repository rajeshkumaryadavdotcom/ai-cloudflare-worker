require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

async function runAIQuery(model, userQuery) {
  const fetch = (await import('node-fetch')).default; // Dynamic import for node-fetch

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
    {
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
      method: "POST",
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a friendly assistant that helps answer questions" },
          { role: "user", content: userQuery },
        ],
      }),
    }
  );
  const result = await response.json();
  return result;
}

// Serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve the HTML page at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Define the AI route
app.get('/ai', async (req, res) => {
  const userQuery = req.query.search;
  if (!userQuery) {
    return res.status(400).json({ error: "Query parameter 'search' is required" });
  }

  try {
    const aiResponse = await runAIQuery("@cf/meta/llama-3-8b-instruct", userQuery);
    res.json(aiResponse);
  } catch (error) {
    console.error("Error fetching AI response:", error);
    res.status(500).json({ error: "Failed to fetch AI response" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
