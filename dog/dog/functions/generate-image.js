exports.handler = async (event) => {
  try {
    // Parse seed from frontend request (fallback if no body)
    const body = event.body ? JSON.parse(event.body) : {};
    const seed = body.seed || Math.floor(Math.random() * 1000000000); // Fallback random if missing

    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error('Missing VENICE_API_KEY in environment variables');
    }

    // Venice model - change if you prefer another (e.g. "flux-dev", "nano-banana-pro")
    const model = "venice-sd35";

    const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        prompt: 'A funny party dog in cool clothes holding a beverage, vibrant colors, party atmosphere, humorous expression, cartoonish style, high detail, fun pose',
        width: 512,
        height: 512,
        seed: seed,
        // Add these if you want more control (uncomment as needed)
        // negative_prompt: 'blurry, lowres, bad anatomy, deformed, ugly, extra limbs',
        // cfg_scale: 7,
        // steps: 35,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Venice API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    let imageUrl;
    if (data.images && Array.isArray(data.images) && data.images[0]) {
      // Base64 image data (common for Venice)
      imageUrl = `data:image/png;base64,${data.images[0]}`;
    } else if (data.url || data.image_url) {
      // Fallback for URL response
      imageUrl = data.url || data.image_url;
    } else {
      console.error('Unexpected Venice response:', data);
      throw new Error('No image data in API response');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl })
    };
  } catch (error) {
    console.error('Function error:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Server error generating image' })
    };
  }
};