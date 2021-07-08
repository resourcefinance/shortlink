import axios, { AxiosRequestConfig } from "axios";
import { log } from "./logger";

export async function shortLink(path: string) {
  const baseRedirect = "https://rsrc.co/";
  const endpoint = baseRedirect + "api/url";

  const config: AxiosRequestConfig = {
    method: "POST",
    url: endpoint,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      url: path,
    },
  };

  try {
    const {
      data: {
        data: { id },
      },
    } = await axios(config);

    if (id) return baseRedirect + id;

    return path;
  } catch (e) {
    log.debug("Error generating shortlink: " + e.message);
    log.error(e);
  }
}
