<script setup lang="ts">
import { NButton, NCard, NInput } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAdminState } from '../composables/useAdminState'

const router = useRouter()
const admin = useAdminState()

async function login() {
  try {
    await admin.login()
    router.push('/dashboard')
  } catch {
    // feedback handled in composable
  }
}
</script>

<template>
  <section class="login-shell">
    <NCard class="login-panel" :bordered="false">
      <template #header>
        <div class="login-brand">
          <span class="eyebrow">CardVerse Admin</span>
          <h1>发卡系统后台</h1>
          <p class="muted">基于 Naive UI 重构的管理台，直接对接当前 Nest API。</p>
        </div>
      </template>
      <div class="login-grid">
        <div class="field-block">
          <label>用户名</label>
          <NInput v-model:value="admin.loginForm.username" placeholder="请输入用户名" />
        </div>
        <div class="field-block">
          <label>密码</label>
          <NInput v-model:value="admin.loginForm.password" type="password" show-password-on="click"
            placeholder="请输入密码" />
        </div>
      </div>
      <NButton block type="primary" :loading="admin.loading.value" @click="login">进入后台</NButton>
    </NCard>
  </section>
</template>
