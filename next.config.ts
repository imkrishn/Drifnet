/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  generateEtags: false,

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  runtime: "nodejs",

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true, // set to false again after deployment succeeds
  },

  images: {
    domains: [
      "avatars.githubusercontent.com",
      "res.cloudinary.com",
      "images.unsplash.com",
    ],
  },
};

module.exports = nextConfig;
