import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MailService } from './mail.service';
import { CreateMailTemplateDto, UpdateMailTemplateDto } from './dto/mail-template.dto';
import { SendTestMailDto } from './dto/send-test-mail.dto';

@ApiTags('mail')
@Controller('admin/mail-templates')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('bootstrap')
  bootstrapInfo() {
    return this.mailService.bootstrapInfo();
  }

  @Get()
  list() {
    return this.mailService.listTemplates();
  }

  @Post('test-send')
  testSend(@Body() payload: SendTestMailDto) {
    return this.mailService.sendTestMail(payload.toEmail, payload.subject, payload.content);
  }

  @Post('logs/:id/retry')
  retryLog(@Param('id') id: string) {
    return this.mailService.retryMailLog(id);
  }

  @Post()
  create(@Body() payload: CreateMailTemplateDto) {
    return this.mailService.createTemplate(payload);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateMailTemplateDto) {
    return this.mailService.updateTemplate(id, payload);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mailService.deleteTemplate(id);
  }
}
