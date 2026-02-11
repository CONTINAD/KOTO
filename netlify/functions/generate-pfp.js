// Starts a Replicate prediction to add a red bandana scarf to an uploaded image
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_TOKEN) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured' }),
        };
    }

    try {
        const { image } = JSON.parse(event.body);

        if (!image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No image provided' }),
            };
        }

        // Use instruct-pix2pix for instruction-based image editing
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REPLICATE_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: '30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f',
                input: {
                    image: image,
                    prompt: 'add a red paisley bandana scarf tied around the neck, keeping everything else exactly the same',
                    num_inference_steps: 50,
                    guidance_scale: 7.5,
                    image_guidance_scale: 1.2,
                },
            }),
        });

        const prediction = await response.json();

        if (prediction.error) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: prediction.error }),
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ id: prediction.id, status: prediction.status }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
