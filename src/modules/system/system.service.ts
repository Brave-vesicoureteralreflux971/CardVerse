import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BatchUpsertSystemConfigDto, UpsertSystemConfigDto } from './dto/system-config.dto'

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) { }

  bootstrapInfo() {
    return {
      module: 'system',
      status: 'ready',
      next: ['configs', 'mail templates', 'admin bootstrap'],
    }
  }

  listConfigs() {
    return this.prisma.systemConfig.findMany({
      orderBy: [{ groupName: 'asc' }, { configKey: 'asc' }],
    })
  }

  async publicSiteBootstrap() {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        configKey: {
          in: [
            'SITE_NAME',
            'SITE_URL',
            'SITE_NOTICE',
            'SITE_KEYWORDS',
            'SITE_LOGO',
            'SUPPORT_EMAIL',
            'SITE_ICP_NO',
            'CLOUDFLARE_TURNSTILE_ENABLED',
            'CLOUDFLARE_TURNSTILE_SITE_KEY',
          ],
        },
      },
    })

    const configMap = new Map(
      configs.map((item) => [item.configKey, item.configValue ?? '']),
    )

    return {
      siteName: configMap.get('SITE_NAME') || 'CardVerse Store',
      siteUrl: configMap.get('SITE_URL') || '',
      siteNotice: configMap.get('SITE_NOTICE') || '',
      siteKeywords: configMap.get('SITE_KEYWORDS') || '',
      siteLogo: configMap.get('SITE_LOGO') || '',
      supportEmail: configMap.get('SUPPORT_EMAIL') || '',
      icpNo: configMap.get('SITE_ICP_NO') || '',
      cloudflareTurnstileEnabled: ['1', 'true', 'yes', 'on'].includes(
        (configMap.get('CLOUDFLARE_TURNSTILE_ENABLED') || '').trim().toLowerCase(),
      ),
      cloudflareTurnstileSiteKey:
        configMap.get('CLOUDFLARE_TURNSTILE_SITE_KEY') || '',
    }
  }

  upsertConfig(payload: UpsertSystemConfigDto) {
    return this.prisma.systemConfig.upsert({
      where: { configKey: payload.configKey },
      update: {
        configValue: payload.configValue,
        groupName: payload.groupName,
      },
      create: {
        configKey: payload.configKey,
        configValue: payload.configValue,
        groupName: payload.groupName,
      },
    })
  }

  async batchUpsertConfigs(payload: BatchUpsertSystemConfigDto) {
    await this.prisma.$transaction(
      payload.items.map((item) =>
        this.prisma.systemConfig.upsert({
          where: { configKey: item.configKey },
          update: {
            configValue: item.configValue,
            groupName: item.groupName,
          },
          create: {
            configKey: item.configKey,
            configValue: item.configValue,
            groupName: item.groupName,
          },
        }),
      ),
    )

    return this.listConfigs()
  }
}
