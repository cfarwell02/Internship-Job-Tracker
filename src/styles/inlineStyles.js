// src/styles/inlineStyles.js

const textColor = "#1a1a1a";

export const sharedStyles = {
  pageWrapper: {
    padding: "2rem",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
    maxWidth: "1000px",
    margin: "0 auto",
    color: textColor,
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    color: textColor,
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    color: textColor,
    transition: "border 0.2s ease",
  },
  textarea: {
    padding: "0.75rem",
    fontSize: "1rem",
    fontFamily: "inherit",
    borderRadius: "6px",
    border: "1px solid #ccc",
    minHeight: "100px",
    color: textColor,
  },
  buttonPrimary: {
    padding: "0.75rem 1.25rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  buttonDanger: {
    padding: "0.75rem 1.25rem",
    backgroundColor: "#ff4d4d",
    color: "#fff",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    border: "1px solid #eee",
    margin: "0 auto",
    maxWidth: "700px",
  },
};
