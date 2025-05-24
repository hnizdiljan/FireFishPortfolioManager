import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Alert, Spin, message } from 'antd';
import { LoanInput } from '@/types/loanTypes';
import { useLoanForm } from '@hooks/useLoanForm';
import { SettingsState, useSettingsStore } from '@store/settingsStore';
import { AuthState, useAuthStore } from '@store/authStore';
import { fetchCurrentUser, fetchInternalBtcPrice } from '@services/userService';
import { 
  calculateLoanSummary, 
  calculateCollateral, 
  validateCurrentStepFields,
  formatBtc,
  formatCurrency 
} from './utils';
import LoanFormHeader from './LoanFormHeader';import LoanFormNavigation from './LoanFormNavigation';import BasicInfoStep from './BasicInfoStep';import FinancialDetailsStep from './FinancialDetailsStep';import BitcoinTransactionStep from './BitcoinTransactionStep';import SummaryStep from './SummaryStep';
import dayjs from 'dayjs';

/**
 * Hlavní komponent formuláře půjčky
 * Refaktorováno podle SOLID principů - koordinuje menší specializované komponenty
 */
const LoanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const numericId = id ? parseInt(id, 10) : undefined;
  const settings = useSettingsStore((state: SettingsState) => state.settings);
  const getAccessToken = useAuthStore((state: AuthState) => state.getAccessToken);

  const {
    loanData,
    isLoading,
    isSaving,
    error,
    isEditing,
    updateField,
    saveLoan,
  } = useLoanForm(numericId ?? 0);

  // Lokální stav
  const [ltvPercent, setLtvPercent] = React.useState<number | null>(null);
  const [btcPrice, setBtcPrice] = React.useState<number | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const totalSteps = 4;

  // Načtení LTV a BTC ceny
  React.useEffect(() => {
    const fetchLtvAndBtc = async () => {
      const token = await getAccessToken();
      if (!token) return;

      try {
        const user = await fetchCurrentUser(() => Promise.resolve(token));
        const btcPriceData = await fetchInternalBtcPrice(() => Promise.resolve(token));
        setLtvPercent(user.ltvPercent ?? null);
        setBtcPrice(btcPriceData.priceCzk ?? null);
      } catch (error) {
        console.error('Error fetching LTV and BTC price:', error);
      }
    };

    fetchLtvAndBtc();
  }, [getAccessToken]);

  // Výpočet souhrnných dat
  const loanSummary = React.useMemo(() => {
    return calculateLoanSummary(loanData, btcPrice || 0);
  }, [loanData, btcPrice]);

  // Synchronizace formuláře s daty
  React.useEffect(() => {
    if (loanData) {
      form.setFieldsValue({
        loanId: loanData.loanId,
        status: loanData.status,
        loanDate: loanData.loanDate ? dayjs(loanData.loanDate) : null,
        loanPeriodMonths: loanData.loanPeriodMonths,
        repaymentDate: loanData.repaymentDate ? dayjs(loanData.repaymentDate) : null,
        loanAmountCzk: loanData.loanAmountCzk,
        interestRate: loanData.interestRate,
        repaymentAmountCzk: loanData.repaymentAmountCzk,
        feesBtc: loanData.feesBtc,
        transactionFeesBtc: loanData.transactionFeesBtc,
        collateralBtc: loanData.collateralBtc,
        totalSentBtc: loanData.totalSentBtc,
        purchasedBtc: loanData.purchasedBtc,
      });
    }
  }, [loanData, form]);

  // Automatické výpočty
  React.useEffect(() => {
    if (loanData.loanDate && loanData.loanPeriodMonths) {
      const loanDate = dayjs(loanData.loanDate);
      const repaymentDate = loanDate.add(loanData.loanPeriodMonths, 'month');
      updateField('repaymentDate', repaymentDate.format('YYYY-MM-DD'));
      form.setFieldValue('repaymentDate', repaymentDate);
    }
  }, [loanData.loanDate, loanData.loanPeriodMonths, updateField, form]);

  React.useEffect(() => {
    if (loanData.loanAmountCzk && loanData.interestRate && loanData.loanPeriodMonths) {
      const principal = loanData.loanAmountCzk;
      const rate = loanData.interestRate / 100;
      const months = loanData.loanPeriodMonths;
      
      const interest = principal * rate * (months / 12);
      const repaymentAmount = principal + interest;
      
      updateField('repaymentAmountCzk', Math.round(repaymentAmount));
      form.setFieldValue('repaymentAmountCzk', Math.round(repaymentAmount));
    }
  }, [loanData.loanAmountCzk, loanData.interestRate, loanData.loanPeriodMonths, updateField, form]);

  React.useEffect(() => {
    const totalSent = (loanData.collateralBtc || 0) + (loanData.feesBtc || 0) + (loanData.transactionFeesBtc || 0);
    updateField('totalSentBtc', Number(totalSent.toFixed(8)));
    form.setFieldValue('totalSentBtc', Number(totalSent.toFixed(8)));
  }, [loanData.collateralBtc, loanData.feesBtc, loanData.transactionFeesBtc, updateField, form]);

  // Handlers
  const handleFieldChange = (field: keyof LoanInput, value: number | string | null) => {
    updateField(field, value);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const success = await saveLoan();
      if (success) {
        message.success(isEditing ? 'Půjčka byla úspěšně aktualizována!' : 'Půjčka byla úspěšně vytvořena!');
        navigate('/loans');
      }
    } catch (error) {
      message.error('Zkontrolujte prosím všechna povinná pole');
    }
  };

  const handleRecalculateCollateral = React.useCallback(async () => {
    const repaymentAmountCzk = loanData.repaymentAmountCzk;
    if (!repaymentAmountCzk) {
      message.warning('Nejprve zadejte částku k splacení');
      return;
    }

    setIsCalculating(true);
    const token = await getAccessToken();
    if (!token) {
      setIsCalculating(false);
      return;
    }

    try {
      const user = await fetchCurrentUser(() => Promise.resolve(token));
      const btcPriceData = await fetchInternalBtcPrice(() => Promise.resolve(token));
      const ltv = user.ltvPercent ?? null;
      const price = btcPriceData.priceCzk ?? null;
      setLtvPercent(ltv);
      setBtcPrice(price);

      if (!ltv || !price) {
        message.error('Nelze načíst LTV nebo cenu BTC');
        setIsCalculating(false);
        return;
      }

      const collateralBtc = calculateCollateral(repaymentAmountCzk, ltv, price);
      updateField('collateralBtc', collateralBtc);
      form.setFieldValue('collateralBtc', collateralBtc);
      
      message.success({
        content: `Kolaterál přepočítán: ${formatBtc(collateralBtc)} BTC (${formatCurrency(repaymentAmountCzk / (ltv / 100))} CZK)`,
        duration: 5,
      });
    } catch (error) {
      console.error('Error recalculating collateral:', error);
      message.error('Chyba při přepočtu kolaterálu');
    } finally {
      setIsCalculating(false);
    }
  }, [loanData.repaymentAmountCzk, getAccessToken, updateField, form]);

  const handleNextStep = async () => {
    try {
      const isValid = await validateCurrentStepFields(currentStep, form);
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      message.error('Zkontrolujte prosím všechna povinná pole v tomto kroku');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCancel = () => {
    navigate('/loans');
  };

  // Loading state
  if (isLoading && isEditing) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          Načítám data půjčky...
        </div>
      </div>
    );
  }

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            loanData={loanData}
            form={form}
            onFieldChange={handleFieldChange}
          />
        );
      case 1:
        return (
          <FinancialDetailsStep
            loanData={loanData}
            form={form}
            onFieldChange={handleFieldChange}
          />
        );
      case 2:
        return (
          <BitcoinTransactionStep
            loanData={loanData}
            form={form}
            onFieldChange={handleFieldChange}
            isCalculating={isCalculating}
            onRecalculateCollateral={handleRecalculateCollateral}
          />
        );
      case 3:
        return (
          <SummaryStep
            loanData={loanData}
            form={form}
            loanSummary={loanSummary}
            isEditing={isEditing}
            isSaving={isSaving}
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Form form={form} layout="vertical">
        <LoanFormHeader
          isEditing={isEditing}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {error && (
          <Alert
            message="Chyba"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        {renderStepContent()}

        <LoanFormNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLastStep={currentStep === totalSteps - 1}
          isSaving={isSaving}
          onPrevious={handlePreviousStep}
          onNext={handleNextStep}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
        />
      </Form>
    </div>
  );
};

export default LoanForm; 