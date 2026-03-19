import { STORAGE_KEYS, getStorage } from '../../utils/storage';

export async function uploadImage(file: File, folder = 'common') {
  const formData = new FormData();
  formData.append('file', file);

  const token = getStorage(STORAGE_KEYS.token);
  const response = await fetch(`/api/admin/uploads/image?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join('；')
      : data?.message || '上传失败';
    throw new Error(message);
  }

  return data as { url: string; folder: string; filename: string; size: number; mimetype: string };
}
