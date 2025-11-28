import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('mongodbUri');
        if (!uri) {
          throw new Error('MONGODB_URI is not configured. Please set it in your environment.');
        }

        const dbName = configService.get<string>('mongodbDbName') ?? 'bookpro';

        return {
          uri,
          dbName,
          serverSelectionTimeoutMS: 5000,
          connectionFactory: (connection) => {
            // eslint-disable-next-line no-console
            console.log('🚀 Connected to database:', connection.db.databaseName);
            return connection;
          },
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class MongoDbModule {}
