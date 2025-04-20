/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
          },
        },
        'postcss-loader',
      ],
    });
    return config;
  },
  // Add custom CSS variables
  cssModules: true,
  cssLoaderOptions: {
    importLoaders: 1,
    localIdentName: '[local]___[hash:base64:5]',
  },
  // Add global styles
  globalStyles: `
    :root {
      --background: #000;
      --text: #fff;
      --header-bg: #111;
      --section-bg: #1a1a1a;
      --input-bg: #333;
      --border-color: #555;
    }

    body {
      background-color: var(--background);
      color: var(--text);
      font-family: sans-serif;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      background-color: var(--header-bg);
      padding: 15px 20px;
      margin-bottom: 20px;
    }

    header h1 {
      color: #eee;
      margin: 0;
    }

    nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
    }

    nav li {
      margin-right: 20px;
    }

    nav a {
      color: #ccc;
      text-decoration: none;
    }

    nav a:hover {
      color: #fff;
    }

    section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: var(--section-bg);
      border-radius: 5px;
    }

    section h2 {
      color: #ddd;
      margin-top: 0;
      margin-bottom: 15px;
    }

    input[type="text"],
    input[type="number"],
    select,
    textarea {
      background-color: var(--input-bg);
      color: #eee;
      border: 1px solid var(--border-color);
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 3px;
      width: 100%;
      box-sizing: border-box;
    }

    button {
      background-color: var(--border-color);
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
    }

    button:hover {
      background-color: #777;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th, td {
      border: 1px solid #333;
      padding: 8px;
      text-align: left;
    }

    th {
      background-color: #222;
      color: #fff;
    }

    tr:nth-child(even) {
      background-color: #1e1e1e;
    }

    .nlp-toolkit-header {
      background-color: var(--header-bg);
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }

    .nlp-toolkit-header h1 {
      color: #eee;
      font-size: 2em;
      margin-bottom: 5px;
    }

    .nlp-toolkit-header p {
      color: #ccc;
      font-size: 0.9em;
    }

    .steps-navigation {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .step {
      color: #ccc;
      margin: 0 10px;
      padding: 8px 15px;
      border: 1px solid #333;
      border-radius: 5px;
    }

    .step.active {
      background-color: var(--border-color);
      color: #fff;
    }

    .input-group {
      margin-bottom: 15px;
    }

    .input-group label {
      display: block;
      color: #ccc;
      margin-bottom: 5px;
    }
  `
}; 