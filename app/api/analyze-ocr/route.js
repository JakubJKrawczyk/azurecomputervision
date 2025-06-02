import { NextResponse } from 'next/server';

// Funkcja pomocnicza do opóźnienia wykonania
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('image'); // API Read nie potrzebuje 'features'

        if (!file || !file.arrayBuffer) {
            return NextResponse.json({ error: 'Brak pliku lub nieprawidłowy format' }, { status: 400 });
        }

        const imageBuffer = Buffer.from(await file.arrayBuffer());

        const azureEndpoint = process.env.AZURE_ENDPOINT;
        const azureKey = process.env.AZURE_API_KEY;

        if (!azureEndpoint || !azureKey) {
            return NextResponse.json({ error: 'Klucz API lub endpoint Azure nie są skonfigurowane.' }, { status: 500 });
        }

        // Endpoint dla API Read (OCR)
        const readAnalyzeUrl = `${azureEndpoint}/vision/v3.2/read/analyze`;

        // *** Krok 1: Wysyłanie obrazu do analizy (asynchronicznie) ***
        const initialResponse = await fetch(
            readAnalyzeUrl,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': azureKey,
                    'Content-Type': 'application/octet-stream',
                },
                body: imageBuffer,
            }
        );

        if (!initialResponse.ok) {
            const errorText = await initialResponse.text();
            console.error('Azure Read API Initial POST Error:', initialResponse.status, errorText);
            return NextResponse.json({ error: 'Błąd podczas wysyłania obrazu do Azure Read API', details: errorText }, { status: initialResponse.status });
        }

        // *** Krok 2: Pobieranie URL do śledzenia operacji ***
        const operationLocation = initialResponse.headers.get('operation-location');

        if (!operationLocation) {
            console.error('Azure Read API Error: Brak nagłówka operation-location w odpowiedzi.');
            return NextResponse.json({ error: 'Błąd API Azure: Nie otrzymano adresu śledzenia operacji.' }, { status: 500 });
        }

        // *** Krok 3: Odpytywanie (Polling) statusu operacji ***
        const pollingInterval = 1000; // Co ile ms sprawdzać status (1 sekunda)
        const maxPollingAttempts = 30; // Maksymalna liczba prób odpytywania
        let pollingAttempt = 0;
        let result = null;

        while (pollingAttempt < maxPollingAttempts) {
            await sleep(pollingInterval);
            pollingAttempt++;

            const pollingResponse = await fetch(
                operationLocation,
                {
                    method: 'GET',
                    headers: {
                        'Ocp-Apim-Subscription-Key': azureKey,
                    },
                }
            );

            if (!pollingResponse.ok) {
                const errorText = await pollingResponse.text();
                console.error('Azure Read API Polling GET Error:', pollingResponse.status, errorText);
                return NextResponse.json({ error: 'Błąd podczas odpytywania statusu operacji Azure Read API', details: errorText }, { status: pollingResponse.status });
            }

            const pollingResult = await pollingResponse.json();

            if (pollingResult.status === 'succeeded') {
                result = pollingResult; // Wyniki są dostępne
                break;
            } else if (pollingResult.status === 'failed') {
                console.error('Azure Read API Operation Failed:', pollingResult);
                // Zwróć szczegóły błędu z pollingResult.error
                return NextResponse.json({ error: 'Operacja Azure Read API zakończyła się niepowodzeniem.', details: pollingResult.error }, { status: 500 });
            }
            // Jeśli status to 'notStarted' lub 'running', kontynuuj
        }

        // Sprawdź, czy udało się uzyskać wynik przed timeoutem
        if (!result) {
            return NextResponse.json({ error: 'Timeout podczas oczekiwania na wyniki z Azure Read API.' }, { status: 504 }); // Gateway Timeout
        }

        // *** Krok 4: Zwracanie wyników OCR ***
        // Zwracamy cały obiekt wynikowy, który zawiera analyzeResult.readResult
        return NextResponse.json(result); // Zwracamy cały obiekt 'result'

    } catch (error) {
        console.error('Błąd serwera (analyze-ocr):', error);
        return NextResponse.json({ error: 'Błąd serwera', details: error.message }, { status: 500 });
    }
}