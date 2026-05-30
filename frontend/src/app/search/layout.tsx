import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Pakistani Laws & Judgments",
  description:
    "Search across Supreme Court judgments, High Court decisions, PPC, CrPC, PECA sections, and legal citations. Free legal research tool for Pakistan.",
  openGraph: {
    title: "Search Pakistani Laws & Judgments | LegalSearch Pakistan",
    description:
      "Search across Supreme Court judgments, High Court decisions, and legal citations. Free legal research tool.",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
