exports.handler = async (event) => {
  try {
    // Parse the incoming request body (sent from frontend with { seed })
    const { seed } = JSON.parse(event.body || '{}');

    // Get API key from environment variable (set in Netlify dashboard)
    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      throw new Error('VENICE_API_KEY environment variable is not set');
    }

    // Choose your preferred Venice.ai image model
    // Popular options (check your account / docs for availability):
    // - venice-sd35
    // - nano-banana-pro
    // - flux-dev
    // - lustify-sdxl
    const model = "venice-sd35";  // ← change this if you prefer another model

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
        seed: seed,                  // random seed from frontend for variation
        // Optional parameters you can tune:
        // negative_prompt: "blurry, low quality, deformed, ugly",
        // cfg_scale: 7.5,
        // steps: 30,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Venice API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Venice usually returns base64 images in data.images (array)
    let imageUrl;
    if (data.images && data.images[0]) {
      // Convert base64 to data URL so <img src> can use it directly
      imageUrl = `data:image/png;base64,${data.images[0]}`;
    } else if (data.url) {
      // Fallback if they return a hosted URL instead
      imageUrl = data.url;
    } else {
      throw new Error('Unexpected response format from Venice API - no image found');
    }

    // Return success response to frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl })
    };

  } catch (error) {
    console.error('Function error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};