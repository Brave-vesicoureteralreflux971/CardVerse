import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderWorkflowService } from './order-workflow.service';

@Module({
  imports: [MailModule],
  controllers: [OrderController],
  providers: [OrderService, OrderWorkflowService],
  exports: [OrderWorkflowService],
})
export class OrderModule {}
