// Chainable, awaitable fake of the Supabase query builder. Every query is
// recorded in `calls`; `respond` decides what each one resolves to.
export type Op = {
  table: string;
  action: "select" | "insert" | "update" | "delete" | "upsert" | "rpc";
  payload?: unknown;
  filters: Array<[string, string, unknown]>;
};

type Result = { data?: unknown; error?: unknown; count?: number };

export function createSupabaseMock(respond: (op: Op) => Result = () => ({ data: null, error: null })) {
  const calls: Op[] = [];

  function builder(table: string) {
    const op: Op = { table, action: "select", filters: [] };
    let recorded = false;
    const record = () => {
      if (!recorded) {
        calls.push(op);
        recorded = true;
      }
    };
    const b: Record<string, unknown> = {};
    const chain = (fn: (...a: unknown[]) => void) => (...a: unknown[]) => {
      fn(...a);
      return b;
    };
    b.select = chain(() => {});
    b.insert = chain((p) => { op.action = "insert"; op.payload = p; });
    b.update = chain((p) => { op.action = "update"; op.payload = p; });
    b.upsert = chain((p) => { op.action = "upsert"; op.payload = p; });
    b.delete = chain(() => { op.action = "delete"; });
    for (const f of ["eq", "neq", "lt", "gt", "gte", "lte", "in", "is", "or", "order", "range", "limit"]) {
      b[f] = chain((col, val) => { op.filters.push([f, String(col), val]); });
    }
    const resolve = () => {
      record();
      return Promise.resolve({ data: null, error: null, ...respond(op) });
    };
    b.single = () => resolve();
    b.maybeSingle = () => resolve();
    b.then = (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => resolve().then(ok, bad);
    return b;
  }

  const client = {
    from: (table: string) => builder(table),
    rpc: (fn: string, args: unknown) => {
      const op: Op = { table: fn, action: "rpc", payload: args, filters: [] };
      calls.push(op);
      return Promise.resolve({ data: null, error: null, ...respond(op) });
    },
  };

  return { client, calls };
}

export const find = (calls: Op[], table: string, action: Op["action"]) =>
  calls.filter((c) => c.table === table && c.action === action);
