<script setup lang="ts">
import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { sendTestMail } from '../api/modules/mails';
import { saveSystemConfigBatch } from '../api/modules/system';
import { uploadImage } from '../api/modules/upload';
import SystemPageView from './system/SystemPageView.vue';
import { useAdminState } from '../composables/useAdminState';
import { requireEmail, requirePositiveNumber, requireText } from '../utils/validators';
import type { SystemConfigInput } from '../types';

const admin = useAdminState();
const message = useMessage();
const saving = ref(false);
const testingMail = ref(false);
const uploadingLogo = ref(false);

function validateGroup(groupName: string, items: SystemConfigInput[]) {
  const configMap = new Map(items.map((item) => [item.configKey, item.configValue ?? '']));
  if (groupName === '基本设置') {
    const supportEmail = String(configMap.get('SUPPORT_EMAIL') ?? '').trim();
    if (supportEmail) requireEmail(supportEmail, '联系邮箱格式不正确');
    const siteLogo = String(configMap.get('SITE_LOGO') ?? '').trim();
    if (siteLogo && !/^https?:\/\//i.test(siteLogo) && !siteLogo.startsWith('/')) throw new Error('LOGO 地址必须是 http(s) 地址或站内绝对路径');
    return;
  }
  if (groupName !== '邮件服务') return;
  requireText(configMap.get('MAIL_SMTP_HOST'), 'SMTP 主机不能为空');
  requirePositiveNumber(configMap.get('MAIL_SMTP_PORT'), 'SMTP 端口必须大于 0');
  requireText(configMap.get('MAIL_FROM_ADDRESS'), '发件邮箱不能为空');
  requireEmail(configMap.get('MAIL_FROM_ADDRESS'), '发件邮箱格式不正确');
  const replyTo = String(configMap.get('MAIL_REPLY_TO') ?? '').trim();
  if (replyTo) requireEmail(replyTo, '回复地址格式不正确');
}

async function saveGroup(groupName: string, items: SystemConfigInput[]) {
  try {
    validateGroup(groupName, items);
    saving.value = true;
    await saveSystemConfigBatch(items);
    await admin.refreshByRoute('/system');
    admin.flash('配置分组已保存');
    message.success('配置分组已保存');
  } catch (error) {
    const text = error instanceof Error ? error.message : '保存失败';
    admin.flash(text, 'error');
    message.error(text);
    throw error;
  } finally {
    saving.value = false;
  }
}

async function uploadLogo(file: File) {
  try {
    uploadingLogo.value = true;
    const result = await uploadImage(file, 'system');
    const siteLogo = admin.systemConfigs.value.find((item) => item.configKey === 'SITE_LOGO');
    if (siteLogo) siteLogo.configValue = result.url;
    else admin.systemConfigs.value.push({ id: `temp-${Date.now()}`, configKey: 'SITE_LOGO', configValue: result.url, groupName: '基本设置' });
    message.success('LOGO 上传成功');
  } catch (error) {
    const text = error instanceof Error ? error.message : 'LOGO 上传失败';
    message.error(text);
    throw error;
  } finally {
    uploadingLogo.value = false;
  }
}

async function testMail(payload: { toEmail: string; subject: string; content: string }) {
  try {
    requireEmail(payload.toEmail, '测试收件人邮箱格式不正确');
    requireText(payload.subject, '测试邮件标题不能为空');
    requireText(payload.content, '测试邮件内容不能为空');
    testingMail.value = true;
    await sendTestMail(payload);
    admin.flash('测试邮件发送成功');
    message.success('测试邮件发送成功');
  } catch (error) {
    const text = error instanceof Error ? error.message : '测试邮件发送失败';
    admin.flash(text, 'error');
    message.error(text);
    throw error;
  } finally {
    testingMail.value = false;
  }
}
</script>

<template>
  <SystemPageView :loading="saving" :testing-mail="testingMail" :uploading-logo="uploadingLogo" :system-configs="admin.systemConfigs.value" @save-group="saveGroup" @upload-logo="uploadLogo" @test-mail="testMail" />
</template>
