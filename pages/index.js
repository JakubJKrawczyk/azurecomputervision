import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [showTank, setShowTank] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const handleAnalyze = async () => {
    const formData = new FormData();
    formData.append('image', image);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setResult(data);

    const containsTank = JSON.stringify(data).toLowerCase().includes("czołg") || JSON.stringify(data).toLowerCase().includes("tank");
    if (containsTank) {
      setShowTank(true);
      setTimeout(() => setShowTank(false), 8000); // schowaj po animacji
    }
  };

  return (
    <div style={{ padding: '2rem', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <h1>Azure Computer Vision Demo</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleAnalyze}>Analizuj obraz</button>

      {result && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
      )}

      {showTank && (
        <img
          src="/tank.png"
          alt="czołg"
          className={styles.tank}
        />
      )}
    </div>
  );
}