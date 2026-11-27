/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        // Allow the 10 MB assignment/challenge upload limit plus multipart overhead.
        serverActions: { bodySizeLimit: '12mb' }
    },
    images: { remotePatterns: [] }
};

export default nextConfig;
