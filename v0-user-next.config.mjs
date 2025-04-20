/** @type {import('next').NextConfig} */
const nextConfig = {
  // CSS configurations
  css: {
    modules: true,
    sourceMap: true,
    importLoaders: 1,
    localIdentName: '[name]__[local]___[hash:base64:5]'
  },
  // PostCSS configurations
  postcss: {
    plugins: [
      'postcss-flexbugs-fixes',
      [
        'postcss-preset-env',
        {
          autoprefixer: {
            flexbox: 'no-2009'
          },
          stage: 3,
          features: {
            'custom-properties': false
          }
        }
      ]
    ]
  },
  // SASS configurations
  sassOptions: {
    includePaths: ['./styles'],
    prependData: `
      @import "variables.scss";
      @import "mixins.scss";
      @import "theme.scss";
      @import "dark-theme.scss";
    `
  },
  // Webpack configurations for CSS and assets
  webpack: (config, { isServer }) => {
    // Handle CSS modules
    config.module.rules.push({
      test: /\.(css|scss)$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
            modules: {
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [
                'tailwindcss',
                'autoprefixer',
                'postcss-flexbugs-fixes'
              ]
            }
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            additionalData: `
              @import "styles/variables.scss";
              @import "styles/mixins.scss";
              @import "styles/theme.scss";
            `
          }
        }
      ]
    });

    // Handle image and font assets
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
      type: 'asset/resource'
    });

    return config;
  },
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  // Build configurations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // Server configurations
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ];
  },
  // Environment configurations
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_DEFAULT_LOCALE: 'vi'
  }
};

export default nextConfig; 