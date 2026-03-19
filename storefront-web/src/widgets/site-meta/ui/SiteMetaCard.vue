<script setup lang="ts">
import { computed } from 'vue';
import { NCard, NDescriptions, NDescriptionsItem, NTag } from 'naive-ui';
import type { SiteBootstrap } from '@/entities/site/model/types';

const props = defineProps<{
  site: SiteBootstrap;
}>();

const keywordList = computed(() =>
  props.site.siteKeywords
    ? props.site.siteKeywords
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [],
);
</script>

<template>
  <NCard class="site-meta-card" :bordered="false">
    <template #header>站点信息</template>
    <NDescriptions bordered label-placement="left" :column="2">
      <NDescriptionsItem label="站点名称">{{ site.siteName || '-' }}</NDescriptionsItem>
      <NDescriptionsItem label="联系邮箱">{{ site.supportEmail || '-' }}</NDescriptionsItem>
      <NDescriptionsItem label="备案号">{{ site.icpNo || '-' }}</NDescriptionsItem>
      <NDescriptionsItem label="站点地址">{{ site.siteUrl || '-' }}</NDescriptionsItem>
      <NDescriptionsItem label="站点关键词" :span="2">
        <div v-if="keywordList.length" class="site-meta-keywords">
          <NTag v-for="item in keywordList" :key="item" size="small" round type="primary">
            {{ item }}
          </NTag>
        </div>
        <span v-else>-</span>
      </NDescriptionsItem>
    </NDescriptions>
  </NCard>
</template>
