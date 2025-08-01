// /src/app/layout.jsx
import "@/styles/globals.css";

export const metadata = {
  title: "Internship Tracker",
  description: "Track your job applications with ease",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* You can add <Navbar /> here later */}
        {children}
      </body>
    </html>
  );
}
