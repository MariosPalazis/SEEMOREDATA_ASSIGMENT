import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

import { SnowflakeService, TableMetadata } from '../snowflake/snowflake.service';
import { TableMetadataDocument } from './metadata.schema';
import { SyncResultDto } from './dto/sync-result.dto';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(
    private readonly snowflakeService: SnowflakeService,
    @InjectModel(TableMetadataDocument.name)
    private readonly tableModel: Model<TableMetadataDocument>,
  ) {}

  private computeSignature(table: TableMetadata): string {
    const payload = JSON.stringify({
      database: table.database,
      schema: table.schemaName,
      name: table.name,
      comment: table.comment || '',
      columns: table.columns.map((c) => ({
        name: c.name,
        dataType: c.dataType,
        isNullable: c.isNullable,
        comment: c.comment || '',
        ordinalPosition: c.ordinalPosition,
      })),
    });

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async syncMetadata(): Promise<SyncResultDto> {
    this.logger.log('Starting metadata sync from Snowflake → MongoDB');

    const tables = await this.snowflakeService.fetchAllMetadata();
    this.logger.log(`Fetched ${tables.length} tables from Snowflake`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const table of tables) {
      const signature = this.computeSignature(table);

      const existing = await this.tableModel
        .findOne(
          {
            database: table.database,
            schema: table.schemaName,
            name: table.name,
          },
          { signature: 1 },
        )
        .lean();

      if (existing && existing.signature === signature) {
        skipped++;
        continue;
      }

      const result = await this.tableModel.updateOne(
        {
          database: table.database,
          schema: table.schemaName,
          name: table.name,
        },
        {
          $set: {
            database: table.database,
            schema: table.schemaName,
            name: table.name,
            comment: table.comment || null,
            columns: table.columns,
            signature,
          },
        },
        { upsert: true },
      );

      // result.upsertedCount available in newer Mongo drivers, otherwise infer:
      if (result.upsertedCount && result.upsertedCount > 0) {
        inserted++;
      } else if (result.matchedCount > 0) {
        updated++;
      } else {
        // fallback (shouldn't really happen)
        updated++;
      }
    }

    const summary: SyncResultDto = {
      totalTables: tables.length,
      inserted,
      updated,
      skipped,
    };

    this.logger.log(
      `Sync finished: inserted=${inserted}, updated=${updated}, skipped=${skipped}`,
    );

    return summary;
  }
}
