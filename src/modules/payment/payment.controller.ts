import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentService } from './payment.service';
import {
  CreatePaymentChannelDto,
  UpdateChannelStatusDto,
  UpdatePaymentChannelDto,
} from './dto/payment-channel.dto';

@ApiTags('payments')
@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('admin/payment-channels/bootstrap')
  bootstrapInfo() {
    return this.paymentService.bootstrapInfo();
  }

  @Get('admin/payment-channels')
  listChannels() {
    return this.paymentService.listChannels();
  }

  @Post('admin/payment-channels')
  createChannel(@Body() payload: CreatePaymentChannelDto) {
    return this.paymentService.createChannel(payload);
  }

  @Put('admin/payment-channels/:id')
  updateChannel(
    @Param('id') id: string,
    @Body() payload: UpdatePaymentChannelDto,
  ) {
    return this.paymentService.updateChannel(id, payload);
  }

  @Delete('admin/payment-channels/:id')
  deleteChannel(@Param('id') id: string) {
    return this.paymentService.deleteChannel(id);
  }

  @Patch('admin/payment-channels/:id/status')
  updateChannelStatus(
    @Param('id') id: string,
    @Body() payload: UpdateChannelStatusDto,
  ) {
    return this.paymentService.updateChannelStatus(id, payload);
  }


  @Public()
  @Get('payment-channels/public')
  publicListChannels() {
    return this.paymentService.listPublicChannels();
  }

  @Public()
  @Post('payments/create/:orderNo')
  createPayment(@Param('orderNo') orderNo: string) {
    return this.paymentService.createPayment(orderNo);
  }

  @Public()
  @Post('payments/notify/:channelCode')
  notify(
    @Param('channelCode') channelCode: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.paymentService.handleNotify(channelCode, payload);
  }

  @Public()
  @Get('payments/return/:channelCode')
  async paymentReturn(
    @Param('channelCode') channelCode: string,
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.paymentService.buildReturnRedirectUrl(
      channelCode,
      query,
    );

    return res.redirect(302, redirectUrl);
  }
}
