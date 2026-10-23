// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/fonts'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false
  },

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/controle_depense',
    useMemoryDb: process.env.USE_MEMORY_DB === 'true',
    sessionSecret: process.env.SESSION_SECRET || '',
    fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || '',
    public: {
      appName: 'Contrôle des Dépenses',
      currency: 'FCFA'
    }
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
