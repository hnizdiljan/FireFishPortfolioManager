import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Alert,
  Tooltip,
  Divider,
  Spin,
  message,
  Steps,
  Descriptions,
} from 'antd';
import {
  DollarOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  CloseOutlined,
  CalculatorOutlined,
  WalletOutlined,
  PercentageOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { LoanInput } from '@/types/loanTypes';
import { useLoanForm } from '@hooks/useLoanForm';
import { SettingsState, useSettingsStore } from '@store/settingsStore';
import { AuthState, useAuthStore } from '@store/authStore';
import { fetchCurrentUser, fetchInternalBtcPrice } from '@services/userService';
import {
  calculateLoanSummary,
  calculateCollateral,
  formatCurrency,
  formatBtc,
  validateFormStep,
} from '@/utils/loanCalculations';
import { CustomInputNumber } from '@/components/Common';
import dayjs from 'dayjs';
import { bitcoinTransactionService } from '@services/bitcoinTransactionService';

const { Title, Text } = Typography;
const { Option } = Select;

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

  // Lokální stav pro zobrazení aktuální hodnoty LTV a BTC ceny
  const [ltvPercent, setLtvPercent] = React.useState<number | null>(null);
  const [btcPrice, setBtcPrice] = React.useState<number | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isCalculating, setIsCalculating] = React.useState(false);
  
  // Nový stav pro transaction ID funkcionalitu
  const [transactionId, setTransactionId] = React.useState<string>('');
  const [isLoadingTransaction, setIsLoadingTransaction] = React.useState(false);

  React.useEffect(() => {
    const fetchLtvAndBtc = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const user = await fetchCurrentUser(() => Promise.resolve(token));
      const btcPriceData = await fetchInternalBtcPrice(() => Promise.resolve(token));
      setLtvPercent(user.ltvPercent ?? null);
      setBtcPrice(btcPriceData.priceCzk ?? null);
    };

    fetchLtvAndBtc();
  }, [getAccessToken]);

  // Výpočet souhrnných dat s optimalizací
  const loanSummary = React.useMemo(() => {
    return calculateLoanSummary(loanData, btcPrice || 0);
  }, [loanData, btcPrice]);

  // Synchronizuj formulář s daty z hooku
  React.useEffect(() => {
    if (loanData) {
      form.setFieldsValue({
        loanId: loanData.loanId,
        status: loanData.status,
        loanDate: loanData.loanDate ? dayjs(loanData.loanDate) : null,
        loanPeriodMonths: loanData.loanPeriodMonths,
        repaymentDate: loanData.repaymentDate ? dayjs(loanData.repaymentDate) : null,
        loanAmountCzk: loanData.loanAmountCzk ? Math.round(loanData.loanAmountCzk) : loanData.loanAmountCzk,
        interestRate: loanData.interestRate,
        repaymentAmountCzk: loanData.repaymentAmountCzk ? Math.round(loanData.repaymentAmountCzk) : loanData.repaymentAmountCzk,
        feesBtc: loanData.feesBtc,
        transactionFeesBtc: loanData.transactionFeesBtc,
        collateralBtc: loanData.collateralBtc,
        totalSentBtc: loanData.totalSentBtc,
        purchasedBtc: loanData.purchasedBtc,
        // Přidej souhrnné hodnoty
        interestAmount: loanSummary.interestAmount,
        effectiveBtc: loanSummary.effectiveBtc,
        currentBtcValue: loanSummary.currentBtcValue,
      });
    }
  }, [loanData, form, loanSummary]);

  // Automatické výpočty
  React.useEffect(() => {
    if (loanData.loanDate && loanData.loanPeriodMonths) {
      const loanDate = dayjs(loanData.loanDate);
      const repaymentDate = loanDate.add(loanData.loanPeriodMonths, 'month');
      updateField('repaymentDate', repaymentDate.format('YYYY-MM-DD'));
      form.setFieldValue('repaymentDate', repaymentDate);
    }
  }, [loanData.loanDate, loanData.loanPeriodMonths, updateField, form]);

  // Automatický výpočet částky k splacení
  React.useEffect(() => {
    if (loanData.loanAmountCzk && loanData.interestRate && loanData.loanDate && loanData.repaymentDate) {
      const principal = loanData.loanAmountCzk;
      const rate = loanData.interestRate / 100;
      
      // Výpočet skutečného počtu dnů mezi datumy (stejná logika jako v useLoanForm)
      const loanDateObj = new Date(loanData.loanDate);
      const repaymentDateObj = new Date(loanData.repaymentDate);
      const utcLoanDate = Date.UTC(
        loanDateObj.getFullYear(),
        loanDateObj.getMonth(),
        loanDateObj.getDate()
      );
      const utcRepaymentDate = Date.UTC(
        repaymentDateObj.getFullYear(),
        repaymentDateObj.getMonth(),
        repaymentDateObj.getDate()
      );
      const days = Math.max(1, Math.floor((utcRepaymentDate - utcLoanDate) / (1000 * 60 * 60 * 24)));
      
      // Výpočet úroku na základě skutečného počtu dnů
      const interestFactor = 1 + (rate * days / 365);
      const repaymentAmount = principal * interestFactor;
      
      updateField('repaymentAmountCzk', Math.round(repaymentAmount));
      form.setFieldValue('repaymentAmountCzk', Math.round(repaymentAmount));
    }
  }, [loanData.loanAmountCzk, loanData.interestRate, loanData.loanDate, loanData.repaymentDate, updateField, form]);

  // Automatický výpočet celkově odeslaného BTC
  React.useEffect(() => {
    const totalSent = (loanData.collateralBtc || 0) + (loanData.feesBtc || 0) + (loanData.transactionFeesBtc || 0);
    updateField('totalSentBtc', Number(totalSent.toFixed(8)));
    form.setFieldValue('totalSentBtc', Number(totalSent.toFixed(8)));
  }, [loanData.collateralBtc, loanData.feesBtc, loanData.transactionFeesBtc, updateField, form]);

  const handleFieldChange = (field: keyof LoanInput, value: number | string | null) => {
    updateField(field, value);
  };

  // Funkce pro načtení dat z bitcoinové transakce
  const handleLoadTransactionData = async () => {
    if (!transactionId.trim()) {
      message.warning('Zadejte prosím Transaction ID');
      return;
    }

    setIsLoadingTransaction(true);
    try {
      const transactionDetails = await bitcoinTransactionService.getBitcoinTransactionDetails(
        transactionId.trim(),
        getAccessToken
      );

      // Předvyplnění formulářových polí
      updateField('collateralBtc', transactionDetails.collateralBtc);
      updateField('feesBtc', transactionDetails.fireFishFeesBtc);
      updateField('transactionFeesBtc', transactionDetails.transactionFeesBtc);

      // Aktualizace formuláře
      form.setFieldsValue({
        collateralBtc: transactionDetails.collateralBtc,
        feesBtc: transactionDetails.fireFishFeesBtc,
        transactionFeesBtc: transactionDetails.transactionFeesBtc
      });

      message.success(
        `Transakční detaily byly úspěšně načteny ${transactionDetails.isConfirmed ? '(potvrzená transakce)' : '(nepotvrzená transakce)'}`
      );
    } catch (error) {
      console.error('Error loading transaction data:', error);
      message.error(error instanceof Error ? error.message : 'Chyba při načítání transakčních dat');
    } finally {
      setIsLoadingTransaction(false);
    }
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

  const validateCurrentStep = React.useCallback(async (): Promise<boolean> => {
    try {
      const formValues = form.getFieldsValue();
      const errors = validateFormStep(currentStep, formValues);
      
      if (errors.length > 0) {
        message.error(errors[0]);

        return false;
      }

      // Ant Design validace
      switch (currentStep) {
        case 0:
          await form.validateFields(['loanId', 'status', 'loanDate', 'loanPeriodMonths']);
          break;
        case 1:
          await form.validateFields(['loanAmountCzk', 'interestRate']);
          break;
        case 2:
          await form.validateFields(['feesBtc', 'transactionFeesBtc', 'collateralBtc', 'purchasedBtc']);
          break;
      }

      return true;
    } catch {
      return false;
    }
  }, [currentStep, form]);

  const handleNextStep = async () => {
    try {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      message.error('Zkontrolujte prosím všechna povinná pole v tomto kroku');
    }
  };

  const steps = [
    {
      title: 'Základní údaje',
      icon: <InfoCircleOutlined />,
    },
    {
      title: 'Finanční detaily',
      icon: <DollarOutlined />,
    },
    {
      title: 'Bitcoin transakce',
      icon: <WalletOutlined />,
    },
    {
      title: 'Přehled',
      icon: <SaveOutlined />,
    },
  ];

  if (isLoading && isEditing) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Načítám data půjčky...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .loan-form-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .loan-form-step-card {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .loan-form-step-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .loan-form-summary-card {
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
        }
        
        .loan-form-summary-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .ant-steps-item-finish .ant-steps-item-icon {
          background-color: #52c41a;
          border-color: #52c41a;
        }
        
        .ant-steps-item-process .ant-steps-item-icon {
          background-color: #1890ff;
          border-color: #1890ff;
        }
        
        .loan-form-navigation {
          position: sticky;
          bottom: 0;
          background: white;
          z-index: 10;
          border-top: 1px solid #f0f0f0;
          margin: 24px -24px -24px -24px;
          padding: 16px 24px;
        }
        
        @media (max-width: 768px) {
          .loan-form-navigation {
            margin: 24px -16px -24px -16px;
            padding: 16px;
          }
        }
      `}</style>

      {/* Header */}
      <Card className="loan-form-gradient" style={{ marginBottom: 24 }}>
        <div style={{ color: 'white' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                {isEditing ? 'Upravit půjčku' : 'Nová půjčka'}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                {isEditing 
                  ? 'Aktualizujte údaje o vaší půjčce' 
                  : 'Vyplňte všechny potřebné údaje pro vytvoření nové půjčky'
                }
              </Text>
            </Col>
            <Col>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                Krok {currentStep + 1} z {steps.length}
              </Text>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Error Alert */}
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

      {/* Progress Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps 
          current={currentStep} 
          items={steps.map((step, index) => ({
            ...step,
            status: index === currentStep ? 'process' : 'wait'
          }))} 
        />
        <div style={{ marginTop: 16 }}>
          <div 
            style={{ 
              background: '#f0f0f0', 
              height: '4px', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{ 
                background: '#1890ff', 
                height: '100%', 
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} 
            />
          </div>
        </div>
      </Card>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* Krok 1: Základní údaje */}
        {currentStep === 0 && (
          <Card 
            className="loan-form-step-card"
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                Základní údaje o půjčce
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="ID půjčky (z FireFish)"
                  name="loanId"
                  rules={[{ required: true, message: 'Zadejte ID půjčky' }]}
                >
                  <Input
                    placeholder="Např. FF-12345"
                    onChange={(e) => handleFieldChange('loanId', e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: 'Vyberte status' }]}
                >
                  <Select
                    placeholder="Vyberte status"
                    onChange={(value) => handleFieldChange('status', value)}
                  >
                    <Option value="Active">Aktivní</Option>
                    <Option value="Closed">Uzavřená</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Datum půjčky"
                  name="loanDate"
                  rules={[{ required: true, message: 'Zadejte datum půjčky' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD.MM.YYYY"
                    placeholder="Vyberte datum"
                    onChange={(date) => 
                      handleFieldChange('loanDate', date ? date.format('YYYY-MM-DD') : '')
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Doba splatnosti"
                  name="loanPeriodMonths"
                  rules={[{ required: true, message: 'Vyberte dobu splatnosti' }]}
                >
                  <Select
                    placeholder="Vyberte počet měsíců"
                    onChange={(value) => handleFieldChange('loanPeriodMonths', value)}
                  >
                    <Option value={3}>3 měsíce</Option>
                    <Option value={6}>6 měsíců</Option>
                    <Option value={12}>12 měsíců</Option>
                    <Option value={18}>18 měsíců</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label={
                    <Space>
                      Datum splacení
                      <Tooltip title="Automaticky vypočteno na základě data půjčky a doby splatnosti">
                        <InfoCircleOutlined style={{ color: '#999' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="repaymentDate"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD.MM.YYYY"
                    disabled
                    placeholder="Automaticky vypočteno"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {/* Krok 2: Finanční detaily */}
        {currentStep === 1 && (
          <Card 
            className="loan-form-step-card"
            title={
              <Space>
                <DollarOutlined style={{ color: '#52c41a' }} />
                Finanční detaily
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Částka půjčky (CZK)"
                  name="loanAmountCzk"
                  rules={[
                    { required: true, message: 'Zadejte částku půjčky' },
                    { type: 'number', min: 1, message: 'Částka musí být větší než 0' }
                  ]}
                >
                  <CustomInputNumber
                    style={{ width: '100%' }}
                    placeholder="0"
                    precision={0}
                    formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
                    parser={(value) => value ? value.replace(/\s/g, '') : ''}
                    addonAfter="CZK"
                    allowEmpty={false}
                    onChange={(value) => handleFieldChange('loanAmountCzk', value || 0)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Úroková sazba (%)"
                  name="interestRate"
                  rules={[
                    { required: true, message: 'Zadejte úrokovou sazbu' },
                    { type: 'number', min: 0, max: 100, message: 'Úroková sazba musí být mezi 0-100%' }
                  ]}
                >
                  <CustomInputNumber
                    style={{ width: '100%' }}
                    placeholder="7.0"
                    step={0.1}
                    min={0}
                    max={100}
                    addonAfter={<PercentageOutlined />}
                    allowEmpty={false}
                    onChange={(value) => handleFieldChange('interestRate', value || 0)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      Částka k splacení (CZK)
                      <Tooltip title="Automaticky vypočteno na základě skutečného počtu dnů mezi datem půjčky a splatností: částka × (1 + sazba × dny/365)">
                        <InfoCircleOutlined style={{ color: '#999' }} />
                      </Tooltip>
                    </Space>
                  }
                  name="repaymentAmountCzk"
                >
                  <CustomInputNumber
                    style={{ width: '100%' }}
                    placeholder="Automaticky vypočteno"
                    precision={0}
                    formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''}
                    parser={(value) => value ? value.replace(/\s/g, '') : ''}
                    addonAfter="CZK"
                    allowEmpty={true}
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {/* Krok 3: Bitcoin transakce */}
        {currentStep === 2 && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Sekce pro načtení dat z Transaction ID */}
            <Card 
              className="loan-form-step-card"
              title={
                <Space>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  Automatické předvyplnění z Transaction ID
                </Space>
              }
              style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
            >
              <Alert
                message="Tip: Rychlé předvyplnění"
                description="Zadejte ID bitcoinové transakce z mempool.space pro automatické předvyplnění polí Kolaterál, FireFish poplatky a Transakční poplatky."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Row gutter={16} align="middle">
                <Col xs={24} md={16}>
                  <Input
                    placeholder="Zadejte Transaction ID (např. ae07dab917f326357401a46424d9aaaada5f76f133f39ef1c4469bb7b3f510a0)"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Button
                    type="primary"
                    loading={isLoadingTransaction}
                    onClick={handleLoadTransactionData}
                    disabled={!transactionId.trim()}
                    style={{ width: '100%' }}
                  >
                    {isLoadingTransaction ? 'Načítám...' : 'Načíst data'}
                  </Button>
                </Col>
              </Row>
            </Card>

            <Card 
              className="loan-form-step-card"
              title={
                <Space>
                  <WalletOutlined style={{ color: '#f7931a' }} />
                  Bitcoin transakční detaily
                </Space>
              }
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="FireFish poplatky (BTC)"
                    name="feesBtc"
                    rules={[
                      { required: true, message: 'Zadejte FireFish poplatky' },
                      { type: 'number', min: 0, message: 'Poplatky nemohou být záporné' }
                    ]}
                  >
                    <CustomInputNumber
                      style={{ width: '100%' }}
                      placeholder="0.00000000"
                      step={0.00000001}
                      precision={8}
                      min={0}
                      addonAfter="₿"
                      allowEmpty={true}
                      onChange={(value) => handleFieldChange('feesBtc', value || 0)}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Transakční poplatky (BTC)"
                    name="transactionFeesBtc"
                    rules={[
                      { required: true, message: 'Zadejte transakční poplatky' },
                      { type: 'number', min: 0, message: 'Poplatky nemohou být záporné' }
                    ]}
                  >
                    <CustomInputNumber
                      style={{ width: '100%' }}
                      placeholder="0.00010000"
                      step={0.00000001}
                      precision={8}
                      min={0}
                      addonAfter="₿"
                      allowEmpty={true}
                      onChange={(value) => handleFieldChange('transactionFeesBtc', value || 0)}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        Kolaterál (BTC)
                        <Button 
                          type="link" 
                          size="small"
                          icon={<CalculatorOutlined />}
                          loading={isCalculating}
                          onClick={handleRecalculateCollateral}
                        >
                          {isCalculating ? 'Počítám...' : 'Přepočítat'}
                        </Button>
                      </Space>
                    }
                    name="collateralBtc"
                    rules={[
                      { required: true, message: 'Zadejte kolaterál' },
                      { type: 'number', min: 0, message: 'Kolaterál nemůže být záporný' }
                    ]}
                  >
                    <CustomInputNumber
                      style={{ width: '100%' }}
                      placeholder="0.00000000"
                      step={0.00000001}
                      precision={8}
                      min={0}
                      addonAfter="₿"
                      allowEmpty={true}
                      onChange={(value) => handleFieldChange('collateralBtc', value || 0)}
                    />
                  </Form.Item>
                  <Alert
                    message={
                      <Text style={{ fontSize: '12px' }}>
                        LTV: {ltvPercent ?? settings?.ltv ?? 70}% | 
                        BTC cena: {btcPrice?.toLocaleString() ?? settings?.currentBtcPrice?.toLocaleString() ?? 'N/A'} CZK
                      </Text>
                    }
                    type="info"
                    showIcon
                    style={{ fontSize: '12px' }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        Celkem odesláno BTC
                        <Tooltip title="Kolaterál + FireFish poplatky + transakční poplatky">
                          <InfoCircleOutlined style={{ color: '#999' }} />
                        </Tooltip>
                      </Space>
                    }
                    name="totalSentBtc"
                  >
                    <CustomInputNumber
                      style={{ width: '100%' }}
                      placeholder="Automaticky vypočteno"
                      step={0.00000001}
                      precision={8}
                      addonAfter="₿"
                      allowEmpty={true}
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card 
              className="loan-form-step-card"
              title={
                <Space>
                  <WalletOutlined style={{ color: '#f7931a' }} />
                  Nákup Bitcoin
                </Space>
              }
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Nakoupeno BTC"
                    name="purchasedBtc"
                    rules={[
                      { required: true, message: 'Zadejte množství nakoupeného BTC' },
                      { type: 'number', min: 0, message: 'Množství nemůže být záporné' }
                    ]}
                  >
                    <CustomInputNumber
                      style={{ width: '100%' }}
                      placeholder="0.00000000"
                      step={0.00000001}
                      precision={8}
                      min={0}
                      addonAfter="₿"
                      allowEmpty={true}
                      onChange={(value) => handleFieldChange('purchasedBtc', value || 0)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Space>
        )}

        {/* Krok 4: Přehled */}
        {currentStep === 3 && (
          <Card 
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#52c41a' }} />
                Přehled půjčky
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Alert
              message="Zkontrolujte všechny údaje"
              description="Ověřte správnost všech zadaných informací. Po potvrzení bude půjčka vytvořena v systému."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Title level={4}>💰 Finanční přehled</Title>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" bordered className="loan-form-summary-card" style={{ backgroundColor: '#f6ffed' }}>
                  <Text type="secondary">Půjčená částka</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    {formatCurrency(loanSummary.loanAmount)} CZK
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" bordered className="loan-form-summary-card" style={{ backgroundColor: '#fff7e6' }}>
                  <Text type="secondary">Úroky</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
                    {formatCurrency(loanSummary.interestAmount)} CZK
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" bordered className="loan-form-summary-card" style={{ backgroundColor: '#f0f5ff' }}>
                  <Text type="secondary">Celkem k splacení</Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {formatCurrency(loanSummary.repaymentAmount)} CZK
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Title level={4}>₿ Bitcoin přehled</Title>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" bordered className="loan-form-summary-card" style={{ backgroundColor: '#fff0f6' }}>
                  <Text type="secondary">Odesláno celkem</Text>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#eb2f96' }}>
                    {formatBtc(loanSummary.totalSent)} ₿
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" bordered className="loan-form-summary-card" style={{ backgroundColor: '#f6ffed' }}>
                  <Text type="secondary">Nakoupeno</Text>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {formatBtc(loanSummary.purchased)} ₿
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" bordered className="loan-form-summary-card" style={{ backgroundColor: '#f0f5ff' }}>
                  <Text type="secondary">Skutečně investováno</Text>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                    {formatBtc(loanSummary.effectiveBtc)} ₿
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ≈ {formatCurrency(loanSummary.currentBtcValue)} CZK
                  </Text>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[24, 16]}>
              <Col xs={24}>
                <Title level={4}>📋 Základní údaje</Title>
              </Col>
              <Col xs={24} sm={12}>
                <Space direction="vertical" size="small">
                  <Text><strong>ID půjčky:</strong> {loanData.loanId}</Text>
                  <Text><strong>Datum půjčky:</strong> {loanData.loanDate ? dayjs(loanData.loanDate).format('DD.MM.YYYY') : '-'}</Text>
                  <Text><strong>Doba splatnosti:</strong> {loanData.loanPeriodMonths} měsíců</Text>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space direction="vertical" size="small">
                  <Text><strong>Datum splacení:</strong> {loanData.repaymentDate ? dayjs(loanData.repaymentDate).format('DD.MM.YYYY') : '-'}</Text>
                  <Text><strong>Úroková sazba:</strong> {loanData.interestRate}%</Text>
                  <Text><strong>Status:</strong> {loanData.status === 'Active' ? 'Aktivní' : 'Uzavřená'}</Text>
                </Space>
              </Col>
            </Row>

            {/* Explicit save button in overview step */}
            <Divider />
            <Row justify="center" style={{ marginTop: 24 }}>
              <Col>
                <Button 
                  type="primary"
                  size="large"
                  loading={isSaving}
                  icon={<SaveOutlined />}
                  onClick={handleSubmit}
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    paddingLeft: '32px',
                    paddingRight: '32px',
                  }}
                >
                  {isEditing ? 'Aktualizovat půjčku' : 'Vytvořit půjčku'}
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {/* Navigation */}
        <Card className="loan-form-navigation">
          <Row justify="space-between" align="middle">
            <Col>
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Předchozí
                </Button>
              )}
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<CloseOutlined />}
                  onClick={() => navigate('/loans')}
                >
                  Zrušit
                </Button>
                {currentStep < steps.length - 1 && (
                  <Button 
                    type="primary" 
                    onClick={handleNextStep}
                  >
                    Další
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default LoanForm;
