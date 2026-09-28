import Redis from 'ioredis';

const redisUrl = (process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379').replace(/^"|"/g, '').trim();

// Client untuk operasi normal dan publish
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Client khusus untuk subscribe (Pub/Sub Redis memblokir koneksi dari command lain)
export const createSubscriber = () => new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});
