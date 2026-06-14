/** @type {import('next').NextConfig} */
const nextConfig = {
  // El MVP lee y escribe archivos JSON/TXT en disco en tiempo de ejecución.
  // No queremos prerender estático de las vistas que dependen del filesystem.
  reactStrictMode: true,
};

export default nextConfig;
