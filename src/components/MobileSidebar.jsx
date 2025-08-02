"use client";
import Link from "next/link";
import { useState } from "react";
import styles from "./MobileSidebar.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/add-job", label: "Add Job" },
  { href: "/saved-jobs", label: "Saved Jobs" },
  { href: "/settings", label: "Settings" },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.hamburger} onClick={() => setOpen(true)}>
        ☰
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.sidebar}>
            <button className={styles.close} onClick={() => setOpen(false)}>
              ✕
            </button>
            <nav className={styles.nav}>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={styles.link}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
