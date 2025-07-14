import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "uplifting-blessing-0996862eb9.media.strapiapp.com",
      "localhost",
      "127.0.0.1",
      "htyaopxghuehyomiivsl.supabase.co",
      "https://uplifting-blessing-0996862eb9.strapiapp.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.strapiapp.com",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
