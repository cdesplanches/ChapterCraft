interface D1QueryPayload {
  results: Record<string, unknown>[];
  meta: {
    changes?: number;
    duration?: number;
    last_row_id?: number;
    [key: string]: unknown;
  };
}

class HttpD1PreparedStatement implements D1PreparedStatement {
  constructor(
    private sql: string,
    private params: unknown[],
    private queryFn: (sql: string, params: unknown[]) => Promise<D1QueryPayload>
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new HttpD1PreparedStatement(this.sql, values, this.queryFn);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const res = await this.queryFn(this.sql, this.params);
    const row = res.results?.[0] || null;
    if (row && colName) {
      return (row as Record<string, unknown>)[colName] as T ?? null;
    }
    return row as T | null;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    const res = await this.queryFn(this.sql, this.params);
    return {
      success: true,
      meta: res.meta,
      results: (res.results || []) as T[],
    };
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const res = await this.queryFn(this.sql, this.params);
    return {
      success: true,
      meta: res.meta,
      results: (res.results || []) as T[],
    };
  }
}

export class HttpD1Database implements D1Database {
  constructor(
    private accountId: string,
    private databaseId: string,
    private apiToken: string
  ) {}

  prepare(query: string): D1PreparedStatement {
    return new HttpD1PreparedStatement(query, [], async (sql, params) => {
      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({ sql, params }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`D1 API HTTP error: ${response.status} ${errText}`);
      }

      const json = (await response.json()) as {
        success: boolean;
        errors: unknown[];
        result?: Array<{
          results: Record<string, unknown>[];
          meta: { changes?: number; [key: string]: unknown };
        }>;
      };

      if (!json.success) {
        throw new Error(`D1 API error: ${JSON.stringify(json.errors)}`);
      }

      // The REST API returns an array in "result" representing statements' results.
      // E.g., for a single statement it's result[0]
      return json.result?.[0] || { results: [], meta: { changes: 0 } };
    });
  }
}
