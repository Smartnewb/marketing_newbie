// Vercel Serverless Function for Seedream API Proxy
export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청 처리 (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header required' });
        }

        const response = await fetch('https://ark.ap-southeast.bytepluses.com/api/v3/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Seedream API Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
