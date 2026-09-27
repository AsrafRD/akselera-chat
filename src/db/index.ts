import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

// Gunakan driver pg native untuk localhost agar tidak terjadi error Websocket,
// Gunakan driver Neon Serverless jika remote (neon.tech)
export const db = isLocal
  ? drizzlePg(new PgPool({ connectionString }), { schema })
  : drizzleNeon(new NeonPool({ connectionString }), { schema });

