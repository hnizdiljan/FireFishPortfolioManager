import { FormInstance } from 'antd';
import { LoanInput } from '@/types/loanTypes';

/**
 * Kroky ve formuláři půjčky
 */
export interface LoanFormStep {
  title: string;
  icon: React.ReactNode;
}

/**
 * Props pro kroky formuláře
 */
export interface LoanFormStepProps {
  loanData: LoanInput;
  form: FormInstance;
  isLoading?: boolean;
  onFieldChange: (field: keyof LoanInput, value: number | string | null) => void;
}

/**
 * Props pro navigaci formuláře
 */
export interface LoanFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  isSaving: boolean;
  onPrevious: () => void;
  onNext: () => Promise<void>;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}

/**
 * Props pro header formuláře
 */
export interface LoanFormHeaderProps {
  isEditing: boolean;
  currentStep: number;
  totalSteps: number;
}

/**
 * Souhrnné údaje půjčky
 */
export interface LoanSummary {
  loanAmount: number;
  interestAmount: number;
  repaymentAmount: number;
  totalSent: number;
  purchased: number;
  effectiveBtc: number;
  currentBtcValue: number;
}

/**
 * Props pro summary krok
 */
export interface SummaryStepProps extends LoanFormStepProps {
  loanSummary: LoanSummary;
  isEditing: boolean;
  isSaving: boolean;
  onSubmit: () => Promise<void>;
} 