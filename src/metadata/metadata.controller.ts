import { Controller, Post } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { SyncResultDto } from './dto/sync-result.dto';

@Controller('sync')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Post()
  async sync(): Promise<SyncResultDto> {
    return this.metadataService.syncMetadata();
  }
}
