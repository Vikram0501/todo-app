import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const SCHEMA_PATH = join(process.cwd(), "src", "db", "schema.sql");

let connection: Database.Database | null = null;

function open(path: string): Database.Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const conn = new Database(path);
  conn.pragma("journal_mode = WAL");
  conn.exec(readFileSync(SCHEMA_PATH, "utf-8"));
  return conn;
}

export function getDb(): Database.Database {
  if (!connection) {
    connection = open(process.env.DB_PATH ?? join(process.cwd(), "data", "app.db"));
  }
  return connection;
}

export function resetDb(path: string): Database.Database {
  if (connection) {
    connection.close();
    connection = null;
  }
  connection = open(path);
  return connection;
}
