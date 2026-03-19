import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BatchDeleteOrdersDto, BatchResendEmailDto, CreateOrderDto, ManualDeliverOrderDto, OrderListQueryDto, QueryOrderDto } from './dto/order.dto';
import { OrderService } from './order.service';

@ApiTags('orders')
@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('admin/orders/bootstrap')
  bootstrapInfo() {
    return this.orderService.bootstrapInfo();
  }

  @Get('admin/orders')
  list(@Query() query: OrderListQueryDto) {
    return this.orderService.list(query);
  }

  @Post('admin/orders/batch-delete')
  batchDelete(@Body() payload: BatchDeleteOrdersDto) {
    return this.orderService.batchDelete(payload.orderIds);
  }

  @Post('admin/orders/batch-resend-email')
  batchResendEmail(@Body() payload: BatchResendEmailDto) {
    return this.orderService.batchResendEmail(payload.orderIds);
  }

  @Get('admin/orders/query/:orderNo')
  adminQueryByOrderNo(@Param('orderNo') orderNo: string) {
    return this.orderService.adminQueryByOrderNo(orderNo);
  }

  @Get('admin/orders/:id')
  detail(@Param('id') id: string) {
    return this.orderService.detail(id);
  }

  @Post('admin/orders/:id/resend-email')
  resendEmail(@Param('id') id: string) {
    return this.orderService.resendEmail(id);
  }

  @Post('admin/orders/:id/manual-deliver')
  manualDeliver(@Param('id') id: string, @Body() payload: ManualDeliverOrderDto) {
    return this.orderService.manualDeliver(id, payload);
  }

  @Public()
  @Post('orders')
  create(
    @Body() payload: CreateOrderDto,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('x-real-ip') realIp?: string,
  ) {
    const buyerIp = forwardedFor?.split(',')[0]?.trim() ?? realIp;
    return this.orderService.create(payload, buyerIp);
  }

  @Public()
  @Post('orders/:orderNo/query')
  queryByOrderNo(
    @Param('orderNo') orderNo: string,
    @Body() payload: QueryOrderDto,
  ) {
    return this.orderService.queryByOrderNo(orderNo, payload);
  }
}
