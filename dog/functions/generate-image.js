exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const seed = typeof body.seed === 'number' ? body.seed : Math.floor(Math.random() * 4294967296);

    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error("VENICE_API_KEY missing in env vars");
    }

    const res = await fetch("https://api.venice.ai/api/v1/image/generate", {
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

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Venice error ${res.status}: ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Bad JSON from Venice: ${text}`);
    }

    let imageUrl = null;
    if (data.images && data.images.length > 0) {
      imageUrl = `data:image/png;base64,${data.images[0]}`;
    }

    if (!imageUrl) {
      throw new Error("No image in response");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl })
    };
  } catch (err) {
    console.error("Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};