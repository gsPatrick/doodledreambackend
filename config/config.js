require("dotenv").config()

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: "mysql",
    dialectOptions: {
      ssl: process.env.NODE_ENV === "production" ? { require: true } : false,
    },
    logging: console.log,
  },
  test: {
    url: process.env.DATABASE_URL,
    dialect: "mysql",
    dialectOptions: {
      ssl: process.env.NODE_ENV === "production" ? { require: true } : false,
    },
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "mysql",
    dialectOptions: {
      ssl: { 
        require: false,
        rejectUnauthorized: false 
      },
    },
    logging: false,
  },
  jwtSecret: process.env.JWT_SECRET || 'sua_chave_secreta',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  upload: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedFileTypes: ['application/pdf', 'application/zip', 'application/x-zip-compressed'],
    basePath: 'uploads',
    tempDir: 'uploads/temp',
    imageDir: 'uploads/imagens',
    fileDir: 'uploads/arquivos'
  },

  imageProcessing: {
    formats: {
      avif: { quality: 40 },
      webp: { quality: 55 }
    },
    sizes: {
      small: { width: 320, height: 320 },
      medium: { width: 640, height: 640 },
      large: { width: 1280, height: 1280 }
    }
  }
}
