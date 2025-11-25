import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SnowflakeModule } from '../snowflake/snowflake.module';
import { TableMetadataDocument, TableMetadataSchema } from './metadata.schema';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';

@Module({
  imports: [
    SnowflakeModule,
    MongooseModule.forFeature([
      { name: TableMetadataDocument.name, schema: TableMetadataSchema },
    ]),
  ],
  providers: [MetadataService],
  controllers: [MetadataController],
})
export class MetadataModule {}
