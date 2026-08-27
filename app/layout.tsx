import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Certification Learning Roadmap",
  description: "Thabo Pali's certification roadmap — objectives, concepts, and progress tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
