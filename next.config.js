/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
};

// Allow the local network dev origin to request /_next/* resources during development.
// Adjust the origin and port if your dev server runs on a different port.
const allowedDevOrigins = ["http://192.168.1.27:3000"];

const updatedNextConfig = {
  ...nextConfig,
  allowedDevOrigins,
};

module.exports = updatedNextConfig;
