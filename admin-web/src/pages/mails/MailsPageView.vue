<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  AddOutline,
  CheckmarkCircleOutline,
  CloseOutline,
  CreateOutline,
  DocumentTextOutline,
  MailOpenOutline,
} from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NIcon,
  NInput,
  NModal,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NTable,
  NTag,
} from 'naive-ui';
import ConfirmActionButton from '../../components/common/ConfirmActionButton.vue';
import TablePager from '../../components/TablePager.vue';
import type { MailTemplate } from '../../types';
import {
  mailEventCodeMap,
  mailEventOptions,
  mapCodeLabel,
  orderTemplateVariables,
} from '../../utils/dicts';

const text = {
  title: '邮件模板',
  create: '创建模板',
  search: '搜索名称 / 事件码 / 标题',
  empty: '暂无邮件模板',
  name: '名称',
  eventCode: '事件码',
  eventHint: '选择一个邮件事件',
  subject: '标题',
  content: '内容',
  status: '状态',
  actions: '操作',
  enabled: '启用',
  disabled: '禁用',
  edit: '编辑',
  remove: '删除',
  removeConfirm: '确认删除这个邮件模板吗？',
  editTitle: '编辑邮件模板',
  createTitle: '创建邮件模板',
  variables: '订单变量',
  variablesHint: '点击变量卡片可插入到当前目标字段。',
  presets: '默认模板',
  presetHint: '根据事件码快速填充一套默认标题和正文。',
  applyPreset: '填充默认模板',
  insertToSubject: '插入标题',
  insertToContent: '插入内容',
  currentTarget: '当前插入目标',
  cancel: '取消',
  save: '保存模板',
};

const props = defineProps<{
  loading: boolean;
  editingMailId: string;
  saveVersion: number;
  mailTemplates: MailTemplate[];
}>();

const mailForm = defineModel<any>('mailForm', { required: true });
const emit = defineEmits<{
  saveMail: [];
  editMail: [item: MailTemplate];
  toggleMail: [item: MailTemplate];
  deleteMail: [id: string];
  resetMail: [];
}>();

const presetMap: Record<string, { subject: string; content: string }> = {
  ORDER_PAID: {
    subject: '订单支付通知：{{orderNo}}',
    content: [
      '<p>你好，{{email}}：</p>',
      '<p>你的订单 <strong>{{orderNo}}</strong> 已支付成功，我们已收到款项。</p>',
      '<p>商品名称：{{productName}}</p>',
      '<p>购买数量：{{quantity}}</p>',
      '<p>支付金额：{{payPrice}}</p>',
      '<p>支付时间：{{paidAt}}</p>',
      '<p>查询密码：{{queryPassword}}</p>',
      '<p>查询链接：<a href="{{orderQueryUrl}}" target="_blank">{{orderQueryUrl}}</a></p>',
      '<p>后续发货状态请以站内订单或后续邮件通知为准。</p>',
    ].join('\n'),
  },
  ORDER_DELIVERED: {
    subject: '订单发货通知：{{orderNo}}',
    content: [
      '<p>你好，{{email}}：</p>',
      '<p>你的订单 <strong>{{orderNo}}</strong> 已发货完成。</p>',
      '<p>商品名称：{{productName}}</p>',
      '<p>发货方式：{{deliveryType}}</p>',
      '<p>发货时间：{{deliveredAt}}</p>',
      '<p>查询密码：{{queryPassword}}</p>',
      '<p>查询链接：<a href="{{orderQueryUrl}}" target="_blank">{{orderQueryUrl}}</a></p>',
      '<p>卡密信息如下：</p>',
      '<pre>{{cardList}}</pre>',
    ].join('\n'),
  },
  ORDER_RESEND: {
    subject: '订单补发通知：{{orderNo}}',
    content: [
      '<p>你好，{{email}}：</p>',
      '<p>这是订单 <strong>{{orderNo}}</strong> 的补发邮件。</p>',
      '<p>商品名称：{{productName}}</p>',
      '<p>实际支付：{{payPrice}}</p>',
      '<p>查询密码：{{queryPassword}}</p>',
      '<p>查询链接：<a href="{{orderQueryUrl}}" target="_blank">{{orderQueryUrl}}</a></p>',
      '<p>卡密信息如下：</p>',
      '<pre>{{cardList}}</pre>',
    ].join('\n'),
  },
};

const keyword = ref('');
const page = ref(1);
const pageSize = ref(10);
const modalVisible = ref(false);
const insertTarget = ref<'subject' | 'content'>('content');
const expandedPanels = ref<string[]>([]);

const filteredTemplates = computed(() =>
  props.mailTemplates.filter(
    (item) =>
      !keyword.value ||
      [item.name, item.eventCode, item.subject].some((value) =>
        value.toLowerCase().includes(keyword.value.toLowerCase()),
      ),
  ),
);

const pagedTemplates = computed(() =>
  filteredTemplates.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
);

const activePreset = computed(() =>
  mailForm.value?.eventCode ? presetMap[mailForm.value.eventCode] : undefined,
);

function openCreate() {
  emit('resetMail');
  insertTarget.value = 'content';
  expandedPanels.value = [];
  modalVisible.value = true;
}

function openEdit(item: MailTemplate) {
  emit('editMail', item);
  insertTarget.value = 'content';
  expandedPanels.value = [];
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
  expandedPanels.value = [];
  emit('resetMail');
}

function submit() {
  emit('saveMail');
}

function renderEventCode(value?: string) {
  return mapCodeLabel(value, mailEventCodeMap);
}

function insertVariable(token: string, target: 'subject' | 'content') {
  insertTarget.value = target;
  const currentValue = String(mailForm.value[target] ?? '');
  mailForm.value[target] = currentValue ? `${currentValue}${token}` : token;
}

function applyPreset() {
  if (!activePreset.value) return;
  mailForm.value.subject = activePreset.value.subject;
  mailForm.value.content = activePreset.value.content;
}

watch(
  () => props.saveVersion,
  (value, previous) => {
    if (value !== previous && value > 0) {
      closeModal();
    }
  },
);
</script>

<template>
  <section class="stack">
    <NCard class="panel-card" :bordered="false">
      <template #header>
        <div class="section-header">
          <h3>{{ text.title }}</h3>
          <NButton type="primary" @click="openCreate">
            <template #icon>
              <NIcon><AddOutline /></NIcon>
            </template>
            {{ text.create }}
          </NButton>
        </div>
      </template>

      <div class="toolbar">
        <NInput v-model:value="keyword" :placeholder="text.search" />
      </div>

      <NEmpty v-if="!filteredTemplates.length" :description="text.empty" class="empty-block" />
      <template v-else>
        <NTable striped>
          <thead>
            <tr>
              <th>{{ text.name }}</th>
              <th>{{ text.eventCode }}</th>
              <th>{{ text.subject }}</th>
              <th>{{ text.status }}</th>
              <th>{{ text.actions }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pagedTemplates" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ renderEventCode(item.eventCode) }}</td>
              <td>{{ item.subject }}</td>
              <td>
                <NTag :type="item.status ? 'success' : 'default'">
                  {{ item.status ? text.enabled : text.disabled }}
                </NTag>
              </td>
              <td>
                <NSpace class="row-actions" size="small">
                  <NButton class="table-action-button" size="small" tertiary @click="openEdit(item)">
                    <template #icon>
                      <NIcon><CreateOutline /></NIcon>
                    </template>
                    {{ text.edit }}
                  </NButton>
                  <NButton class="table-action-button" size="small" quaternary @click="emit('toggleMail', item)">
                    <template #icon>
                      <NIcon><CheckmarkCircleOutline /></NIcon>
                    </template>
                    {{ item.status ? text.disabled : text.enabled }}
                  </NButton>
                  <ConfirmActionButton :label="text.remove" :message="text.removeConfirm" @confirm="emit('deleteMail', item.id)" />
                </NSpace>
              </td>
            </tr>
          </tbody>
        </NTable>
        <TablePager v-model:page="page" v-model:page-size="pageSize" :total="filteredTemplates.length" />
      </template>
    </NCard>

    <NModal
      :show="modalVisible"
      preset="card"
      :title="editingMailId ? text.editTitle : text.createTitle"
      class="inline-modal inline-modal-wide"
      @update:show="!$event && closeModal()"
    >
      <div class="form-grid compact">
        <div class="field-block">
          <label>{{ text.name }}</label>
          <NInput v-model:value="mailForm.name" />
        </div>
        <div class="field-block">
          <label>{{ text.eventCode }}</label>
          <NSelect v-model:value="mailForm.eventCode" :options="mailEventOptions" :placeholder="text.eventHint" />
        </div>
        <div class="field-block">
          <label>{{ text.subject }}</label>
          <NInput v-model:value="mailForm.subject" />
        </div>
      </div>

      <div class="field-block">
        <label>{{ text.content }}</label>
        <NInput v-model:value="mailForm.content" type="textarea" :autosize="{ minRows: 5, maxRows: 8 }" />
      </div>

      <NCollapse v-model:expanded-names="expandedPanels" accordion class="template-collapse">
        <NCollapseItem name="preset" :title="text.presets">
          <NAlert type="info" :bordered="false" class="template-panel-alert">{{ text.presetHint }}</NAlert>
          <div class="modal-actions template-preset-actions">
            <NButton type="primary" secondary :disabled="!activePreset" @click="applyPreset">
              <template #icon>
                <NIcon><DocumentTextOutline /></NIcon>
              </template>
              {{ text.applyPreset }}
            </NButton>
          </div>
        </NCollapseItem>

        <NCollapseItem name="variables" :title="text.variables">
          <NAlert type="info" :bordered="false" class="template-panel-alert">{{ text.variablesHint }}</NAlert>
          <div class="template-target-bar">
            <div class="template-target-meta">
              <span class="template-target-label">{{ text.currentTarget }}</span>
              <NTag size="small" type="info">{{ insertTarget === 'subject' ? text.insertToSubject : text.insertToContent }}</NTag>
            </div>
            <NRadioGroup v-model:value="insertTarget" size="small">
              <NRadioButton value="subject">{{ text.insertToSubject }}</NRadioButton>
              <NRadioButton value="content">{{ text.insertToContent }}</NRadioButton>
            </NRadioGroup>
          </div>

          <div class="template-variable-grid">
            <NCard
              v-for="item in orderTemplateVariables"
              :key="item.key"
              size="small"
              hoverable
              embedded
              class="template-variable-tile"
              @click="insertVariable(item.token, insertTarget)"
            >
              <div class="template-variable-tile-title">{{ item.label }}</div>
              <div class="template-variable-token">{{ item.token }}</div>
            </NCard>
          </div>
        </NCollapseItem>
      </NCollapse>

      <div class="modal-actions">
        <NButton quaternary @click="closeModal">
          <template #icon>
            <NIcon><CloseOutline /></NIcon>
          </template>
          {{ text.cancel }}
        </NButton>
        <NButton type="primary" :loading="loading" @click="submit">
          <template #icon>
            <NIcon><MailOpenOutline /></NIcon>
          </template>
          {{ editingMailId ? text.save : text.create }}
        </NButton>
      </div>
    </NModal>
  </section>
</template>
