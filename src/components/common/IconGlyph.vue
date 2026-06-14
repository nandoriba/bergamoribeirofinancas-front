<script setup lang="ts">
import {
  AlertTriangle,
  Bell,
  BookOpen,
  ChartColumn,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  CreditCard,
  Download,
  FileSpreadsheet,
  Fuel,
  House,
  Info,
  LayoutDashboard,
  List,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Split,
  Stethoscope,
  Sun,
  Tag,
  Upload,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from '@lucide/vue';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
    strokeWidth?: number;
  }>(),
  {
    size: 16,
    strokeWidth: 1.6,
  },
);

const icons: Record<string, LucideIcon> = {
  alert: AlertTriangle,
  bar: ChartColumn,
  bell: Bell,
  book: BookOpen,
  card: CreditCard,
  check: CheckCircle2,
  chevL: ChevronLeft,
  chevR: ChevronRight,
  chevDown: ChevronDown,
  chevUp: ChevronUp,
  close: X,
  copy: Copy,
  dashboard: LayoutDashboard,
  download: Download,
  file: FileSpreadsheet,
  fuel: Fuel,
  home: House,
  info: Info,
  list: List,
  menu: Menu,
  moon: Moon,
  more: MoreHorizontal,
  plus: Plus,
  receipt: ReceiptText,
  repeat: Repeat2,
  search: Search,
  send: Send,
  settings: Settings,
  split: Split,
  sun: Sun,
  tag: Tag,
  upload: Upload,
  users: Users,
  wallet: WalletCards,
  cart: ShoppingCart,
  health: Stethoscope,
};

const glyph = computed(() => icons[props.name] ?? Circle);
</script>

<template>
  <component
    :is="glyph"
    class="icon"
    :size="size"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  />
</template>
