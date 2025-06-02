'use client';
import { useState } from 'react';
// import styles from '../styles/Home.module.css'; // Usuń, jeśli nie używasz stylu dla czołgu
import Image from 'next/image'; // Możemy użyć komponentu Image do wyświetlenia podglądu

// Pełna lista dostępnych cech dla ogólnej analizy
const availableFeatures = [
  'Categories',
  'Tags',
  'Description',
  'Faces',
  'ImageType',
  'Color',
  'Adult',
  'Objects',
  'Brands',
  // 'Read' - 'Read' nie jest cechą w v3.2 analyze, ma swój osobny endpoint
];

export default function Home() {
  const [image, setImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [featuresResult, setFeaturesResult] = useState(null); // Wyniki z Analyze Features
  const [ocrResult, setOcrResult] = useState(null);           // Wyniki z Analyze Read (OCR)
  const [selectedFeatures, setSelectedFeatures] = useState(['Objects', 'Description']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Usunięto logikę showTank/tank.png

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      // Wyczyść poprzednie wyniki i błędy przy wyborze nowego pliku
      setFeaturesResult(null);
      setOcrResult(null);
      setError(null);
    } else {
      setImage(null);
      setImagePreviewUrl(null);
      setFeaturesResult(null);
      setOcrResult(null);
      setError(null);
    }
  };

  const handleFeatureChange = (feature) => {
    setSelectedFeatures((prev) =>
        prev.includes(feature)
            ? prev.filter((f) => f !== feature)
            : [...prev, feature]
    );
  };

  // Funkcja do wywołania analizy cech
  const handleAnalyzeFeatures = async () => {
    if (!image) {
      setError('Proszę wybrać plik obrazu.');
      return;
    }

    setLoading(true);
    setFeaturesResult(null); // Wyczyść tylko wyniki Features
    setOcrResult(null); // Wyczyść wyniki OCR (opcjonalnie, ale często logiczne przy nowej analizie)
    setError(null);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('features', selectedFeatures.join(',')); // Wyślij wybrane cechy

    try {
      // Wywołaj nową trasę API dla analizy cech
      const res = await fetch('/api/analyze-features', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Wystąpił błąd podczas analizy cech.');
        console.error('Features API Error:', data.details);
      } else {
        setFeaturesResult(data); // Ustaw wyniki analizy cech
      }
    } catch (err) {
      setError(`Błąd sieci lub serwera podczas analizy cech: ${err.message}`);
      console.error('Features Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do wywołania analizy OCR (Read API)
  const handleAnalyzeOcr = async () => {
    if (!image) {
      setError('Proszę wybrać plik obrazu.');
      return;
    }

    setLoading(true);
    setFeaturesResult(null); // Wyczyść wyniki Features
    setOcrResult(null);     // Wyczyść tylko wyniki OCR
    setError(null);

    const formData = new FormData();
    formData.append('image', image);
    // API Read nie potrzebuje 'features' w formData

    try {
      // Wywołaj nową trasę API dla analizy OCR
      const res = await fetch('/api/analyze-ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Wystąpił błąd podczas analizy OCR.');
        console.error('OCR API Error:', data.details);
      } else {
        setOcrResult(data); // Ustaw wyniki OCR
        // Struktura wyniku z API Read v3.2 to np. { analyzeResult: { readResult: { pages: [...] } } }
        // Możesz potrzebować dostosować wyświetlanie, aby pokazać tylko readResult
      }
    } catch (err) {
      setError(`Błąd sieci lub serwera podczas analizy OCR: ${err.message}`);
      console.error('OCR Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };


  // Zwolnij zasoby URL podglądu, gdy komponent zostanie odmontowany
  // lub gdy zmienimy obraz
  // useEffect(() => {
  //   return () => {
  //     if (imagePreviewUrl) {
  //       URL.revokeObjectURL(imagePreviewUrl);
  //     }
  //   };
  // }, [imagePreviewUrl]); // Ten hook jest opcjonalny, ale dobry dla czystości


  return (
      <div style={{ padding: '2rem', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
        <h1>Azure AI Vision Demo</h1> {/* Zmieniona nazwa */}

        <input type="file" accept="image/*" onChange={handleFileChange} />

        {imagePreviewUrl && (
            <div style={{ marginTop: '1rem', maxWidth: '500px', maxHeight: '500px', overflow: 'hidden' }}>
              <Image
                  src={imagePreviewUrl}
                  alt="Podgląd wybranego obrazu"
                  width={500}
                  height={500}
                  style={{ width: '100%', height: 'auto' }}
                  unoptimized // Dodaj unoptimized jeśli używasz URL.createObjectURL
              />
            </div>
        )}

        <fieldset style={{ marginTop: '1rem' }}>
          <legend>Wybierz cechy do ogólnej analizy:</legend>
          {availableFeatures.map((feature) => (
              <label key={feature} style={{ marginRight: '1rem' }}>
                <input
                    type="checkbox"
                    value={feature}
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => handleFeatureChange(feature)}
                />
                {feature}
              </label>
          ))}
        </fieldset>

        <div style={{ marginTop: '1rem' }}>
          <button
              onClick={handleAnalyzeFeatures}
              style={{ marginRight: '1rem' }}
              disabled={!image || loading}
          >
            {loading ? 'Analizowanie...' : 'Uruchom analizę cech'}
          </button>
          <button
              onClick={handleAnalyzeOcr}
              disabled={!image || loading}
          >
            {loading ? 'Analizowanie...' : 'Uruchom analizę OCR (tekst)'}
          </button>
        </div>


        {error && (
            <div style={{ color: 'red', marginTop: '1rem' }}>
              Błąd: {error}
            </div>
        )}

        {/* Wyświetlanie wyników analizy cech */}
        {featuresResult && (
            <div style={{ marginTop: '1rem' }}>
              <h2>Wyniki analizy cech:</h2>
              {/* Sprawdzamy czy wyniki Features nie są puste (np. tylko {}) */}
              {Object.keys(featuresResult).length > 0 ? (
                  <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(featuresResult, null, 2)}
                     </pre>
              ) : (
                  <p>Brak szczegółowych wyników dla wybranych cech.</p>
              )}
            </div>
        )}

        {/* Wyświetlanie wyników analizy OCR */}
        {ocrResult && (
            <div style={{ marginTop: '1rem' }}>
              <h2>Wyniki analizy OCR:</h2>
              {/* Sprawdzamy, czy struktura wyników OCR jest poprawna dla v3.2 Read */}
              {/* Wyniki tekstu są w result.analyzeResult.readResult.pages[0].lines */}
              {ocrResult.analyzeResult?.readResult?.pages && ocrResult.analyzeResult.readResult.pages.length > 0 ? (
                  <ul>
                    {ocrResult.analyzeResult.readResult.pages[0].lines.map((line, index) => (
                        <li key={index}>
                          <strong>Tekst:</strong> "{line.text}" <br/>
                          {/* Opcjonalnie: pokaż bounding box */}
                          {/* <strong>Pozycja (bbox):</strong> {line.boundingBox.join(', ')} */}
                        </li>
                    ))}
                  </ul>
              ) : (
                  // Wyświetl cały obiekt JSON, jeśli struktura jest inna lub pusty wynik OCR
                  <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(ocrResult, null, 2)}
                     </pre>
              )}
            </div>
        )}

        {/* Usunięto logikę czołgu */}

      </div>
  );
}