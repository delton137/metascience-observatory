/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  images: {
    dangerouslyAllowSVG: true
  }
};

export default nextConfig;

