import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Serves a profile photo as a real, browser-cacheable image instead of
 * embedding the data URL in every page. URLs carry ?v=<updatedAt> so a new
 * upload busts the cache. (Avatars already appear on the public login screen,
 * and ids are unguessable cuids.)
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  let dataUrl: string | null = null;
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: params.id },
      select: { avatar: true },
    });
    dataUrl = emp?.avatar ?? null;
  } catch {
    dataUrl = null;
  }
  if (!dataUrl?.startsWith("data:image/")) {
    return new Response(null, { status: 404 });
  }
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(5, comma); // e.g. "image/jpeg;base64"
  const mime = meta.split(";")[0] || "image/jpeg";
  const buf = Buffer.from(dataUrl.slice(comma + 1), "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
