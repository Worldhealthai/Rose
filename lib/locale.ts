import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./i18n";

export function getLocale(): Locale {
  return cookies().get(LOCALE_COOKIE)?.value === "fa" ? "fa" : "en";
}
