import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        steam: {
          dark: "#0e141b",
          base: "#171d25",
          navy: "#1b2838",
          card: "#1e2a38",
          cardHover: "#253446",
          border: "#2a475e",
          borderHover: "#3d607e",
          blue: "#66c0f4",
          blueDark: "#1999ff",
          text: "#c7d5e0",
          textMuted: "#8f98a0",
          green: "#a4d007",
          greenDark: "#4c6b22",
          accent: "#67c1f5",
          highlight: "#ffc82c",
          danger: "#e74c3c",
        },
      },
      backgroundImage: {
        'steam-gradient': 'linear-gradient(180deg, #1b2838 0%, #171a21 100%)',
        'steam-radial': 'radial-gradient(circle at 50% 0%, #2a475e 0%, #171d25 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(30, 42, 56, 0.9) 0%, rgba(23, 29, 37, 0.9) 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px -5px rgba(102, 192, 244, 0.4)',
        'glow-green': '0 0 20px -5px rgba(164, 208, 7, 0.4)',
        'glow-accent': '0 0 25px -5px rgba(25, 153, 255, 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
