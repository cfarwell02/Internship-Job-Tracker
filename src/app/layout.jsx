import "../styles/globals.css";
import TopNavBar from "@/components/TopNavBar";

export const metadata = {
  title: "Internship Tracker",
  description: "Track and manage your internship applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0b1220] text-slate-100 min-h-screen">
        <TopNavBar /> {/* <- ✅ put this inside body */}
        {children}
      </body>
    </html>
  );
}
