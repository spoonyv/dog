exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const seed = body.seed || Math.floor(Math.random() * 4294967296);

    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) throw new Error("API key missing");

    const response = await fetch("https://api.venice.ai/api/v1/image/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "venice-sd35",
        prompt: "A funny party dog in cool clothes holding a beverage, vibrant colors, party atmosphere, humorous expression, cartoonish style",
        width: 512,
        height: 512,
        seed: seed
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const data = await response.json();

    let imageUrl;
    if (data.images && data.images[0]) {
      imageUrl = `data:image/png;base64,${data.images[0]}`;
    } else {
      throw new Error("No image returned from API");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};