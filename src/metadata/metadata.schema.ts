import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ColumnMetadata } from '../snowflake/snowflake.service';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class Column implements ColumnMetadata {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  dataType: string;

  @Prop({ required: true })
  isNullable: boolean;

  @Prop({ type: String, required: false })
  comment?: string | null;

  @Prop()
  ordinalPosition: number;
}

export const ColumnSchema = SchemaFactory.createForClass(Column);

@Schema({ timestamps: true, collection: 'table_metadata' })
export class TableMetadataDocument extends Document {
  @Prop({ required: true })
  database: string;

  @Prop({ required: true })
  schemaName: string;  

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, required: false })
  comment?: string | null;

  @Prop({ type: [ColumnSchema], _id: false })
  columns: Column[];

  @Prop({ required: true })
  signature: string;
}

export const TableMetadataSchema = SchemaFactory.createForClass(TableMetadataDocument);

TableMetadataSchema.index(
  { database: 1, schemaName: 1, name: 1 }, 
  { unique: true },
);
