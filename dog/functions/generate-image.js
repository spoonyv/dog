exports.handler = async (event) => {
  try {
    // Parse request body safely
    let seed = null;
    if (event.body) {
      const parsed = JSON.parse(event.body);
      seed = parsed.seed;
    }
    // fallback random seed if client didn't send one
    if (typeof seed !== 'number') {
      seed = Math.floor(Math.random() * 4294967296);
    }

    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error("VENICE_API_KEY environment variable is missing");
    }

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
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {}
      throw new Error(`Venice API returned ${response.status}: ${errorBody || "no details"}`);
    }

    const data = await response.json();

    let imageUrl = null;

    if (data.images && Array.isArray(data.images) && data.images[0]) {
      imageUrl = `data:image/png;base64,${data.images[0]}`;
    } else if (data.url) {
      imageUrl = data.url;
    }

    if (!imageUrl) {
      console.log("API response did not contain usable image:", JSON.stringify(data));
      throw new Error("No usable image data in API response");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl })
    };

  } catch (err) {
    console.error("Function failed:", err.message);
    console.error("Full error:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message || "Failed to generate image"
      })
    };
  }
};