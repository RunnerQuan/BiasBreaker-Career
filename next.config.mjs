import path from "node:path";
import { fileURLToPath } from "node:url";
import webpack from "webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emptyNodeModule = path.resolve(__dirname, "lib/shims/empty-node-module.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        module: false,
        path: false,
        url: false
      };

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(fs|module|path|url)$/, (resource) => {
          resource.request = emptyNodeModule;
        })
      );
    }

    return config;
  }
};

export default nextConfig;
