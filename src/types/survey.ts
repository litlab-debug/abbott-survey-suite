// Survey Application Types - Aligned with SharePoint Lists Schema

export type UserRole = 'super_admin' | 'admin' | 'read_only' | 'respondent';

export type SurveyStatus = 'draft' | 'active' | 'closed';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'tr';

export type Channel = 'email' | 'sms' | 'web' | 'phone';

export type QuestionType = 
  | 'nps' 
  | 'rating' 
  | 'likert'
  | 'single_choice' 
  | 'multiple_choice' 
  | 'text' 
  | 'matrix'
  | 'yes_no';

export type QuestionScope = 'global' | 'local';

export type QuestionCategory = 
  | 'overall_satisfaction'
  | 'product_quality'
  | 'customer_service'
  | 'delivery_experience'
  | 'value_for_money'
  | 'communication'
  | 'technical_support'
  | 'ease_of_use'
  | 'recommendation';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Question {
  id: string;
  code: string; // e.g. "GQ-01", "LQ-BR-01"
  category: QuestionCategory;
  type: QuestionType;
  scope: QuestionScope;
  text: Record<Language, string>;
  description?: Record<Language, string>;
  required: boolean;
  isMandatory: boolean; // Global mandatory questions
  options?: Record<Language, string[]>;
  conditionalLogic?: {
    dependsOn: string;
    showWhen: string | number;
  };
  order: number;
  isActive: boolean;
}

export interface SurveyQuestionVersion {
  id: string;
  surveyId: string;
  questionId: string;
  language: Language;
  text: string;
  order: number;
  visibleIf?: string;
}

export interface Survey {
  id: string;
  name: string;
  description: string;
  status: SurveyStatus;
  languages: Language[];
  primaryLanguage: Language;
  countries: string[];
  channels: Channel[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  questions: Question[];
  questionVersions?: SurveyQuestionVersion[];
  messages: {
    invite: Record<Language, { subject: string; body: string }>;
    reminder: Record<Language, { subject: string; body: string }>;
    closing: Record<Language, { subject: string; body: string }>;
  };
  ccEmails: string[];
  targetCount: number;
  responseCount: number;
  reminderSchedule: {
    firstReminder: number; // Days before end
    secondReminder: number;
  };
}

export interface Target {
  id: string;
  surveyId: string;
  customerId: string;
  customerName: string;
  email: string;
  name: string;
  company?: string;
  country: string;
  language: Language;
  preferredLanguage: Language;
  channel: Channel;
  segment?: string;
  division?: string;
  externalId?: string;
  status: 'pending' | 'invited' | 'reminded' | 'completed' | 'bounced';
  invitedAt?: string;
  remindedAt?: string;
  completedAt?: string;
}

export interface Invitation {
  id: string;
  surveyId: string;
  targetId: string;
  email: string;
  language: Language;
  sentOn: string;
  reminderCount: number;
  lastReminderOn?: string;
  deliveryStatus: 'sent' | 'bounced' | 'error';
}

export interface Response {
  id: string;
  surveyId: string;
  targetId: string;
  customerId?: string;
  respondentEmail?: string;
  answers: Record<string, string | number | string[]>;
  npsScore?: number;
  npsComment?: string;
  finalFeedback?: string;
  submittedAt: string;
  startedOn?: string;
  language: Language;
  channel: Channel;
  country: string;
  completionTime: number; // seconds
}

export interface SurveyMetrics {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  averageNPS: number;
  responseRate: number;
  averageCompletionTime: number;
}

export interface CountryMetrics {
  country: string;
  targetCount: number;
  responseCount: number;
  responseRate: number;
  averageNPS: number;
}

export interface ChannelMetrics {
  channel: Channel;
  targetCount: number;
  responseCount: number;
  responseRate: number;
}

// Language display names
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  tr: 'Turkish',
};

// Country list
export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Brazil',
  'Mexico',
  'Japan',
  'China',
  'India',
  'Australia',
  'Canada',
  'Turkey',
  'Colombia',
  'Argentina',
  'Chile',
  'Portugal',
];

// Channel display names
export const CHANNEL_NAMES: Record<Channel, string> = {
  email: 'Email',
  sms: 'SMS',
  web: 'Web Link',
  phone: 'Phone',
};

// Question category labels
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  overall_satisfaction: 'Overall Satisfaction',
  product_quality: 'Product Quality',
  customer_service: 'Customer Service',
  delivery_experience: 'Delivery Experience',
  value_for_money: 'Value for Money',
  communication: 'Communication',
  technical_support: 'Technical Support',
  ease_of_use: 'Ease of Use',
  recommendation: 'Recommendation (NPS)',
};

// Question scope labels
export const SCOPE_LABELS: Record<QuestionScope, string> = {
  global: 'Global',
  local: 'Local',
};

// CSV Template columns for TargetList
export const TARGET_CSV_COLUMNS = [
  { key: 'CustomerId', required: true, description: 'Client identifier' },
  { key: 'CustomerName', required: true, description: 'Client name' },
  { key: 'Email', required: true, description: 'Respondent email' },
  { key: 'Country', required: true, description: 'Country (controlled catalog)' },
  { key: 'PreferredLanguage', required: true, description: 'Preferred language (EN/ES/PT/TR…)' },
  { key: 'Division', required: false, description: 'Division for segmentation' },
  { key: 'Channel', required: false, description: 'Channel (if applicable)' },
  { key: 'ExternalId', required: false, description: 'Additional external ID' },
] as const;

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, {
  canCreateSurvey: boolean;
  canEditSurvey: boolean;
  canPublishSurvey: boolean;
  canCloseSurvey: boolean;
  canManageTargets: boolean;
  canSendReminders: boolean;
  canExport: boolean;
  canManageQuestionBank: boolean;
  canViewDashboard: boolean;
  canViewMonitoring: boolean;
  canViewHistory: boolean;
}> = {
  super_admin: {
    canCreateSurvey: true,
    canEditSurvey: true,
    canPublishSurvey: true,
    canCloseSurvey: true,
    canManageTargets: true,
    canSendReminders: true,
    canExport: true,
    canManageQuestionBank: true,
    canViewDashboard: true,
    canViewMonitoring: true,
    canViewHistory: true,
  },
  admin: {
    canCreateSurvey: true,
    canEditSurvey: true,
    canPublishSurvey: true,
    canCloseSurvey: true,
    canManageTargets: true,
    canSendReminders: true,
    canExport: true,
    canManageQuestionBank: false,
    canViewDashboard: true,
    canViewMonitoring: true,
    canViewHistory: true,
  },
  read_only: {
    canCreateSurvey: false,
    canEditSurvey: false,
    canPublishSurvey: false,
    canCloseSurvey: false,
    canManageTargets: false,
    canSendReminders: false,
    canExport: true,
    canManageQuestionBank: false,
    canViewDashboard: true,
    canViewMonitoring: true,
    canViewHistory: true,
  },
  respondent: {
    canCreateSurvey: false,
    canEditSurvey: false,
    canPublishSurvey: false,
    canCloseSurvey: false,
    canManageTargets: false,
    canSendReminders: false,
    canExport: false,
    canManageQuestionBank: false,
    canViewDashboard: false,
    canViewMonitoring: false,
    canViewHistory: false,
  },
};
