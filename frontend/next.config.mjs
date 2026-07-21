/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://server2careers.pravarontechnologies.com/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
