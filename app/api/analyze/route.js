import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || !file.arrayBuffer) {
      return NextResponse.json({ error: 'Brak pliku lub nieprawidłowy format' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());

    const azureEndpoint = process.env.AZURE_ENDPOINT;
    const azureKey = process.env.AZURE_API_KEY;

    const response = await fetch(
      `${azureEndpoint}/vision/v3.2/analyze?visualFeatures=Objects,Description`,
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
      console.error('Azure API Error:', response.status, errorText);
      return NextResponse.json({ error: 'Azure Vision API błąd', details: errorText }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Błąd serwera:', error);
    return NextResponse.json({ error: 'Błąd serwera', details: error.message }, { status: 500 });
  }
}
