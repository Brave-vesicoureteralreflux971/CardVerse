import { h } from 'vue'
import { createDiscreteApi } from 'naive-ui'

const { message } = createDiscreteApi(['message'])

export function showFloatingMessage(
  text: string,
  type: 'success' | 'error' = 'success',
  duration = 3000,
) {
  message.create(
    () =>
      h(
        'div',
        {
          style: {
            whiteSpace: 'pre-line',
            lineHeight: '1.7',
            wordBreak: 'break-word',
          },
        },
        text,
      ),
    {
    type,
    duration,
    closable: true,
    keepAliveOnHover: true,
    },
  )
}
