import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import configuration from './config/configuration';
import { SnowflakeModule } from './snowflake/snowflake.module';
import { MetadataModule } from './metadata/metadata.module';

// Root module that wires together Config, MongoDB, Snowflake, and metadata-related modules.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('mongodb.uri');
        return { uri };
      },
    }),

    SnowflakeModule,
    MetadataModule,
  ],
})
export class AppModule { }
