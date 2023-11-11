// Setup Express
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mcache from 'memory-cache';

// Import config.json found next to package.json
import config from '../config.json';
import { getModpackReleases } from './releases';
import { getContributors } from './contributors';
export { config };

var cache = (duration: number) => {
  return (req: any, res: any, next: any) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body: any) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
      }
      next()
    }
  }
}

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Cached for 5 minutes - prevent modrinth + github API spam.
app.get("/v1/modpackVersions", cache(5 * 60), async (req, res) => {
  try {
    const modpackVersions = await getModpackReleases();

    return res.status(200).send(modpackVersions);
  } catch (e: any) {
    console.error("[ERROR] Failed to get modpack versions: " + e);
    return res.status(500).send("Internal server error: " + e);
  }
});

app.get("/v1/contributors", cache(5 * 60), async (req, res) => {
  try {
    const contributors = await getContributors();
    return res.status(200).send(contributors);
  } catch (e: any) {
    console.error("[ERROR] Failed to get contributors: " + e);
    return res.status(500).send("Internal server error: " + e);
  }
})

app.listen(config.port, () => console.log('Server running on port ' + config.port));