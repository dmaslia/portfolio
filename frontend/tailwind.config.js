// tailwind.config.js
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
      {
        pattern: /(bg|text)-(yellow|green|blue|gray|purple|red)-(100|200|300|400|500|600|700|800|900)/,
      },
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
  