const FW_BASE = "https://api.flutterwave.com/v3";

export function flutterwaveConfig() {
  const secretKey = process.env["FLUTTERWAVE_SECRET_KEY"] ?? "";
  const webhookHash = process.env["FLUTTERWAVE_WEBHOOK_HASH"] ?? "";
  const missing: string[] = [];
  if (!secretKey) missing.push("FLUTTERWAVE_SECRET_KEY");
  if (!webhookHash) missing.push("FLUTTERWAVE_WEBHOOK_HASH");
  return { secretKey, webhookHash, missing, configured: missing.length === 0 };
}

async function fwFetch(path: string, init?: RequestInit) {
  const { secretKey } = flutterwaveConfig();
  const res = await fetch(`${FW_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(json?.message ?? `Flutterwave request failed (${res.status})`);
  }
  return json;
}

export async function createPaymentLink(args: {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  email: string;
  name: string;
  phone?: string;
  title: string;
  description: string;
}): Promise<string> {
  const json = await fwFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: args.txRef,
      amount: args.amount,
      currency: args.currency,
      redirect_url: args.redirectUrl,
      payment_options: "card,mobilemoneyuganda,mobilemoneyghana,banktransfer,ussd",
      customer: { email: args.email, name: args.name, phonenumber: args.phone },
      customizations: { title: args.title, description: args.description },
    }),
  });
  const link = json?.data?.link;
  if (!link) throw new Error("Flutterwave did not return a payment link");
  return link as string;
}

export type FwVerification = {
  status: string;
  amount: number;
  currency: string;
  txRef: string;
  providerTxId: string;
  method: string;
  raw: unknown;
};

export async function verifyByTxRef(txRef: string): Promise<FwVerification> {
  const json = await fwFetch(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`);
  const d = json?.data ?? {};
  return {
    status: String(d.status ?? "failed"),
    amount: Number(d.amount ?? 0),
    currency: String(d.currency ?? "UGX"),
    txRef: String(d.tx_ref ?? txRef),
    providerTxId: String(d.id ?? ""),
    method: String(d.payment_type ?? ""),
    raw: d,
  };
}
