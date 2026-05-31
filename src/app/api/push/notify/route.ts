import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const { title, body, url } = await req.json();
  const payload = JSON.stringify({ title, body, url });

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, subscription");

  const results = await Promise.allSettled(
    (subs ?? []).map(async (row) => {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          payload
        );
      } catch (err: unknown) {
        if (err && typeof err === "object" && "statusCode" in err && err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
        }
      }
    })
  );

  return NextResponse.json({ sent: results.length });
}
