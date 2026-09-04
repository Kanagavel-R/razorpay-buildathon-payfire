/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0f19",
        card: "#111827",
        "card-border": "#1f2937",
        primary: {
          DEFAULT: "#ef4444",
          hover: "#dc2626",
          dark: "#991b1b",
        },
        secondary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
        accent: {
          green: "#10b981",
          amber: "#f59e0b",
          purple: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};
