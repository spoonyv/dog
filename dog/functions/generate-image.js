const fetch = require('node-fetch');

exports.handler = async (event) => {
    try {
        const { seed } = JSON.parse(event.body);
        const apiKey = process.env.VENICE_API_KEY;

        // Choose your preferred model here!
        // Popular/strong options from Venice docs (as of current info):
        // - "venice-sd35"     → Based on Stable Diffusion 3.5, good balance of quality/speed
        // - "nano-banana-pro" → Photorealism, product shots, fast
        // - "flux-dev" or similar Flux variants → Often very high quality (if available to you)
        // - "lustify-sdxl"    → For more stylized/uncensored/creative outputs
        // Check https://docs.venice.ai/models/image or GET /api/v1/models?type=image for your full list
        const model = "venice-sd35";  // ← Change this to your favorite!

        const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,                  // ← This was missing!
                prompt: 'A funny party dog in cool clothes holding a beverage, vibrant colors, party atmosphere, humorous expression, cartoonish style',
                width: 512,
                height: 512,
                seed: seed,                    // For reproducibility/variation
                // Optional extras you can add/tune:
                // negative_prompt: "blurry, ugly, deformed, low quality",
                // cfg_scale: 7.5,             // Guidance strength (higher = follows prompt more strictly)
                // steps: 30,                  // More steps = better quality, slower
                // style_preset: "Cinematic"   // From /image/styles endpoint
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Venice /image/generate typically returns base64 images in an array
        // Adjust based on actual response shape (check logs if needed)
        let imageUrl;
        if (data.images && data.images[0]) {
            // Base64 → data URL for direct <img> src
            imageUrl = `data:image/png;base64,${data.images[0]}`;
        } else if (data.url) {
            imageUrl = data.url;  // If it returns a hosted URL instead
        } else {
            throw new Error('Unexpected response format from Venice API');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ imageUrl })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal Server Error' })
        };
    }
};