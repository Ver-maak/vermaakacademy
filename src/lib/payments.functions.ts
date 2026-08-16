import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const applicationSchema = z.object({
  courseId: z.string().uuid(),
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  country: z.string().min(2).max(80),
  city: z.string().min(1).max(80),
  gender: z.string().max(40).default(""),
  organisation: z.string().max(160).default(""),
  occupation: z.string().max(160).default(""),
  motivation: z.string().min(10).max(4000),
  heard_from: z.string().max(160).default(""),
  agreed_terms: z.literal(true),
});

/** Integration status for the admin panel — no secret values are ever returned. */
export const getPaymentGatewayStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Not authorized");
    const { flutterwaveConfig } = await import("./flutterwave.server");
    const cfg = flutterwaveConfig();
    return {
      provider: "flutterwave",
      configured: cfg.configured,
      missing: cfg.missing,
      publicKeySet: !!process.env["VITE_FLUTTERWAVE_PUBLIC_KEY"],
    };
  });

/** Creates (or reuses) an application + pending order for a course. */
export const createEnrolmentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => applicationSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: course, error: cErr } = await supabaseAdmin
      .from("courses")
      .select("id,title,price_ugx,discount_price_ugx,currency,course_type,published,archived_at")
      .eq("id", data.courseId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!course || !course.published || course.archived_at) throw new Error("Course is not available for enrolment");

    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        city: data.city,
        gender: data.gender,
        organisation: data.organisation,
        occupation: data.occupation,
        heard_from: data.heard_from,
      } as any,
      { onConflict: "id" },
    );

    const { data: existing } = await supabaseAdmin
      .from("enrolments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", data.courseId)
      .in("status", ["active", "completed"])
      .maybeSingle();
    if (existing) return { alreadyEnrolled: true as const, orderId: null, amount: 0 };

    const { data: application, error: aErr } = await supabaseAdmin
      .from("applications")
      .insert({
        user_id: userId,
        course_id: data.courseId,
        status: "submitted",
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        city: data.city,
        gender: data.gender,
        organisation: data.organisation,
        occupation: data.occupation,
        motivation: data.motivation,
        heard_from: data.heard_from,
        agreed_terms: true,
      } as any)
      .select("id")
      .single();
    if (aErr) throw new Error(aErr.message);

    const amount = Number(course.discount_price_ugx ?? course.price_ugx ?? 0);
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderNumber = `VA-${new Date().getFullYear()}-${suffix}`;
    const txRef = `va_${orderNumber.toLowerCase().replace(/-/g, "_")}_${Date.now()}`;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        tx_ref: txRef,
        user_id: userId,
        course_id: data.courseId,
        application_id: application.id,
        amount,
        currency: course.currency ?? "UGX",
        status: amount === 0 ? "paid" : "pending",
      } as any)
      .select("id,amount")
      .single();
    if (oErr) throw new Error(oErr.message);

    if (amount === 0) {
      await supabaseAdmin.from("enrolments").insert({
        user_id: userId,
        course_id: data.courseId,
        order_id: order.id,
        status: "active",
        source: "free",
      } as any);
      await supabaseAdmin.from("applications").update({ status: "enrolled" } as any).eq("id", application.id);
    }

    return { alreadyEnrolled: false as const, orderId: order.id as string, amount };
  });

/** Starts a Flutterwave hosted checkout for a pending order. */
export const startFlutterwaveCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid(), origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { flutterwaveConfig, createPaymentLink } = await import("./flutterwave.server");
    const cfg = flutterwaveConfig();
    if (!cfg.configured) {
      throw new Error(`Payments are not configured yet. Missing: ${cfg.missing.join(", ")}`);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,tx_ref,amount,currency,status,user_id,course_id,courses(title)")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.user_id !== userId) throw new Error("Order not found");
    if (order.status === "paid") return { link: null, alreadyPaid: true as const };

    const { data: profile } = await supabaseAdmin.from("profiles").select("full_name,email,phone").eq("id", userId).maybeSingle();
    const title = (order as any).courses?.title ?? "Vermaak Academy course";

    const link = await createPaymentLink({
      txRef: order.tx_ref,
      amount: Number(order.amount),
      currency: order.currency ?? "UGX",
      redirectUrl: `${data.origin}/payment/status?tx_ref=${encodeURIComponent(order.tx_ref)}`,
      email: profile?.email ?? "",
      name: profile?.full_name ?? "Learner",
      phone: profile?.phone ?? undefined,
      title: "Vermaak Academy",
      description: `Enrolment · ${title}`,
    });

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      user_id: userId,
      provider: "flutterwave",
      tx_ref: order.tx_ref,
      amount: Number(order.amount),
      currency: order.currency ?? "UGX",
      status: "pending",
    } as any);

    return { link, alreadyPaid: false as const };
  });

/** Verifies a transaction with Flutterwave and grants access when successful. */
export const verifyPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ txRef: z.string().min(4).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,user_id,course_id,amount,status,application_id,courses(title)")
      .eq("tx_ref", data.txRef)
      .maybeSingle();
    if (!order || order.user_id !== userId) throw new Error("Order not found");
    if (order.status === "paid") return { status: "paid" as const, courseId: order.course_id };

    const { flutterwaveConfig, verifyByTxRef } = await import("./flutterwave.server");
    if (!flutterwaveConfig().configured) return { status: "unconfigured" as const, courseId: order.course_id };

    const v = await verifyByTxRef(data.txRef);
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
      .eq("tx_ref", data.txRef);

    if (!ok) {
      await supabaseAdmin.from("orders").update({ status: "failed" } as any).eq("id", order.id);
      return { status: "failed" as const, courseId: order.course_id };
    }

    await supabaseAdmin.from("orders").update({ status: "paid" } as any).eq("id", order.id);
    const { data: enrolled } = await supabaseAdmin
      .from("enrolments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", order.course_id)
      .maybeSingle();
    if (!enrolled) {
      await supabaseAdmin.from("enrolments").insert({
        user_id: userId,
        course_id: order.course_id,
        order_id: order.id,
        status: "active",
        source: "payment",
      } as any);
    }
    if (order.application_id) {
      await supabaseAdmin.from("applications").update({ status: "enrolled" } as any).eq("id", order.application_id);
    }
    return { status: "paid" as const, courseId: order.course_id };
  });
