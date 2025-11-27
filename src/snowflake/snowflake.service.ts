import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as snowflake from 'snowflake-sdk';

export interface ColumnMetadata {
  name: string;
  dataType: string;
  isNullable: boolean;
  comment?: string | null;
  ordinalPosition: number;
}

export interface TableMetadata {
  database: string;
  schemaName: string;
  name: string;
  comment?: string | null;
  columns: ColumnMetadata[];
}

@Injectable()
export class SnowflakeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SnowflakeService.name);
  private connection: snowflake.Connection;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.connection = snowflake.createConnection({
      account: this.configService.get<string>('snowflake.account')!,
      username: this.configService.get<string>('snowflake.username')!,
      password: this.configService.get<string>('snowflake.password')!,
      role: this.configService.get<string>('snowflake.role')!,
      warehouse: this.configService.get<string>('snowflake.warehouse')!,
    });

    this.connection.connect((err, conn) => {
      if (err) {
        this.logger.error('Failed to connect to Snowflake', err);
        throw err;
      }
      this.logger.log('Connected to Snowflake');
    });
  }

  onModuleDestroy() {
    if (this.connection) {
      this.connection.destroy((err) => {
        if (err) this.logger.error('Error closing Snowflake connection', err);
        else this.logger.log('Snowflake connection closed');
      });
    }
  }

  private execute<T = any>(sql: string, binds: any[] = []): Promise<T[]> {
    this.logger.debug(`Snowflake query: ${sql}`);
    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText: sql,
        binds,
        complete: (err, stmt, rows: any[]) => {
          if (err) return reject(err);
          resolve(rows as T[]);
        },
      });
    });
  }

  /**
   * Fetch all tables & columns in one go using ACCOUNT_USAGE views.
   * Efficient: one big query instead of looping databases/schemas in app code.
   */
  async fetchAllMetadata(): Promise<TableMetadata[]> {
    const limit = Number(process.env.SNOWFLAKE_TABLE_LIMIT || 0);

    const sql = `
  SELECT
    t.table_catalog    AS "DATABASE",
    t.table_schema     AS "SCHEMA",
    t.table_name       AS "TABLE_NAME",
    t.comment          AS "TABLE_COMMENT",
    c.column_name      AS "COLUMN_NAME",
    c.data_type        AS "DATA_TYPE",
    c.is_nullable      AS "IS_NULLABLE",
    c.comment          AS "COLUMN_COMMENT",
    c.ordinal_position AS "ORDINAL_POSITION"
  FROM snowflake.account_usage.tables t
  LEFT JOIN snowflake.account_usage.columns c
    ON c.table_id = t.table_id
  WHERE t.deleted IS NULL
    AND t.table_type = 'BASE TABLE'
  ORDER BY
    t.table_catalog,
    t.table_schema,
    t.table_name,
    c.ordinal_position;
`;


    const rows = await this.execute<{
      DATABASE: string;
      SCHEMA: string;
      TABLE_NAME: string;
      TABLE_COMMENT: string | null;
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
      COLUMN_COMMENT: string | null;
      ORDINAL_POSITION: number;
    }>(sql);

    const tablesMap = new Map<string, TableMetadata>();

    for (const row of rows) {
      const key = `${row.DATABASE}.${row.SCHEMA}.${row.TABLE_NAME}`;

      if (!tablesMap.has(key)) {
        tablesMap.set(key, {
          database: row.DATABASE,
          schemaName: row.SCHEMA,
          name: row.TABLE_NAME,
          comment: row.TABLE_COMMENT,
          columns: [],
        });
      }


      const table = tablesMap.get(key)!;
      table.columns.push({
        name: row.COLUMN_NAME,
        dataType: row.DATA_TYPE,
        isNullable: row.IS_NULLABLE === 'YES',
        comment: row.COLUMN_COMMENT,
        ordinalPosition: row.ORDINAL_POSITION,
      });
    }

    return Array.from(tablesMap.values());
  }
}
