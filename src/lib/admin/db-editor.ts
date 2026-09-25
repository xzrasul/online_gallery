import { and, asc, count, desc, eq, getTableColumns, type SQL } from 'drizzle-orm';
import { getTableConfig, type PgColumn, type PgTable } from 'drizzle-orm/pg-core';
import type { Db } from '../../db';
import * as schema from '../../db/schema';

// The admin's database editor: every table, every column, as plain forms.
// Values are parsed by column type; empty optional fields become NULL, and
// empty fields with a database default are left to the default on insert.

export const DB_TABLES = {
  users: { table: schema.users, label: 'Пользователи' },
  seller_applications: { table: schema.sellerApplications, label: 'Анкеты продавцов' },
  artworks: { table: schema.artworks, label: 'Картины' },
  categories: { table: schema.categories, label: 'Категории' },
  techniques: { table: schema.techniques, label: 'Техники' },
  artwork_likes: { table: schema.artworkLikes, label: 'Лайки' },
  login_requests: { table: schema.loginRequests, label: 'Запросы входа через бота' },
  home_collage: { table: schema.homeCollage, label: 'Коллаж на главной' },
} satisfies Record<string, { table: PgTable; label: string }>;

export type TableName = keyof typeof DB_TABLES;
export const isTableName = (name: string): name is TableName => Object.hasOwn(DB_TABLES, name);

export type ColumnKind = 'uuid' | 'text' | 'integer' | 'bigint' | 'boolean' | 'timestamp' | 'enum';

export type ColumnInfo = {
  key: string;
  name: string;
  kind: ColumnKind;
  notNull: boolean;
  hasDefault: boolean;
  primary: boolean;
  enumValues?: string[];
  column: PgColumn;
};

function kindOf(column: PgColumn): ColumnKind {
  switch (column.columnType) {
    case 'PgUUID':
      return 'uuid';
    case 'PgInteger':
      return 'integer';
    case 'PgBigInt53':
      return 'bigint';
    case 'PgBoolean':
      return 'boolean';
    case 'PgTimestamp':
      return 'timestamp';
    case 'PgEnumColumn':
      return 'enum';
    default:
      return 'text';
  }
}

export function columnsOf(name: TableName): ColumnInfo[] {
  const table = DB_TABLES[name].table;
  const pk = new Set(getTableConfig(table).primaryKeys.flatMap((k) => k.columns.map((c) => c.name)));
  return Object.entries(getTableColumns(table)).map(([key, column]) => ({
    key,
    name: column.name,
    kind: kindOf(column as PgColumn),
    notNull: column.notNull,
    hasDefault: column.hasDefault,
    primary: column.primary || pk.has(column.name),
    enumValues: (column as PgColumn).enumValues,
    column: column as PgColumn,
  }));
}

export const primaryColumns = (name: TableName) => columnsOf(name).filter((c) => c.primary);

// A row's identity for URLs: its primary key values, in order, as JSON.
export function rowKey(name: TableName, row: Record<string, unknown>): string {
  return JSON.stringify(primaryColumns(name).map((c) => row[c.key]));
}

function whereKey(name: TableName, key: string): SQL {
  let values: unknown;
  try {
    values = JSON.parse(key);
  } catch {
    throw new DbEditError('Неверный ключ записи.');
  }
  const pk = primaryColumns(name);
  if (!Array.isArray(values) || values.length !== pk.length || values.some((v) => typeof v !== 'string' && typeof v !== 'number')) {
    throw new DbEditError('Неверный ключ записи.');
  }
  return and(...pk.map((c, i) => eq(c.column, values[i])))!;
}

export class DbEditError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A form value → a database value. `undefined` means "leave it out".
function parseValue(c: ColumnInfo, raw: FormDataEntryValue | null, inserting: boolean): unknown {
  const text = typeof raw === 'string' ? raw : '';
  if (c.kind === 'boolean') {
    if (text === '') return c.notNull ? (inserting && c.hasDefault ? undefined : false) : null;
    return text === 'true';
  }
  if (c.kind === 'text') {
    if (text !== '') return text;
    if (inserting && c.hasDefault) return undefined;
    return c.notNull ? '' : null;
  }
  if (text.trim() === '') {
    if (inserting && c.hasDefault) return undefined;
    if (!c.notNull) return null;
    throw new DbEditError(`Поле «${c.name}» обязательно.`);
  }
  const value = text.trim();
  switch (c.kind) {
    case 'uuid':
      if (!UUID.test(value)) throw new DbEditError(`«${c.name}»: нужен uuid.`);
      return value.toLowerCase();
    case 'integer':
    case 'bigint': {
      const n = Number(value);
      if (!Number.isSafeInteger(n)) throw new DbEditError(`«${c.name}»: нужно целое число.`);
      if (c.kind === 'integer' && Math.abs(n) > 2147483647) throw new DbEditError(`«${c.name}»: число слишком большое.`);
      return n;
    }
    case 'timestamp': {
      // datetime-local has no zone: the editor shows and reads UTC
      const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
      if (Number.isNaN(d.getTime())) throw new DbEditError(`«${c.name}»: неверная дата.`);
      return d;
    }
    default:
      if (!c.enumValues?.includes(value)) throw new DbEditError(`«${c.name}»: недопустимое значение.`);
      return value;
  }
}

function valuesFromForm(name: TableName, form: FormData, inserting: boolean) {
  const values: Record<string, unknown> = {};
  for (const c of columnsOf(name)) {
    if (!form.has(`f:${c.key}`)) continue;
    const v = parseValue(c, form.get(`f:${c.key}`), inserting);
    if (v !== undefined) values[c.key] = v;
  }
  return values;
}

// Database errors in words the admin can act on.
function explain(error: unknown): never {
  if (error instanceof DbEditError) throw error;
  const cause = (error as { cause?: { code?: string; detail?: string; message?: string } })?.cause ?? (error as { code?: string; detail?: string; message?: string });
  const detail = cause?.detail ? ` (${cause.detail})` : '';
  if (cause?.code === '23503') throw new DbEditError(`Запись связана с другими таблицами${detail}.`);
  if (cause?.code === '23505') throw new DbEditError(`Такое значение уже есть${detail}.`);
  if (cause?.code === '23502') throw new DbEditError(`Не заполнено обязательное поле${detail}.`);
  throw new DbEditError(`Ошибка базы данных: ${cause?.message ?? String(error)}`);
}

export const PAGE_SIZE = 50;

export async function tableCounts(db: Db) {
  const entries = await Promise.all(
    (Object.keys(DB_TABLES) as TableName[]).map(async (name) => {
      const [row] = await db.select({ n: count() }).from(DB_TABLES[name].table);
      return [name, row.n] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<TableName, number>;
}

// Newest first when the table has a creation time, else by primary key.
function orderOf(name: TableName) {
  const cols = columnsOf(name);
  const time = cols.find((c) => ['createdAt', 'submittedAt'].includes(c.key));
  return time ? [desc(time.column)] : primaryColumns(name).map((c) => asc(c.column));
}

export async function listRows(db: Db, name: TableName, page: number) {
  const table = DB_TABLES[name].table;
  const [{ n }] = await db.select({ n: count() }).from(table);
  const rows = (await db
    .select()
    .from(table)
    .orderBy(...orderOf(name))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)) as Record<string, unknown>[];
  return { rows, total: n };
}

export async function getRow(db: Db, name: TableName, key: string) {
  const [row] = (await db.select().from(DB_TABLES[name].table).where(whereKey(name, key))) as Record<string, unknown>[];
  return row;
}

export async function insertRow(db: Db, name: TableName, form: FormData) {
  const values = valuesFromForm(name, form, true);
  try {
    const [row] = (await db.insert(DB_TABLES[name].table).values(values as never).returning()) as Record<string, unknown>[];
    return rowKey(name, row);
  } catch (error) {
    explain(error);
  }
}

export async function updateRow(db: Db, name: TableName, key: string, form: FormData) {
  const values = valuesFromForm(name, form, false);
  if (Object.keys(values).length === 0) return key;
  try {
    const [row] = (await db
      .update(DB_TABLES[name].table)
      .set(values as never)
      .where(whereKey(name, key))
      .returning()) as Record<string, unknown>[];
    if (!row) throw new DbEditError('Запись не найдена.');
    return rowKey(name, row);
  } catch (error) {
    explain(error);
  }
}

export async function deleteRow(db: Db, name: TableName, key: string) {
  try {
    const deleted = await db.delete(DB_TABLES[name].table).where(whereKey(name, key)).returning();
    if (deleted.length === 0) throw new DbEditError('Запись не найдена.');
  } catch (error) {
    explain(error);
  }
}

// How a value shows in the table and in form fields.
export function display(c: ColumnInfo, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 19);
  return String(value);
}
