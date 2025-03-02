const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port : 8000,
    proxy: {
      '/api': {
        target: 'https://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
