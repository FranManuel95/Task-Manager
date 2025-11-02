/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 2px 10px rgba(0,0,0,0.06)",
        hover: "0 6px 20px rgba(0,0,0,0.08)",
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#5457ee",
          700: "#4f46e5",
        },
      },
    },
  },
  plugins: [],
};
