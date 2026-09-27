import type { Metadata } from "next";
import "./globals.css";
import "./app.css";
import "./weather.css";

export const metadata: Metadata = { title: "Svampatlas · Botkyrka", description: "Upptäck, spara och återvänd till dina svampställen." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="sv"><body><a className="skip-link" href="#main-content">Hoppa till innehåll</a>{children}</body></html>;
}
