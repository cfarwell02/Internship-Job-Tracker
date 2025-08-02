import "../styles/globals.css";
import MobileSidebar from "@/components/MobileSideBar";

export const metadata = {
  title: "Internship Tracker",
  description: "Track and manage your internship applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen">
        <MobileSidebar />
        {children}
      </body>
    </html>
  );
}
