/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Habilitar HMR (Hot Module Replacement / cambios en vivo) en red local desde celulares y otros equipos
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.140',
    '192.168.1.*',
    '192.168.*',
    '*.local',
  ],
};

export default nextConfig;
