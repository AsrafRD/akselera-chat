import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createSubscriber } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscriber = createSubscriber();
  
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      const channel = `user:${session.userId}:messages`;
      
      await subscriber.subscribe(channel);
      
      subscriber.on("message", (ch, message) => {
        if (ch === channel && !isClosed) {
          try {
            controller.enqueue(`data: ${message}\n\n`);
          } catch (e) {
            isClosed = true;
          }
        }
      });

      const heartbeat = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(`:\n\n`); 
        } catch (e) {
          isClosed = true;
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(heartbeat);
        subscriber.unsubscribe(channel);
        subscriber.quit();
        try {
          controller.close();
        } catch (e) {}
      });
    },
    cancel() {
      subscriber.quit();
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
