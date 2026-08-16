/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['better-sqlite3', 'sharp'],
    transpilePackages: ['@deepa/shared'],
};

module.exports = nextConfig;
