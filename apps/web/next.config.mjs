/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the generator + templates as runtime Node externals so they can read their
  // on-disk template files via fs instead of being bundled.
  experimental: {
    serverComponentsExternalPackages: ["@initializr/generator", "@initializr/templates"],
  },
};

export default nextConfig;
