/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  async rewrites() {
    // La page d'accueil marketing est servie telle quelle depuis /public/landing.html
    return [{ source: "/", destination: "/landing.html" }];
  },
};

module.exports = nextConfig;
