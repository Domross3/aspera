import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#090C14",
        surface: "#111827",
        elevated: "#1C2535",
        accent: "#6C63FF",
        "accent-alt": "#00D4FF",
        "accent-glow": "rgba(108,99,255,0.3)",
        text: "#F0F4FF",
        "text-secondary": "#9BA8C4",
        "text-muted": "#4A5568",
        success: "#34D399",
        warning: "#FBBF24",
        danger: "#F87171",
        border: "rgba(255,255,255,0.08)",
        "border-accent": "rgba(108,99,255,0.4)",
      },
      backgroundImage: {
        "gradient-card": "linear-gradient(135deg, #1C2535, #111827)",
        "gradient-accent": "linear-gradient(135deg, #6C63FF, #4F46E5)",
        "gradient-energy": "linear-gradient(135deg, #F59E0B, #EF4444)",
        "gradient-focus": "linear-gradient(135deg, #6C63FF, #00D4FF)",
        "gradient-success": "linear-gradient(135deg, #10B981, #059669)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        xl: "24px",
        pill: "999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.3)",
        glow: "0 0 16px rgba(108,99,255,0.6)",
        "glow-sm": "0 0 8px rgba(108,99,255,0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
