"use client";
import Link from "next/link";
import styles from "./TopNavBar.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/add-job", label: "Add Job" },
  { href: "/dashboard", label: "Saved Jobs" },
  { href: "/files", label: "File Vault" },
];

export default function TopNavBar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Welcome back, Connor!
        </Link>
        <nav className={styles.navlinks}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navlink}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
