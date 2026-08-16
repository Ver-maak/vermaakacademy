import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/flutterwave")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { flutterwaveConfig, verifyByTxRef } = await import("@/lib/flutterwave.server");
        const cfg = flutterwaveConfig();
        if (!cfg.configured) return new Response("Gateway not configured", { status: 503 });

        const signature = request.headers.get("verif-hash");
        if (!signature || signature !== cfg.webhookHash) {
          return new Response("Invalid signature", { status: 401 });
        }

        const body = (await request.json().catch(() => null)) as any;
        const txRef: string | undefined = body?.data?.tx_ref ?? body?.txRef;
        if (!txRef || typeof txRef !== "string" || txRef.length > 200) {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id,user_id,course_id,amount,status,application_id")
          .eq("tx_ref", txRef)
          .maybeSingle();
        if (!order) return new Response("ok");
        if (order.status === "paid") return new Response("ok");

        const v = await verifyByTxRef(txRef);
        const ok = v.status === "successful" && v.amount >= Number(order.amount);

        await supabaseAdmin
          .from("payments")
          .update({
            status: ok ? "paid" : "failed",
            provider_tx_id: v.providerTxId,
            method: v.method,
            verified_at: new Date().toISOString(),
            raw: v.raw as any,
          } as any)
          .eq("tx_ref", txRef);

        if (!ok) {
          await supabaseAdmin.from("orders").update({ status: "failed" } as any).eq("id", order.id);
          return new Response("ok");
        }

        await supabaseAdmin.from("orders").update({ status: "paid" } as any).eq("id", order.id);
        const { data: enrolled } = await supabaseAdmin
          .from("enrolments")
          .select("id")
          .eq("user_id", order.user_id)
          .eq("course_id", order.course_id)
          .maybeSingle();
        if (!enrolled) {
          await supabaseAdmin.from("enrolments").insert({
            user_id: order.user_id,
            course_id: order.course_id,
            order_id: order.id,
            status: "active",
            source: "payment",
          } as any);
        }
        if (order.application_id) {
          await supabaseAdmin.from("applications").update({ status: "enrolled" } as any).eq("id", order.application_id);
        }
        return new Response("ok");
      },
    },
  },
});
