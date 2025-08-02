import "../styles/globals.css";
import TopNavBar from "@/components/TopNavBar";

export const metadata = {
  title: "Internship Tracker",
  description: "Track and manage your internship applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <TopNavBar />
      <body className="bg-slate-900 text-white min-h-screen">{children}</body>
    </html>
  );
}
