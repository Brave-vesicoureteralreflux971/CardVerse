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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { ProductService } from './product.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  BatchDeleteProductsDto,
  BatchProductStatusDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

class UpdateStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  status!: boolean;
}

@ApiTags('products')
@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('admin/products/bootstrap')
  bootstrapInfo() {
    return this.productService.bootstrapInfo();
  }

  @Get('admin/product-categories')
  listCategories() {
    return this.productService.listCategories();
  }

  @Post('admin/product-categories')
  createCategory(@Body() payload: CreateCategoryDto) {
    return this.productService.createCategory(payload);
  }

  @Put('admin/product-categories/:id')
  updateCategory(@Param('id') id: string, @Body() payload: UpdateCategoryDto) {
    return this.productService.updateCategory(id, payload);
  }

  @Delete('admin/product-categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.productService.deleteCategory(id);
  }

  @Get('admin/products')
  listProducts(@Query() query: ProductQueryDto) {
    return this.productService.listProducts(query, true);
  }

  @Post('admin/products')
  createProduct(@Body() payload: CreateProductDto) {
    return this.productService.createProduct(payload);
  }

  @Post('admin/products/batch-status')
  batchUpdateStatus(@Body() payload: BatchProductStatusDto) {
    return this.productService.batchUpdateProductStatus(payload.productIds, payload.status);
  }

  @Post('admin/products/batch-delete')
  batchDelete(@Body() payload: BatchDeleteProductsDto) {
    return this.productService.batchDeleteProducts(payload.productIds);
  }

  @Get('admin/products/:id')
  getProduct(@Param('id') id: string) {
    return this.productService.getProduct(id);
  }

  @Put('admin/products/:id')
  updateProduct(@Param('id') id: string, @Body() payload: UpdateProductDto) {
    return this.productService.updateProduct(id, payload);
  }

  @Patch('admin/products/:id/status')
  updateProductStatus(
    @Param('id') id: string,
    @Body() payload: UpdateStatusDto,
  ) {
    return this.productService.updateProductStatus(id, payload.status);
  }

  @Delete('admin/products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }

  @Public()
  @Get('product-categories/public')
  publicListCategories() {
    return this.productService.listPublicCategories();
  }

  @Public()
  @Get('products')
  publicListProducts(@Query() query: ProductQueryDto) {
    return this.productService.listProducts(query, false);
  }

  @Public()
  @Get('products/:slug')
  publicGetProduct(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }
}
