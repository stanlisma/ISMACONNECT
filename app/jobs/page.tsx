import { permanentRedirect } from "next/navigation";

export default function JobsPage() {
  permanentRedirect("/categories/jobs");
}
