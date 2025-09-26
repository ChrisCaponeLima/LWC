/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores dos Cards
        'card-azul': '#E0F2FE',
        'card-roxo': '#E6E1FF',
        'card-amarelo': '#EDE5D6',
        'card-verde': '#E3F0E4',
        'card-terracota': '#FFF0EB',
        'card-rosa': '#F8EBFD',
        'card-gelo': '#E6E6EE',
        'card-laranja': '#D78159',

        // Cores das Fontes
        'font-azul': '#9AB3E5',
        'font-roxo': '#B014EA',
        'font-amarelo': '#F3934F',
        'font-verde': '#1DA01C',
        'font-terracota': '#F2350E',
        'font-rosa': '#D7B4B6',
        'font-gelo': '#5D5D5D',
        'font-laranja': '#ffffff',

        // Cores dos Botões
        'btn-principal': '#E9E9FF',
        'btn-secundario': '#070FFC',
        'btn-desativado': '#C7D1E1',

        // Cores das Fontes dos Botões
        'btn-font-principal': '#4845CF',
        'btn-font-secundario': '#ffffff',
        'btn-font-desativado': '#000000',
      }
    },
  },
  plugins: [],
}