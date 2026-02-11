// Polls a Replicate prediction for its status and result
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
        const id = event.queryStringParameters?.id;
        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No prediction ID provided' }),
            };
        }

        const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: {
                'Authorization': `Bearer ${REPLICATE_TOKEN}`,
            },
        });

        const prediction = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                id: prediction.id,
                status: prediction.status,
                output: prediction.output || null,
                error: prediction.error || null,
            }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
