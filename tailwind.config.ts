import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stage: "#090E22",      // near-black navy stage background
        surface: "#111B3E",    // card surface on the stage
        surface2: "#16224E",   // raised surface
        line: "rgba(248,250,252,0.08)",
        beam: "#F8FAFC",       // off-white "light"
        mist: "#98A3C7",       // secondary text, blue-tinted
        brand: {
          DEFAULT: "#3D63F5",  // spotlight blue accent
          light: "#6C8AFF",
          dim: "#233166",
        },
        ink: "#0B1024",        // near-black text for light admin surfaces
        paper: "#F6F7FB",      // editorial page background on the public site
        rule: "#DCE0EC",       // hairline dividers on paper
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 120px 20px rgba(61,99,245,0.25)",
        card: "0 20px 60px -20px rgba(0,0,0,0.5)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        flicker: "flicker 6s ease-in-out infinite",
        rise: "rise 0.6s cubic-bezier(0.16,1,0.3,1) both",
        pop: "pop 0.35s cubic-bezier(0.16,1,0.3,1) both",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
