import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SystemService } from './system.service';
import { BatchUpsertSystemConfigDto, UpsertSystemConfigDto } from './dto/system-config.dto';

@ApiTags('system')
@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('admin/system/bootstrap')
  bootstrapInfo() {
    return this.systemService.bootstrapInfo();
  }

  @Public()
  @Get('site/bootstrap')
  publicSiteBootstrap() {
    return this.systemService.publicSiteBootstrap();
  }

  @Get('admin/system/configs')
  listConfigs() {
    return this.systemService.listConfigs();
  }

  @Post('admin/system/configs')
  upsertConfig(@Body() payload: UpsertSystemConfigDto) {
    return this.systemService.upsertConfig(payload);
  }

  @Post('admin/system/configs/batch')
  batchUpsertConfigs(@Body() payload: BatchUpsertSystemConfigDto) {
    return this.systemService.batchUpsertConfigs(payload);
  }
}
