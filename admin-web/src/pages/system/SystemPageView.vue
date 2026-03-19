<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  CloudOutline,
  CloudUploadOutline,
  ImageOutline,
  MailOutline,
  PaperPlaneOutline,
  SaveOutline,
  SettingsOutline,
} from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NIcon,
  NImage,
  NInput,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
} from 'naive-ui';
import type { SystemConfig, SystemConfigInput } from '../../types';

const text = {
  title: '系统设置',
  basicTitle: '基本设置',
  basicHint: '基础站点信息会用于后台展示、联系信息和后续前台页面输出。',
  siteName: '站点名称',
  siteUrl: '站点地址',
  siteNotice: '站点公告',
  siteKeywords: '站点关键词',
  siteLogo: 'LOGO 地址',
  siteLogoUpload: '上传 LOGO',
  siteLogoHint: '支持 jpg、png、webp，单张不超过 2MB，也可以直接填写图片地址。',
  supportEmail: '联系邮箱',
  icpNo: '备案号',
  saveBasic: '保存基本设置',
  mailTitle: '邮件服务',
  mailHint: 'SMTP 账号信息通过系统设置保存。',
  cloudflareTitle: 'Cloudflare 验证码',
  cloudflareHint: '这里用于保存 Turnstile 的开关和密钥。',
  smtpHost: 'SMTP 主机',
  smtpPort: 'SMTP 端口',
  smtpSecure: '启用 SSL/TLS',
  smtpUser: 'SMTP 用户名',
  smtpPass: 'SMTP 密码',
  fromAddress: '发件邮箱',
  fromName: '发件人名称',
  replyTo: '回复地址',
  replyToHint: '收件人点击回复时默认回到这个邮箱。',
  testTitle: '测试发送',
  testToEmail: '测试收件人',
  testSubject: '测试标题',
  testContent: '测试内容',
  turnstileEnabled: '启用 Turnstile',
  turnstileSiteKey: '站点 Key',
  turnstileSecretKey: '密钥 Secret',
  enabled: '已启用',
  disabled: '未启用',
  saveMail: '保存邮件服务',
  sendTestMail: '发送测试邮件',
  saveCloudflare: '保存 Cloudflare 配置',
};

const props = defineProps<{
  systemConfigs: SystemConfig[];
  loading: boolean;
  testingMail?: boolean;
  uploadingLogo?: boolean;
}>();

const emit = defineEmits<{
  saveGroup: [groupName: string, items: SystemConfigInput[]];
  testMail: [payload: { toEmail: string; subject: string; content: string }];
  uploadLogo: [file: File];
}>();

const activeTab = ref('basic');
const logoInput = ref<HTMLInputElement | null>(null);

const basicForm = reactive({
  siteName: '',
  siteUrl: '',
  siteNotice: '',
  siteKeywords: '',
  siteLogo: '',
  supportEmail: '',
  icpNo: '',
});

const mailForm = reactive({
  smtpHost: '',
  smtpPort: '465',
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  fromAddress: '',
  fromName: '',
  replyTo: '',
});

const testMailForm = reactive({
  toEmail: '',
  subject: 'SMTP 测试邮件',
  content: '<p>这是一封来自发卡系统后台的 SMTP 测试邮件。</p>',
});

const cloudflareForm = reactive({
  enabled: false,
  siteKey: '',
  secretKey: '',
});

const configMap = computed(
  () => new Map(props.systemConfigs.map((item) => [item.configKey, item.configValue ?? ''])),
);

function parseBoolean(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());
}

function syncForms() {
  basicForm.siteName = configMap.value.get('SITE_NAME') ?? '';
  basicForm.siteUrl = configMap.value.get('SITE_URL') ?? '';
  basicForm.siteNotice = configMap.value.get('SITE_NOTICE') ?? '';
  basicForm.siteKeywords = configMap.value.get('SITE_KEYWORDS') ?? '';
  basicForm.siteLogo = configMap.value.get('SITE_LOGO') ?? '';
  basicForm.supportEmail = configMap.value.get('SUPPORT_EMAIL') ?? '';
  basicForm.icpNo = configMap.value.get('SITE_ICP_NO') ?? '';

  mailForm.smtpHost = configMap.value.get('MAIL_SMTP_HOST') ?? '';
  mailForm.smtpPort = configMap.value.get('MAIL_SMTP_PORT') ?? '465';
  mailForm.smtpSecure = parseBoolean(configMap.value.get('MAIL_SMTP_SECURE'));
  mailForm.smtpUser = configMap.value.get('MAIL_SMTP_USER') ?? '';
  mailForm.smtpPass = configMap.value.get('MAIL_SMTP_PASS') ?? '';
  mailForm.fromAddress = configMap.value.get('MAIL_FROM_ADDRESS') ?? '';
  mailForm.fromName = configMap.value.get('MAIL_FROM_NAME') ?? '';
  mailForm.replyTo = configMap.value.get('MAIL_REPLY_TO') ?? '';

  testMailForm.toEmail = configMap.value.get('MAIL_FROM_ADDRESS') ?? '';

  cloudflareForm.enabled = parseBoolean(configMap.value.get('CLOUDFLARE_TURNSTILE_ENABLED'));
  cloudflareForm.siteKey = configMap.value.get('CLOUDFLARE_TURNSTILE_SITE_KEY') ?? '';
  cloudflareForm.secretKey = configMap.value.get('CLOUDFLARE_TURNSTILE_SECRET_KEY') ?? '';
}

function saveBasicGroup() {
  emit('saveGroup', '基本设置', [
    { configKey: 'SITE_NAME', configValue: basicForm.siteName.trim(), groupName: '基本设置' },
    { configKey: 'SITE_URL', configValue: basicForm.siteUrl.trim(), groupName: '基本设置' },
    { configKey: 'SITE_NOTICE', configValue: basicForm.siteNotice.trim(), groupName: '基本设置' },
    { configKey: 'SITE_KEYWORDS', configValue: basicForm.siteKeywords.trim(), groupName: '基本设置' },
    { configKey: 'SITE_LOGO', configValue: basicForm.siteLogo.trim(), groupName: '基本设置' },
    { configKey: 'SUPPORT_EMAIL', configValue: basicForm.supportEmail.trim(), groupName: '基本设置' },
    { configKey: 'SITE_ICP_NO', configValue: basicForm.icpNo.trim(), groupName: '基本设置' },
  ]);
}

function openLogoPicker() {
  logoInput.value?.click();
}

function handleLogoPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  emit('uploadLogo', file);
  input.value = '';
}

function saveMailGroup() {
  emit('saveGroup', '邮件服务', [
    { configKey: 'MAIL_SMTP_HOST', configValue: mailForm.smtpHost.trim(), groupName: '邮件服务' },
    { configKey: 'MAIL_SMTP_PORT', configValue: mailForm.smtpPort.trim(), groupName: '邮件服务' },
    { configKey: 'MAIL_SMTP_SECURE', configValue: String(mailForm.smtpSecure), groupName: '邮件服务' },
    { configKey: 'MAIL_SMTP_USER', configValue: mailForm.smtpUser.trim(), groupName: '邮件服务' },
    { configKey: 'MAIL_SMTP_PASS', configValue: mailForm.smtpPass, groupName: '邮件服务' },
    { configKey: 'MAIL_FROM_ADDRESS', configValue: mailForm.fromAddress.trim(), groupName: '邮件服务' },
    { configKey: 'MAIL_FROM_NAME', configValue: mailForm.fromName.trim(), groupName: '邮件服务' },
    { configKey: 'MAIL_REPLY_TO', configValue: mailForm.replyTo.trim(), groupName: '邮件服务' },
  ]);
}

function triggerTestMail() {
  emit('testMail', {
    toEmail: testMailForm.toEmail.trim(),
    subject: testMailForm.subject.trim(),
    content: testMailForm.content,
  });
}

function saveCloudflareGroup() {
  emit('saveGroup', 'Cloudflare 验证码', [
    {
      configKey: 'CLOUDFLARE_TURNSTILE_ENABLED',
      configValue: String(cloudflareForm.enabled),
      groupName: 'Cloudflare 验证码',
    },
    {
      configKey: 'CLOUDFLARE_TURNSTILE_SITE_KEY',
      configValue: cloudflareForm.siteKey.trim(),
      groupName: 'Cloudflare 验证码',
    },
    {
      configKey: 'CLOUDFLARE_TURNSTILE_SECRET_KEY',
      configValue: cloudflareForm.secretKey.trim(),
      groupName: 'Cloudflare 验证码',
    },
  ]);
}

watch(
  () => props.systemConfigs,
  () => syncForms(),
  { immediate: true, deep: true },
);
</script>

<template>
  <section class="stack">
    <NCard class="panel-card" :bordered="false">
      <template #header>
        <div class="section-header">
          <h3>{{ text.title }}</h3>
        </div>
      </template>

      <NTabs v-model:value="activeTab" type="line" animated class="settings-tabs">
        <NTabPane name="basic">
          <template #tab>
            <span class="settings-tab-label">
              <NIcon><SettingsOutline /></NIcon>
              {{ text.basicTitle }}
            </span>
          </template>

          <NCard class="settings-group-card" size="small">
            <p class="muted small settings-help">{{ text.basicHint }}</p>
            <div class="form-grid compact">
              <div class="field-block">
                <label>{{ text.siteName }}</label>
                <NInput v-model:value="basicForm.siteName" />
              </div>
              <div class="field-block">
                <label>{{ text.siteUrl }}</label>
                <NInput v-model:value="basicForm.siteUrl" />
              </div>
              <div class="field-block">
                <label>{{ text.supportEmail }}</label>
                <NInput v-model:value="basicForm.supportEmail" />
              </div>
              <div class="field-block">
                <label>{{ text.icpNo }}</label>
                <NInput v-model:value="basicForm.icpNo" />
              </div>
              <div class="field-block">
                <label>{{ text.siteKeywords }}</label>
                <NInput v-model:value="basicForm.siteKeywords" />
              </div>
              <div class="field-block field-block-span-2">
                <label>{{ text.siteLogo }}</label>
                <div class="product-cover-field system-logo-field">
                  <div class="product-cover-preview">
                    <NImage v-if="basicForm.siteLogo" :src="basicForm.siteLogo" width="96" height="96" object-fit="cover" />
                    <div v-else class="product-cover-empty">
                      <NIcon size="24"><ImageOutline /></NIcon>
                    </div>
                  </div>
                  <div class="product-cover-actions">
                    <NButton secondary :loading="uploadingLogo" @click="openLogoPicker">
                      <template #icon>
                        <NIcon><CloudUploadOutline /></NIcon>
                      </template>
                      {{ text.siteLogoUpload }}
                    </NButton>
                    <input ref="logoInput" type="file" accept="image/*" class="hidden-file-input" @change="handleLogoPicked" />
                    <NInput v-model:value="basicForm.siteLogo" :placeholder="text.siteLogo" />
                    <small class="muted">{{ text.siteLogoHint }}</small>
                  </div>
                </div>
              </div>
              <div class="field-block field-block-span-2">
                <label>{{ text.siteNotice }}</label>
                <NInput v-model:value="basicForm.siteNotice" type="textarea" :rows="4" />
              </div>
            </div>
            <div class="modal-actions">
              <NButton type="primary" :loading="loading" @click="saveBasicGroup">
                <template #icon>
                  <NIcon><SaveOutline /></NIcon>
                </template>
                {{ text.saveBasic }}
              </NButton>
            </div>
          </NCard>
        </NTabPane>

        <NTabPane name="mail">
          <template #tab>
            <span class="settings-tab-label">
              <NIcon><MailOutline /></NIcon>
              {{ text.mailTitle }}
            </span>
          </template>

          <NCard class="settings-group-card" size="small">
            <p class="muted small settings-help">{{ text.mailHint }}</p>
            <div class="form-grid compact">
              <div class="field-block">
                <label>{{ text.smtpHost }}</label>
                <NInput v-model:value="mailForm.smtpHost" />
              </div>
              <div class="field-block">
                <label>{{ text.smtpPort }}</label>
                <NInput v-model:value="mailForm.smtpPort" />
              </div>
              <div class="field-block">
                <label>{{ text.smtpUser }}</label>
                <NInput v-model:value="mailForm.smtpUser" />
              </div>
              <div class="field-block">
                <label>{{ text.smtpPass }}</label>
                <NInput v-model:value="mailForm.smtpPass" type="password" show-password-on="click" />
              </div>
              <div class="field-block">
                <label>{{ text.fromAddress }}</label>
                <NInput v-model:value="mailForm.fromAddress" />
              </div>
              <div class="field-block">
                <label>{{ text.fromName }}</label>
                <NInput v-model:value="mailForm.fromName" />
              </div>
              <div class="field-block">
                <label>{{ text.replyTo }}</label>
                <NInput v-model:value="mailForm.replyTo" />
                <span class="muted small">{{ text.replyToHint }}</span>
              </div>
              <div class="field-block">
                <label>{{ text.smtpSecure }}</label>
                <NSpace class="switch-row">
                  <NSwitch v-model:value="mailForm.smtpSecure" />
                  <span class="muted small">{{ mailForm.smtpSecure ? text.enabled : text.disabled }}</span>
                </NSpace>
              </div>
            </div>
            <div class="modal-actions">
              <NButton type="primary" :loading="loading" @click="saveMailGroup">
                <template #icon>
                  <NIcon><SaveOutline /></NIcon>
                </template>
                {{ text.saveMail }}
              </NButton>
            </div>

            <div class="settings-subsection">
              <div class="settings-group-header settings-subheader">
                <span class="settings-group-title">
                  <NIcon><PaperPlaneOutline /></NIcon>
                  {{ text.testTitle }}
                </span>
              </div>
              <div class="form-grid compact">
                <div class="field-block">
                  <label>{{ text.testToEmail }}</label>
                  <NInput v-model:value="testMailForm.toEmail" />
                </div>
                <div class="field-block">
                  <label>{{ text.testSubject }}</label>
                  <NInput v-model:value="testMailForm.subject" />
                </div>
                <div class="field-block field-block-span-2">
                  <label>{{ text.testContent }}</label>
                  <NInput v-model:value="testMailForm.content" type="textarea" :rows="5" />
                </div>
              </div>
              <div class="modal-actions">
                <NButton type="primary" secondary :loading="testingMail" @click="triggerTestMail">
                  <template #icon>
                    <NIcon><PaperPlaneOutline /></NIcon>
                  </template>
                  {{ text.sendTestMail }}
                </NButton>
              </div>
            </div>
          </NCard>
        </NTabPane>

        <NTabPane name="cloudflare">
          <template #tab>
            <span class="settings-tab-label">
              <NIcon><CloudOutline /></NIcon>
              {{ text.cloudflareTitle }}
            </span>
          </template>

          <NCard class="settings-group-card" size="small">
            <p class="muted small settings-help">{{ text.cloudflareHint }}</p>
            <div class="form-grid compact">
              <div class="field-block">
                <label>{{ text.turnstileEnabled }}</label>
                <NSpace class="switch-row">
                  <NSwitch v-model:value="cloudflareForm.enabled" />
                  <span class="muted small">{{ cloudflareForm.enabled ? text.enabled : text.disabled }}</span>
                </NSpace>
              </div>
              <div class="field-block">
                <label>{{ text.turnstileSiteKey }}</label>
                <NInput v-model:value="cloudflareForm.siteKey" />
              </div>
              <div class="field-block">
                <label>{{ text.turnstileSecretKey }}</label>
                <NInput v-model:value="cloudflareForm.secretKey" type="password" show-password-on="click" />
              </div>
            </div>
            <div class="modal-actions">
              <NButton type="primary" :loading="loading" @click="saveCloudflareGroup">
                <template #icon>
                  <NIcon><SaveOutline /></NIcon>
                </template>
                {{ text.saveCloudflare }}
              </NButton>
            </div>
          </NCard>
        </NTabPane>
      </NTabs>
    </NCard>
  </section>
</template>
