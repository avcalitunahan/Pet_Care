const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  entry: './controllers/auth.js', // Giriş dosyası
  mode: "development",
  output: {
    filename: 'bundle.js', // Çıkış dosyasının adı
    path: path.resolve(__dirname, 'dist'), // Çıkış dosyasının yolu
  },
  plugins: [
    new NodePolyfillPlugin() // node: URI'lerini işlemek için eklenti
  ],
  resolve: {
    fallback: {
      "fs": false,
      "net": false,
      "tls": false,
      "dns": false,
      "dgram": false,
      "node:events": false,
      "node:stream": false,
      "node:url": false,
      "async_hooks": false
    }
  }
};


