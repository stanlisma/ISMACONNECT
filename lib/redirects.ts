import { redirect } from "next/navigation";

export function redirectWithMessage(path: string, key: "error" | "success", message: string): never {
  const [pathname, existingQuery] = path.split("?");
  const searchParams = new URLSearchParams(existingQuery ?? "");
  searchParams.set(key, message);
  const queryString = searchParams.toString();
  redirect(queryString ? `${pathname}?${queryString}` : pathname);
}
