/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = {
  env: {
    AZURE_ENDPOINT: process.env.AZURE_ENDPOINT,
    AZURE_API_KEY: process.env.AZURE_API_KEY,
  },
};