import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CardService } from './card.service';
import { BatchDeleteCardsDto, CardQueryDto, ImportCardsDto, UpdateCardDto, UpdateCardStatusDto } from './dto/card.dto';

@ApiTags('cards')
@Controller('admin/cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get('bootstrap')
  bootstrapInfo() {
    return this.cardService.bootstrapInfo();
  }

  @Get()
  list(@Query() query: CardQueryDto) {
    return this.cardService.list(query);
  }

  @Post('import')
  import(@Body() payload: ImportCardsDto) {
    return this.cardService.import(payload);
  }

  @Post('batch-delete')
  batchDelete(@Body() payload: BatchDeleteCardsDto) {
    return this.cardService.batchDelete(payload.cardIds);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateCardDto) {
    return this.cardService.update(id, payload);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.cardService.delete(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() payload: UpdateCardStatusDto) {
    return this.cardService.updateStatus(id, payload);
  }
}
