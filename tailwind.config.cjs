/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      container: {
        center: true,
      },
      colors: {
        accent: {
          500: "#ffb586",
        },
      },
    },
    fontFamily: {
      display: ["Titillium Web", "sans-serif"],
      body: ["Rubik", "sans-serif"],
    },
  },
  plugins: [],
};
