export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fs from 'fs';

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Błąd parsowania' });

    const filePath = files.image.filepath;
    const imageBuffer = fs.readFileSync(filePath);

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

    const result = await response.json();
    res.status(200).json(result);
  });
}