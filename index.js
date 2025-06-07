import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import getDemonList from './getDemonList.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Throttle middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Call getDemonList function once a day
let demonListCache = null;
const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

let isLoading = false;
let loadingPromise = null;

async function getCachedDemonList() {
  const now = Date.now();

  if (!demonListCache || now - demonListCache.timestamp > cacheDuration) {
    if (!isLoading) {
      isLoading = true;
      loadingPromise = (async () => {
        try {
          const data = await getDemonList();
          demonListCache = {
            data,
            timestamp: Date.now(),
          };
        } finally {
          isLoading = false;
        }
        return demonListCache.data;
      })();
    }
    return loadingPromise;
  }

  return demonListCache.data;
}

getCachedDemonList();

app.get('/list', async (_req, res) => {
  try {
    const list = await getCachedDemonList();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demon list' });
  }
});

app.get('/list/:id', async (req, res) => {
  const demonId = req.params.id;
  try {
    const list = await getDemonList();
    const demon = list.find((d) => d.id === parseInt(demonId, 10));
    if (demon) {
      res.json(demon);
    } else {
      res.status(404).json({ error: 'Demon not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demon details' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
