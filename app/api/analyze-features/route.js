import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('image');
        // Pobieramy cechy z FormData
        const features = formData.get('features') || ''; // Domyślnie pusty string jeśli brak cech

        if (!file || !file.arrayBuffer) {
            return NextResponse.json({ error: 'Brak pliku lub nieprawidłowy format' }, { status: 400 });
        }

        const imageBuffer = Buffer.from(await file.arrayBuffer());

        const azureEndpoint = process.env.AZURE_ENDPOINT;
        const azureKey = process.env.AZURE_API_KEY;

        if (!azureEndpoint || !azureKey) {
            return NextResponse.json({ error: 'Klucz API lub endpoint Azure nie są skonfigurowane.' }, { status: 500 });
        }

        // Endpoint dla ogólnej analizy z cechami
        const analyzeUrl = `${azureEndpoint}/vision/v3.2/analyze?features=${encodeURIComponent(features)}`;

        const response = await fetch(
            analyzeUrl,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': azureKey,
                    'Content-Type': 'application/octet-stream',
                },
                body: imageBuffer,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Azure Analyze API Error:', response.status, errorText);
            return NextResponse.json({ error: 'Azure Vision API błąd (Analyze)', details: errorText }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error('Błąd serwera (analyze-features):', error);
        return NextResponse.json({ error: 'Błąd serwera', details: error.message }, { status: 500 });
    }
}