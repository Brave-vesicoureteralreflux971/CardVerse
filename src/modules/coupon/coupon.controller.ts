import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { BatchCouponStatusDto, BatchDeleteCouponsDto, CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@ApiTags('coupons')
@Controller('admin/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('bootstrap')
  bootstrapInfo() {
    return this.couponService.bootstrapInfo();
  }

  @Get()
  list() {
    return this.couponService.list();
  }

  @Post()
  create(@Body() payload: CreateCouponDto) {
    return this.couponService.create(payload);
  }

  @Post('batch-status')
  batchStatus(@Body() payload: BatchCouponStatusDto) {
    return this.couponService.batchUpdateStatus(payload.couponIds, payload.status);
  }

  @Post('batch-delete')
  batchDelete(@Body() payload: BatchDeleteCouponsDto) {
    return this.couponService.batchDelete(payload.couponIds);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateCouponDto) {
    return this.couponService.update(id, payload);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.couponService.delete(id);
  }
}
