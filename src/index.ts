// Setup Express
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// Import config.json found next to package.json
import config from '../config.json';
import { getModpackReleases } from './github';
export { config };

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get("/v1/modpackVersions", async (req, res) => {
  try {
    const modpackVersions = await getModpackReleases();

    return res.status(200).send(modpackVersions);
  } catch (e: any) {
    console.error("[ERROR] Failed to get modpack versions: " + e);
    return res.status(500).send("Internal server error: " + e);
  }
});

app.listen(config.port, () => console.log('Server running on port 5000'));