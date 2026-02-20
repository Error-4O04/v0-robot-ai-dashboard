/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "fortuitous-annemarie-uncontemning.ngrok-free.dev",
    "localhost:3000",
    "127.0.0.1:3000",
    "26.214.210.32:3000",
  ],
}

export default nextConfig
