/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}',
    './src/content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      backgroundAttachment: {
        fixed: 'fixed',
        local: 'local',
        scroll: 'scroll',
      },
    },
  },
  plugins: [],
};
