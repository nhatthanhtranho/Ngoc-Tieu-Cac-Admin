/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",           // Scan file HTML chính
      "./src/**/*.{js,ts,jsx,tsx}" // Scan toàn bộ file React
    ],
    darkMode: "media", // hoặc "class" nếu bạn muốn toggle bằng class
    theme: {
      extend: {
        colors: {
          background: "var(--background)",
          foreground: "var(--foreground)",
        },
        fontFamily: {
          sans: ["var(--font-sans)", "Arial", "sans-serif"],
          mono: ["var(--font-mono)", "monospace"],
        },
      },
    },
    plugins: [],
  };
  