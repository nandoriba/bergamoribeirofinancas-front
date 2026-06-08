import type {
  AccountType,
  CategoryType,
  InvoiceStatus,
  RecurringStatus,
  TransactionStatus,
  TransactionType,
} from './enums';

export interface ProfileSummary {
  id: string;
  displayName: string;
  status: 'active' | 'pending' | 'inactive';
  user?: {
    email: string;
    role: 'admin' | 'member';
  };
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution?: string | null;
  lastFourDigits?: string | null;
  closingDay?: number | null;
  dueDay?: number | null;
  initialBalanceCents: number;
  memberProfileId: string;
  memberProfile?: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  aliases: string[];
  familyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  referenceMonth: string;
  dueDate?: string | null;
  closingDate?: string | null;
  totalCents: number;
  status: InvoiceStatus;
  accountId: string;
  memberProfileId: string;
  account?: Account;
  transactions?: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  applicationDate: string;
  referenceMonth: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  status: TransactionStatus;
  recurrenceType: 'none' | 'monthly' | 'yearly';
  source?: string | null;
  externalId?: string | null;
  notes?: string | null;
  isInvoicePayment: boolean;
  memberProfileId: string;
  accountId?: string | null;
  categoryId?: string | null;
  invoiceId?: string | null;
  recurringTemplateId?: string | null;
  installmentPlanId?: string | null;
  installmentNumber?: number | null;
  installmentPlan?: InstallmentPlan | null;
  account?: Account | null;
  category?: Category | null;
  invoice?: Invoice | null;
  memberProfile?: { id: string; displayName: string };
  operationalCategory?: {
    key: string;
    name: string;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTemplate {
  id: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  dayOfMonth: number;
  startsAt: string;
  endsAt?: string | null;
  notes?: string | null;
  status: RecurringStatus;
  memberProfileId: string;
  accountId?: string | null;
  categoryId?: string | null;
  account?: Account | null;
  category?: Category | null;
  memberProfile?: { id: string; displayName: string };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlan {
  id: string;
  description: string;
  totalInstallments: number;
  paidInstallments: number;
  firstInstallmentNumber: number;
  firstReferenceMonth: string;
  monthlyAmountCents: number;
  totalAmountCents: number;
  startsAt: string;
  memberProfileId: string;
  memberProfile?: { id: string; displayName: string };
  transactions?: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlanWithComputed extends InstallmentPlan {
  remainingInstallments: number;
  amountToPayCents: number;
}

export interface InstallmentSummary {
  totalPurchaseCents: number;
  totalInstallments: number;
  totalAmountToPayCents: number;
}

export interface MonthlyReport {
  month: string;
  totals: {
    incomeCents: number;
    expenseCents: number;
    netCents: number;
  };
  profiles: Array<{ id: string; name: string; incomeCents: number; expenseCents: number; netCents: number }>;
  categories: Array<{ name: string; type: string; valueCents: number; color: string }>;
  accounts: Array<{ name: string; type: string; valueCents: number }>;
}
