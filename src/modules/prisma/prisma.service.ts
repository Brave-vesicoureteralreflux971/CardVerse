import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'
import { resolveDatabaseUrl } from '../../config/database.config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = resolveDatabaseUrl({
      DB_HOST: configService.get<string>('DB_HOST'),
      DB_PORT: configService.get<string>('DB_PORT'),
      DB_USER: configService.get<string>('DB_USER'),
      DB_PASSWORD: configService.get<string>('DB_PASSWORD'),
      DB_NAME: configService.get<string>('DB_NAME'),
    })

    super(
      databaseUrl
        ? {
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
          }
        : undefined,
    )
  }

  async onModuleInit() {
    await this.$connect()
  }
}
