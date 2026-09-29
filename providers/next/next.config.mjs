export default {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Access-Control-Allow-Origin', value: process.env.HOST_ORIGIN || 'http://localhost:4321' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
    ] }];
  },
};
