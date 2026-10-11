import { beforeEach, vi } from "vitest";

type StoredContent = Record<string, unknown> & {
  dayKey: string;
  language: string;
};

const memory = vi.hoisted(() => ({
  rows: new Map<string, StoredContent>(),
  reads: 0,
  insertAttempts: 0,
  duplicates: 0,
  deletes: 0,
  failLanguage: null as string | null,
  failCode: "08006",
}));

export { memory };

// The real database module is never evaluated: no pg pool, credentials, or
// production data are used. Real Drizzle predicates are compiled to parameters.
vi.mock("../db", async () => {
  const { PgDialect } = await import("drizzle-orm/pg-core");
  const { getTableName } = await import("drizzle-orm");
  const dialect = new PgDialect();
  const assertTable = (table: Parameters<typeof getTableName>[0]) => {
    if (getTableName(table) !== "daily_content") {
      throw new Error("Test storage only supports daily_content");
    }
  };
  const database = {
      select: () => ({
        from: (table: Parameters<typeof getTableName>[0]) => {
          assertTable(table);
          return {
            where: async (predicate: Parameters<typeof dialect.sqlToQuery>[0]) => {
              memory.reads++;
              const [dayKey, language] = dialect.sqlToQuery(predicate).params;
              // Snapshot before resolving so concurrent readers can both miss,
              // exercising the generator's unique-conflict recovery.
              const row = memory.rows.get(`${dayKey}|${language}`);
              return row ? [{ ...row }] : [];
            },
          };
        },
      }),
      insert: (table: Parameters<typeof getTableName>[0]) => {
        assertTable(table);
        return {
          values: async (row: StoredContent) => {
            memory.insertAttempts++;
            if (row.language === memory.failLanguage) {
              throw Object.assign(new Error("Isolated storage unavailable"), { code: memory.failCode });
            }
            const key = `${row.dayKey}|${row.language}`;
            if (memory.rows.has(key)) {
              memory.duplicates++;
              throw Object.assign(new Error("Duplicate day/language"), { code: "23505" });
            }
            memory.rows.set(key, { ...row });
          },
        };
      },
      delete: (table: Parameters<typeof getTableName>[0]) => {
        assertTable(table);
        return {
          where: async (predicate: Parameters<typeof dialect.sqlToQuery>[0]) => {
            const query = dialect.sqlToQuery(predicate);
            if (!query.sql.includes('"day_key" = $1 and ')
              || !query.sql.includes('"language" in ($2, $3, $4)')
              || query.params.length !== 4) {
              throw new Error("Repair deletion must filter by day AND content languages");
            }
            memory.deletes++;
            const [dayKey, ...languages] = query.params;
            for (const [key, row] of memory.rows) {
              if (row.dayKey === dayKey && languages.includes(row.language)) {
                memory.rows.delete(key);
              }
            }
          },
        };
      },
  };
  return {
    db: {
      ...database,
      transaction: async (callback: (transaction: typeof database) => Promise<unknown>) => {
        const snapshot = new Map(memory.rows);
        try {
          return await callback(database);
        } catch (error) {
          memory.rows.clear();
          for (const [key, row] of snapshot) memory.rows.set(key, row);
          throw error;
        }
      },
    },
  };
});

beforeEach(() => {
  memory.rows.clear();
  memory.reads = 0;
  memory.insertAttempts = 0;
  memory.duplicates = 0;
  memory.deletes = 0;
  memory.failLanguage = null;
  memory.failCode = "08006";
  // Content comes from local fixtures in this app. Any accidental external
  // generation or Facebook API call fails instead of reaching the network.
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("External services are disabled in devotion regression tests");
  }));
});
