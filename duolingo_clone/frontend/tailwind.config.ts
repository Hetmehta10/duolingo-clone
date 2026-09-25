import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Dark Mode Tokens
        base: "var(--bg)",
        surface: "var(--surface)",
        subtle: "var(--subtle)",
        ink: "var(--ink)",
        inkSoft: "var(--ink-soft)",
        inkFaint: "var(--ink-faint)",
        line: "var(--line)",

        // Brand colors (identical in both themes)
        feather: "#58cc02", // primary green
        mask: "#89e219", // light green accent
        treefrog: "#58a700", // green button shadow / correct text
        seaSponge: "#d7ffb8", // correct feedback bar background
        cardinal: "#ff4b4b", // hearts, wrong
        fireAnt: "#ea2b2b", // wrong text / red button shadow
        walkingFish: "#ffdfe0", // wrong feedback bar background
        fox: "#ff9600", // streak flame
        bee: "#ffc800", // XP, crowns
        macaw: "#1cb0f6", // info, selected state
        blueJay: "#1899d6", // blue button shadow
        iguana: "#ddf4ff", // selected option background
        humpback: "#84d8ff", // selected option border
        beetle: "#ce82ff", // gems

        // Dynamic neutral color aliases bound to CSS variables
        eel: "var(--ink)",
        wolf: "var(--ink-soft)",
        hare: "var(--ink-faint)",
        swan: "var(--line)",
        polar: "var(--subtle)",
        snow: "var(--surface)",
      },
      borderRadius: {
        btn: "12px",
        card: "16px",
        pill: "9999px",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.92)" },
          "50%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-8px)" },
          "40%, 80%": { transform: "translateX(8px)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "slide-up": "slide-up 220ms ease-out",
        pop: "pop 260ms ease-in-out",
        shake: "shake 320ms ease-in-out",
        "bounce-soft": "bounce-soft 1.4s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
