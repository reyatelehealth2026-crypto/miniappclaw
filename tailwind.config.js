/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        line: {
          green: "#06C755"
        },
        agent: {
          maestro: "#FFB020",
          visionary: "#9747FF",
          factchecker: "#007AFF",
          storyteller: "#FF3B30",
          visualarch: "#FF2D55",
          coder: "#34C759"
        }
      }
    },
  },
  plugins: [],
}
