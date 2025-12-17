export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME ?? 'bookpro',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  waToken: process.env.WA_TOKEN,
  waPhoneNumberId: process.env.WA_PHONE_NUMBER_ID,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
});
