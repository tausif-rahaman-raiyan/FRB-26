export default {
  frontend: {
    courseId: 'acs-frb-26',
    apiBaseUrl: 'https://api.example.com',
    completionThreshold: 0.9,
  },
  backend: {
    allowedOrigins: ['https://YOUR_GITHUB_PAGES_DOMAIN'],
    bunny: {
      hostname: 'YOUR_BUNNY_HOSTNAME',
      libraryId: 'YOUR_BUNNY_LIBRARY_ID',
      tokenTtlSeconds: 900,
    },
  },
};
