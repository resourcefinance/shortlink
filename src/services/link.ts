import { PrismaClient } from "@prisma/client";

import { log } from "./logger";

export async function redirect({
  id,
  prisma,
}: {
  id: any;
  prisma: PrismaClient;
}) {
  try {
    const link = await prisma.url.findUnique({ where: { id } });

    if (!link) throw new Error();

    return { link: link.original };
  } catch (e) {
    log.error("Error on redirect shortlink: ", e);
    return { link: null };
  }
}
