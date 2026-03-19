<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AddOutline, CheckmarkCircleOutline, CloseOutline, CreateOutline, SettingsOutline } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NEmpty,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTable,
  NTag,
} from 'naive-ui';
import type { PaymentChannel } from '../../types';
import ConfirmActionButton from '../../components/common/ConfirmActionButton.vue';
import TablePager from '../../components/TablePager.vue';
import { paymentDriverOptions, paymentDriverFields } from '../../constants/payment-drivers';
import { mapCodeLabel, paymentDriverMap } from '../../utils/dicts';

const text = {
  title: '支付渠道',
  create: '创建渠道',
  search: '搜索名称 / 代码 / 驱动',
  empty: '暂无支付渠道',
  name: '名称',
  code: '代码',
  driver: '驱动',
  status: '状态',
  actions: '操作',
  enabled: '启用',
  disabled: '禁用',
  edit: '编辑',
  remove: '删除',
  removeConfirm: '确认删除这个支付渠道吗？',
  editTitle: '编辑支付渠道',
  createTitle: '创建支付渠道',
  rawConfig: '原始配置(JSON)',
  rawConfigHint: '未知驱动时可直接填写 JSON。已支持的驱动会自动拆成字段。',
  notifyUrl: '异步回调地址',
  returnUrl: '同步返回地址',
  sort: '排序',
  cancel: '取消',
  save: '保存渠道',
  createDriverHint: '选择支付驱动后，下面会显示对应配置项。',
};

const props = defineProps<{
  loading: boolean;
  editingPaymentId: string;
  saveVersion: number;
  paymentChannels: PaymentChannel[];
}>();

const paymentForm = defineModel<any>('paymentForm', { required: true });
const emit = defineEmits<{
  savePayment: [];
  editPayment: [item: PaymentChannel];
  toggleChannel: [item: PaymentChannel];
  deletePayment: [id: string];
  resetPayment: [];
}>();

const keyword = ref('');
const page = ref(1);
const pageSize = ref(10);
const modalVisible = ref(false);

const filteredChannels = computed(() =>
  props.paymentChannels.filter(
    (item) =>
      !keyword.value ||
      [item.name, item.code, item.driver].some((value) => value.toLowerCase().includes(keyword.value.toLowerCase())),
  ),
);

const pagedChannels = computed(() =>
  filteredChannels.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
);

const currentDriverFields = computed(() => paymentDriverFields[paymentForm.value.driver] ?? []);
const isKnownDriver = computed(() => currentDriverFields.value.length > 0 || paymentForm.value.driver === 'MOCK');

function openCreate() {
  emit('resetPayment');
  modalVisible.value = true;
}

function openEdit(item: PaymentChannel) {
  emit('editPayment', item);
  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
  emit('resetPayment');
}

function submit() {
  emit('savePayment');
}

function renderDriver(value?: string) {
  return mapCodeLabel(value, paymentDriverMap);
}

function ensureConfigValues() {
  if (!paymentForm.value.configValues || typeof paymentForm.value.configValues !== 'object') {
    paymentForm.value.configValues = {};
  }
}

watch(
  () => paymentForm.value.driver,
  () => {
    ensureConfigValues();
  },
  { immediate: true },
);

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

      <NEmpty v-if="!filteredChannels.length" :description="text.empty" class="empty-block" />
      <template v-else>
        <NTable striped>
          <thead>
            <tr>
              <th>{{ text.name }}</th>
              <th>{{ text.code }}</th>
              <th>{{ text.driver }}</th>
              <th>{{ text.status }}</th>
              <th>{{ text.actions }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pagedChannels" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.code }}</td>
              <td>{{ renderDriver(item.driver) }}</td>
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
                  <NButton class="table-action-button" size="small" quaternary @click="emit('toggleChannel', item)">
                    <template #icon><NIcon><CheckmarkCircleOutline /></NIcon></template>
                    {{ item.status ? text.disabled : text.enabled }}
                  </NButton>
                  <ConfirmActionButton :label="text.remove" :message="text.removeConfirm" @confirm="emit('deletePayment', item.id)" />
                </NSpace>
              </td>
            </tr>
          </tbody>
        </NTable>
        <TablePager v-model:page="page" v-model:page-size="pageSize" :total="filteredChannels.length" />
      </template>
    </NCard>

    <NModal
      :show="modalVisible"
      preset="card"
      :title="editingPaymentId ? text.editTitle : text.createTitle"
      class="inline-modal inline-modal-wide"
      @update:show="!$event && closeModal()"
    >
      <div class="form-grid compact">
        <div class="field-block">
          <span>{{ text.name }}</span>
          <NInput v-model:value="paymentForm.name" />
        </div>
        <div class="field-block">
          <span>{{ text.code }}</span>
          <NInput v-model:value="paymentForm.code" />
        </div>
        <div class="field-block">
          <span>{{ text.driver }}</span>
          <NSelect v-model:value="paymentForm.driver" :options="paymentDriverOptions" />
          <small class="muted">{{ text.createDriverHint }}</small>
        </div>
        <div class="field-block">
          <span>{{ text.sort }}</span>
          <NInput v-model:value="paymentForm.sort" />
        </div>
        <div class="field-block">
          <span>{{ text.notifyUrl }}</span>
          <NInput v-model:value="paymentForm.notifyUrl" />
        </div>
        <div class="field-block">
          <span>{{ text.returnUrl }}</span>
          <NInput v-model:value="paymentForm.returnUrl" />
        </div>
      </div>

      <div v-if="currentDriverFields.length" class="form-grid compact">
        <div v-for="field in currentDriverFields" :key="field.key" class="field-block">
          <span>{{ field.label }}</span>
          <NSelect
            v-if="field.type === 'select'"
            v-model:value="paymentForm.configValues[field.key]"
            :options="field.options ?? []"
            :placeholder="field.placeholder"
            filterable
            clearable
          />
          <NInput
            v-else
            v-model:value="paymentForm.configValues[field.key]"
            :type="field.type === 'password' ? 'password' : field.type === 'textarea' ? 'textarea' : 'text'"
            :placeholder="field.placeholder"
            :show-password-on="field.type === 'password' ? 'click' : undefined"
            :autosize="field.type === 'textarea' ? { minRows: 3, maxRows: 8 } : undefined"
          />
          <small v-if="field.hint" class="muted">{{ field.hint }}</small>
        </div>
      </div>

      <div v-if="!isKnownDriver" class="field-block field-block-span-2">
        <span>{{ text.rawConfig }}</span>
        <NInput
          v-model:value="paymentForm.configJson"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 8 }"
        />
        <small class="muted">{{ text.rawConfigHint }}</small>
      </div>

      <div class="modal-actions">
        <NButton quaternary @click="closeModal"><template #icon><NIcon><CloseOutline /></NIcon></template>{{ text.cancel }}</NButton>
        <NButton type="primary" :loading="loading" @click="submit">
          <template #icon>
            <NIcon><SettingsOutline /></NIcon>
          </template>
          {{ editingPaymentId ? text.save : text.create }}
        </NButton>
      </div>
    </NModal>
  </section>
</template>

