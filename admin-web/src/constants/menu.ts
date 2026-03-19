import { AppsOutline, CardOutline, GridOutline, ListOutline, MailOutline, PricetagOutline, SettingsOutline, WalletOutline } from '@vicons/ionicons5'
import type { Component } from 'vue'
import type { MenuItem } from '../types'

export const menu: MenuItem[] = [
  { key: 'dashboard', label: '概览', path: '/dashboard', icon: GridOutline },
  { key: 'orders', label: '订单与发货', path: '/orders', icon: ListOutline },
  { key: 'catalog', label: '商品与分类', path: '/catalog', icon: AppsOutline },
  { key: 'cards', label: '卡密管理', path: '/cards', icon: CardOutline },
  { key: 'coupons', label: '优惠券管理', path: '/coupons', icon: PricetagOutline },
  { key: 'payments', label: '支付渠道', path: '/payments', icon: WalletOutline },
  { key: 'mails', label: '邮件模板', path: '/mails', icon: MailOutline },
  { key: 'system', label: '系统配置', path: '/system', icon: SettingsOutline },
]

export function getMenuIcon(path: string): Component | undefined {
  return menu.find((item) => item.path === path)?.icon
}
