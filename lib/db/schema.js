import { pgTable, text, boolean, integer, serial, bigserial, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  slot: text('slot').notNull().unique(),
  name: text('name').notNull(),
  line: text('line').notNull().default(''),
  place: text('place').notNull().default(''),
  status: text('status').notNull().default('live'),
  color: text('color').notNull().default('#2E86C1'),
  url: text('url').notNull().default(''),
  cta: text('cta').notNull().default('Visit ↗'),
  style: text('style').notNull().default('tower'),
  inTour: boolean('in_tour').notNull().default(true),
  visible: boolean('visible').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const siteContent = pgTable('site_content', {
  id: integer('id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  topic: text('topic').notNull().default(''),
  message: text('message').notNull().default(''),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const events = pgTable('events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
  type: text('type').notNull(),
  product: text('product'),
  path: text('path'),
  referrer: text('referrer'),
  device: text('device'),
  visitor: text('visitor')
}, (t) => ({ tsIdx: index('events_ts_idx').on(t.ts) }));

export const loginTokens = pgTable('login_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
  idHash: text('id_hash').primaryKey(),
  email: text('email').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const activity = pgTable('activity', {
  id: serial('id').primaryKey(),
  ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
  email: text('email').notNull(),
  action: text('action').notNull(),
  detail: text('detail').notNull().default('')
});

// Plain DDL so the app can create its own tables on first run (no migration step needed).
export const DDL = [
  `CREATE TABLE IF NOT EXISTS products (id text PRIMARY KEY, slot text NOT NULL UNIQUE, name text NOT NULL, line text NOT NULL DEFAULT '', place text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'live', color text NOT NULL DEFAULT '#2E86C1', url text NOT NULL DEFAULT '', cta text NOT NULL DEFAULT 'Visit ↗', style text NOT NULL DEFAULT 'tower', in_tour boolean NOT NULL DEFAULT true, visible boolean NOT NULL DEFAULT true, sort integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS site_content (id integer PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS messages (id serial PRIMARY KEY, name text NOT NULL, email text NOT NULL, topic text NOT NULL DEFAULT '', message text NOT NULL DEFAULT '', read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS events (id bigserial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), type text NOT NULL, product text, path text, referrer text, device text, visitor text)`,
  `CREATE INDEX IF NOT EXISTS events_ts_idx ON events (ts)`,
  `CREATE TABLE IF NOT EXISTS login_tokens (token_hash text PRIMARY KEY, email text NOT NULL, expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS sessions (id_hash text PRIMARY KEY, email text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS activity (id serial PRIMARY KEY, ts timestamptz NOT NULL DEFAULT now(), email text NOT NULL, action text NOT NULL, detail text NOT NULL DEFAULT '')`
];
