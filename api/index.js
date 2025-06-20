import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
// import getDemonList from '../getDemonList.js';

const app = express();

app.use(express.json());
app.use(cors());

// Throttle middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Cache logic (serverless функции "стартуют" заново каждый вызов,
// так что кэш тут работать не будет, нужно вынести в глобальный контекст)

// let demonListCache = null;
// const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

// let isLoading = false;
// let loadingPromise = null;

// async function getCachedDemonList() {
//   const now = Date.now();

//   if (!demonListCache || now - demonListCache.timestamp > cacheDuration) {
//     if (!isLoading) {
//       isLoading = true;
//       loadingPromise = (async () => {
//         try {
//           const data = await getDemonList();
//           demonListCache = {
//             data,
//             timestamp: Date.now(),
//           };
//         } finally {
//           isLoading = false;
//         }
//         return demonListCache.data;
//       })();
//     }
//     return loadingPromise;
//   }

//   return demonListCache.data;
// }

app.get('/', async (_req, res) => {
  try {
    const response = await fetch(
      'https://api.demonlist.org/levels/classic?search=&levels_type=all&limit=0'
    ).then((res) => res.json());

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demon list' });
  }
});

// app.get('/list/:id', async (req, res) => {
//   const demonId = req.params.id;
//   try {
//     const list = await getDemonList();
//     const demon = list.find((d) => d.id === parseInt(demonId, 10));
//     if (demon) {
//       res.json(demon);
//     } else {
//       res.status(404).json({ error: 'Demon not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch demon details' });
//   }
// });

// Экспортируем Express как handler для Vercel
export default app;
// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });
