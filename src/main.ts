import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { join } from 'path'
import { AppModule } from './app.module'
import { SerializeResponseInterceptor } from './common/interceptors/serialize-response.interceptor'

function collectValidationErrors(
  errors: ValidationError[],
  parent = '',
): Array<{ field: string; messages: string[] }> {
  const items: Array<{ field: string; messages: string[] }> = []

  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property
    const messages = error.constraints ? Object.values(error.constraints) : []

    if (messages.length > 0) {
      items.push({ field, messages })
    }

    if (error.children?.length) {
      items.push(...collectValidationErrors(error.children, field))
    }
  }

  return items
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT') ?? 3000

  app.enableCors()
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const details = collectValidationErrors(errors)
        const messages = details.flatMap((item) => item.messages)

        return new BadRequestException({
          message: messages.length > 0 ? messages : ['请求参数校验失败'],
          error: 'Bad Request',
          fields: details,
        })
      },
    }),
  )
  app.useGlobalInterceptors(new SerializeResponseInterceptor())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CardVerse API')
    .setDescription('Node.js 发卡系统后端接口')
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '管理后台 Token，直接粘贴 JWT 即可，不需要手动补 Bearer 前缀。',
        in: 'header',
      },
      'access-token',
    )
    .addSecurityRequirements('access-token')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(port)
}

bootstrap()
