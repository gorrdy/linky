const isSafeMintUrl = (value: string): boolean => {
  if (!value) return false;
  if (!/^https?:\/\//i.test(value)) return false;
  if (value.length > 2000) return false;
  return true;
};

const appendChunk = (body: string, chunk?: Uint8Array): string => {
  return body + Buffer.from(chunk ?? []).toString("utf8");
};

interface RequestLike {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  on: (event: "data" | "end", listener: (chunk?: Uint8Array) => void) => void;
}

export default async function handler(
  req: RequestLike,
  res: {
    status: (code: number) => {
      json: (body: Record<string, unknown>) => void;
      send: (body: string) => void;
    };
    setHeader: (name: string, value: string) => void;
  },
) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const rawMint = Array.isArray(req.query?.mint)
      ? req.query.mint[0]
      : req.query?.mint;
    const mint = String(rawMint ?? "").trim();

    if (!isSafeMintUrl(mint)) {
      res.status(400).json({ error: "Invalid mint" });
      return;
    }

    const body = await new Promise<string>((resolve) => {
      let nextBody = "";
      req.on("data", (chunk) => {
        nextBody = appendChunk(nextBody, chunk);
      });
      req.on("end", () => resolve(nextBody));
    });

    const response = await fetch(
      `${mint.replace(/\/+$/, "")}/v1/mint/quote/bolt11`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body,
      },
    );

    const text = await response.text();
    const contentType = response.headers.get("content-type");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    if (contentType) res.setHeader("Content-Type", contentType);

    res.status(response.status).send(text);
  } catch (error) {
    res.status(502).json({
      error: "Proxy fetch failed",
      detail: String(error ?? "unknown"),
    });
  }
}
