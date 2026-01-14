// dog/functions/generate-image.js
// Full file — replace everything with this (for test branch / Dog 2.0)

exports.handler = async (event) => {
  try {
    // Parse incoming body (allow frontend to pass seed if desired)
    let seed = null;
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        seed = parsed.seed;
      } catch {}
    }

    // Force safe seed range (Venice max appears ~999999999)
    if (typeof seed !== 'number' || isNaN(seed) || seed < 0 || seed > 999999999) {
      seed = Math.floor(Math.random() * 1000000000); // 0 to 999999999
    }

    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error("VENICE_API_KEY is not set in Netlify environment variables");
    }

    const response = await fetch("https://api.venice.ai/api/v1/image/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "venice-sd35",  // keeping your current model; change if you want to test others like nano-banana-pro
        prompt: "full body portrait of a funny party dog standing upright, wearing cool stylish clothes and holding a colorful beverage, medium wide shot, entire dog visible from head to paws and tail, wide composition, whole animal in frame, vibrant party atmosphere, humorous expression, cartoonish style, high detail, cute and fun",
        negative_prompt: "cropped, cut off, zoomed in, close-up, head only, face only, partial body, bad framing, limbs missing, tight crop, ugly, deformed, blurry, low quality, watermark, text, overexposed",
        width: 512,
        height: 768,           // ← Changed to portrait (taller) for Dog 2.0
        seed: seed,
        // Optional extras you can tune later (uncomment if desired):
        // steps: 30,              // more steps = better quality but slower
        // guidance_scale: 6.5,    // lower = less rigid prompt following → helps reduce zoom/crop bias
      })
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Venice API returned ${response.status}: ${text || "no details"}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid response from Venice API");
    }

    let imageUrl = null;
    if (data.images && Array.isArray(data.images) && data.images[0]) {
      imageUrl = `data:image/png;base64,${data.images[0]}`;
    } else if (data.url) {
      imageUrl = data.url;
    }

    if (!imageUrl) {
      throw new Error("No image data returned from API");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl })
    };

  } catch (err) {
    console.error("Generation failed:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Failed to generate image" })
    };
  }
};