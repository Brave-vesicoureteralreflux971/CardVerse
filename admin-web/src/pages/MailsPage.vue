<script setup lang="ts">
import MailsPageView from './mails/MailsPageView.vue';
import { useAdminState } from '../composables/useAdminState';
const admin = useAdminState();
</script>
<template>
  <MailsPageView
    v-model:mail-form="admin.mailForm"
    :loading="admin.loading.value"
    :editing-mail-id="admin.editingMailId.value"
    :save-version="admin.mailSaveVersion.value"
    :mail-templates="admin.mailTemplates.value"
    @save-mail="admin.saveMail"
    @edit-mail="admin.editMail"
    @toggle-mail="admin.toggleMail"
    @delete-mail="admin.deleteMail"
    @reset-mail="admin.resetMailEdit"
  />
</template>