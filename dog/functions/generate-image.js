exports.handler = async (event) => {
  try {
    // Parse incoming body safely (frontend sends { seed })
    const body = event.body ? JSON.parse(event.body) : {};
    const seed = body.seed || Math.floor(Math.random() * 4294967296); // fallback random 32-bit seed

    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error('VENICE_API_KEY is missing in Netlify environment variables');
    }

    const model = "venice-sd35"; // Change if you want (e.g., "nano-banana-pro", "flux-dev")

    const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        prompt: 'A funny party dog in cool clothes holding a beverage, vibrant colors, party atmosphere, humorous expression, cartoonish style, high detail',
        width: 512,
        height: 512,
        seed: seed
        // Optional: add negative_prompt, cfg_scale, steps, etc. here
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Venice API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    let imageUrl;
    if (data.images && data.images.length > 0 && data.images[0]) {
      imageUrl = `data:image/png;base64,${data.images[0]}`;
    } else if (data.url || data.image_url) {
      imageUrl = data.url || data.image_url;
    } else {
      throw new Error('No image data in Venice response');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl })
    };
  } catch (error) {
    console.error('Error in generate-image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate image' })
    };
  }
};