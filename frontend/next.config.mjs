/** @type {import('next').NextConfig} */
const backendOrigin =
  process.env.API_PROXY_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "http://server2careers.pravarontechnologies.com"
    : "http://localhost:5000");

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;