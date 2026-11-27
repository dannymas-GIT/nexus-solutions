import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Lightbulb,
  Save,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ideaStudioApi } from '@/services/ideaStudioApi';
import {
  buildDocumentPayloadFromBusinessPlan,
  generateAndDownloadNexusDocument,
  type BusinessPlanDraftInput,
  type NexusDocumentFormat,
} from '@/services/nexusDocumentsApi';

type WizardStep =
  | 'business-info'
  | 'market-analysis'
  | 'products-services'
  | 'financial-info'
  | 'review';

interface BusinessPlanData extends BusinessPlanDraftInput {
  businessInfo: {
    name: string;
    industry: string;
    description: string;
    mission: string;
    vision: string;
    legalStructure: string;
  };
  marketAnalysis: {
    targetMarket: string;
    marketSize: string;
    competitors: string;
    trends: string;
  };
  productsServices: {
    description: string;
    uniqueSellingPoints: string;
    pricing: string;
    developmentStage: string;
  };
  financialInfo: {
    startupCosts: string;
    expectedRevenue: string;
    breakEvenPoint: string;
    fundingNeeds: string;
  };
}

const BusinessPlanWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('business-info');

  const [businessPlanData, setBusinessPlanData] = useState<BusinessPlanData>({
    businessInfo: {
      name: '',
      industry: '',
      description: '',
      mission: '',
      vision: '',
      legalStructure: 'LLC',
    },
    marketAnalysis: {
      targetMarket: '',
      marketSize: '',
      competitors: '',
      trends: '',
    },
    productsServices: {
      description: '',
      uniqueSellingPoints: '',
      pricing: '',
      developmentStage: 'concept',
    },
    financialInfo: {
      startupCosts: '',
      expectedRevenue: '',
      breakEvenPoint: '',
      fundingNeeds: '',
    },
  });

  const [submittingMode, setSubmittingMode] = useState<'save' | 'research' | null>(null);
  const [exportingFormat, setExportingFormat] = useState<NexusDocumentFormat | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (
    section: keyof BusinessPlanData,
    field: string,
    value: string
  ) => {
    setBusinessPlanData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value,
      },
    }));
  };

  const handleNextStep = () => {
    setErrorMessage('');
    switch (currentStep) {
      case 'business-info':
        setCurrentStep('market-analysis');
        break;
      case 'market-analysis':
        setCurrentStep('products-services');
        break;
      case 'products-services':
        setCurrentStep('financial-info');
        break;
      case 'financial-info':
        setCurrentStep('review');
        break;
    }
  };

  const handlePreviousStep = () => {
    setErrorMessage('');
    switch (currentStep) {
      case 'market-analysis':
        setCurrentStep('business-info');
        break;
      case 'products-services':
        setCurrentStep('market-analysis');
        break;
      case 'financial-info':
        setCurrentStep('products-services');
        break;
      case 'review':
        setCurrentStep('financial-info');
        break;
    }
  };

  const buildIdeaStudioSubmission = () => {
    const { businessInfo, marketAnalysis, productsServices, financialInfo } =
      businessPlanData;

    const descriptionParts = [
      businessInfo.description.trim(),
      productsServices.description.trim()
        ? `Products & Services: ${productsServices.description.trim()}`
        : '',
      productsServices.uniqueSellingPoints.trim()
        ? `Unique Selling Points: ${productsServices.uniqueSellingPoints.trim()}`
        : '',
    ].filter(Boolean);

    const noteParts = [
      businessInfo.industry ? `Industry: ${businessInfo.industry}` : '',
      businessInfo.legalStructure
        ? `Legal Structure: ${businessInfo.legalStructure}`
        : '',
      marketAnalysis.marketSize
        ? `Estimated Market Size: ${marketAnalysis.marketSize}`
        : '',
      marketAnalysis.competitors
        ? `Known Competitors: ${marketAnalysis.competitors}`
        : '',
      financialInfo.startupCosts
        ? `Startup Costs: ${financialInfo.startupCosts}`
        : '',
      financialInfo.expectedRevenue
        ? `Year 1 Revenue Projection: ${financialInfo.expectedRevenue}`
        : '',
      financialInfo.breakEvenPoint
        ? `Break-Even Target: ${financialInfo.breakEvenPoint}`
        : '',
      financialInfo.fundingNeeds
        ? `Funding Needs: ${financialInfo.fundingNeeds}`
        : '',
    ].filter(Boolean);

    const tags = [
      businessInfo.industry,
      businessInfo.legalStructure,
      productsServices.developmentStage,
      'business-plan',
    ]
      .map((t) =>
        t
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
      .filter(Boolean);

    return {
      title: businessInfo.name.trim(),
      description: descriptionParts.join('\n\n'),
      targetEntities: marketAnalysis.targetMarket.trim(),
      tags: Array.from(new Set(tags)),
      prompt: noteParts.join(' | '),
    };
  };

  const handleSubmitToIdeaStudio = async (autoResearch: boolean) => {
    setSubmittingMode(autoResearch ? 'research' : 'save');
    setErrorMessage('');
    setStatusMessage(
      autoResearch
        ? 'Submitting business plan to Idea Studio and running M1 Market Research...'
        : 'Saving business plan brief to Idea Studio...'
    );

    try {
      const created = await ideaStudioApi.createIdea(buildIdeaStudioSubmission());
      if (autoResearch) {
        await ideaStudioApi.runMarketResearch(created.id, false);
      }
      navigate(`/idea-studio/inbox?idea=${encodeURIComponent(created.id)}`);
    } catch (err) {
      setStatusMessage('');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to submit business plan to Idea Studio.'
      );
    } finally {
      setSubmittingMode(null);
    }
  };

  const handleExportDraft = async (format: NexusDocumentFormat) => {
    setExportingFormat(format);
    setErrorMessage('');
    setStatusMessage(`Generating ${format.toUpperCase()} deliverable...`);
    try {
      const payload = buildDocumentPayloadFromBusinessPlan(businessPlanData);
      await generateAndDownloadNexusDocument(
        format,
        payload,
        businessPlanData.businessInfo.name
      );
      setStatusMessage(`Downloaded ${format.toUpperCase()} business plan draft.`);
    } catch (err) {
      setStatusMessage('');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : `Failed to export ${format.toUpperCase()} document.`
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 'business-info':
        return (
          Boolean(businessPlanData.businessInfo.name.trim()) &&
          Boolean(businessPlanData.businessInfo.industry.trim())
        );
      case 'market-analysis':
        return Boolean(businessPlanData.marketAnalysis.targetMarket.trim());
      case 'products-services':
        return Boolean(businessPlanData.productsServices.description.trim());
      case 'financial-info':
        return Boolean(businessPlanData.financialInfo.startupCosts.trim());
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const getProgressPercentage = (): number => {
    const steps: WizardStep[] = [
      'business-info',
      'market-analysis',
      'products-services',
      'financial-info',
      'review',
    ];
    const currentIndex = steps.indexOf(currentStep);
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'business-info':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-2">
              Business Information
            </h2>
            <p className="text-gray-600 mb-6">
              Provide key details about your business. Submitting this plan sends
              it directly into Idea Studio for M1 Market Research and M2
              Feasibility &amp; Viability.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                  value={businessPlanData.businessInfo.name}
                  onChange={(e) =>
                    handleInputChange('businessInfo', 'name', e.target.value)
                  }
                  placeholder="Enter your business or product name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.businessInfo.industry}
                    onChange={(e) =>
                      handleInputChange(
                        'businessInfo',
                        'industry',
                        e.target.value
                      )
                    }
                    placeholder="e.g., Technology, Retail, Healthcare"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Structure
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.businessInfo.legalStructure}
                    onChange={(e) =>
                      handleInputChange(
                        'businessInfo',
                        'legalStructure',
                        e.target.value
                      )
                    }
                  >
                    <option value="LLC">LLC</option>
                    <option value="C-Corp">C-Corp</option>
                    <option value="S-Corp">S-Corp</option>
                    <option value="Sole Proprietorship">
                      Sole Proprietorship
                    </option>
                    <option value="Nonprofit">Nonprofit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Description
                </label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                  value={businessPlanData.businessInfo.description}
                  onChange={(e) =>
                    handleInputChange(
                      'businessInfo',
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Describe the problem you solve and your core business concept"
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case 'market-analysis':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-2">
              Market Analysis
            </h2>
            <p className="text-gray-600 mb-6">
              Describe your target audience and competitive landscape to guide
              automated M1 Market Research.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Market <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                  value={businessPlanData.marketAnalysis.targetMarket}
                  onChange={(e) =>
                    handleInputChange(
                      'marketAnalysis',
                      'targetMarket',
                      e.target.value
                    )
                  }
                  placeholder="Describe your ideal customers or organizations"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Size
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.marketAnalysis.marketSize}
                    onChange={(e) =>
                      handleInputChange(
                        'marketAnalysis',
                        'marketSize',
                        e.target.value
                      )
                    }
                    placeholder="Estimated size of your target market"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Known Competitors (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.marketAnalysis.competitors}
                    onChange={(e) =>
                      handleInputChange(
                        'marketAnalysis',
                        'competitors',
                        e.target.value
                      )
                    }
                    placeholder="e.g., Acme Corp, Contoso Analytics"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'products-services':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-2">
              Products &amp; Services
            </h2>
            <p className="text-gray-600 mb-6">
              Describe what you offer to customers and what differentiates it.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product/Service Description{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                  value={businessPlanData.productsServices.description}
                  onChange={(e) =>
                    handleInputChange(
                      'productsServices',
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Describe your products, workflows, or services in detail"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unique Selling Points
                </label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                  value={businessPlanData.productsServices.uniqueSellingPoints}
                  onChange={(e) =>
                    handleInputChange(
                      'productsServices',
                      'uniqueSellingPoints',
                      e.target.value
                    )
                  }
                  placeholder="What makes your offering unique or better than alternatives?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'financial-info':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-2">
              Financial Information
            </h2>
            <p className="text-gray-600 mb-6">
              Provide financial estimates to inform M2 Feasibility &amp; Viability
              unit economics.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startup Costs <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.financialInfo.startupCosts}
                    onChange={(e) =>
                      handleInputChange(
                        'financialInfo',
                        'startupCosts',
                        e.target.value
                      )
                    }
                    placeholder="e.g., $25,000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Revenue (First Year)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.financialInfo.expectedRevenue}
                    onChange={(e) =>
                      handleInputChange(
                        'financialInfo',
                        'expectedRevenue',
                        e.target.value
                      )
                    }
                    placeholder="e.g., $150,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Break-Even Timeline
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.financialInfo.breakEvenPoint}
                    onChange={(e) =>
                      handleInputChange(
                        'financialInfo',
                        'breakEvenPoint',
                        e.target.value
                      )
                    }
                    placeholder="e.g., 12 months"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funding Needs
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                    value={businessPlanData.financialInfo.fundingNeeds}
                    onChange={(e) =>
                      handleInputChange(
                        'financialInfo',
                        'fundingNeeds',
                        e.target.value
                      )
                    }
                    placeholder="e.g., Bootstrapped or $100K pre-launch"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="p-4 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-brand-primary mb-2">
                Review &amp; Submit to Idea Studio
              </h2>
              <p className="text-gray-600">
                Submit your structured business plan into Nexus Idea Studio for
                automated M1 Market Research, M2 Feasibility &amp; Viability, and
                gated app execution — or export a draft deliverable immediately.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-base mb-2">
                  Business Information
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Business Name
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.businessInfo.name || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Industry
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.businessInfo.industry || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Legal Structure
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.businessInfo.legalStructure}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-base mb-2">
                  Market Analysis
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      Target Market
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.marketAnalysis.targetMarket ||
                        'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Market Size
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.marketAnalysis.marketSize ||
                        'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Known Competitors
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.marketAnalysis.competitors ||
                        'Not provided'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-base mb-2">
                  Products &amp; Services
                </h3>
                <dl className="grid grid-cols-1 gap-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Description
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.productsServices.description ||
                        'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Unique Selling Points
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.productsServices.uniqueSellingPoints ||
                        'Not provided'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-base mb-2">
                  Financial Information
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Startup Costs
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.financialInfo.startupCosts ||
                        'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Expected Revenue (Year 1)
                    </dt>
                    <dd className="mt-0.5 text-gray-900">
                      {businessPlanData.financialInfo.expectedRevenue ||
                        'Not provided'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Export Draft with Nexus Document Generator:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {(['pdf', 'docx', 'pptx'] as NexusDocumentFormat[]).map(
                  (fmt) => (
                    <Button
                      key={fmt}
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={Download}
                      isLoading={exportingFormat === fmt}
                      disabled={Boolean(exportingFormat) || Boolean(submittingMode)}
                      onClick={() => handleExportDraft(fmt)}
                      className="min-h-[44px] border-gray-300 text-gray-800"
                    >
                      Export {fmt.toUpperCase()}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-primary mb-1">
              Create Your Business Plan
            </h1>
            <p className="text-gray-600">
              Structured 5-step intake wired directly into Nexus Idea Studio
              (tenant: <code className="text-sm">nexus-solutions</code>).
            </p>
          </div>
          <Link
            to="/idea-studio/submit"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline min-h-[44px]"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Prefer Quick Brief? Open Idea Studio</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 text-sm font-medium">
            <div
              className={`text-center ${
                currentStep === 'business-info'
                  ? 'text-brand-primary font-semibold'
                  : 'text-gray-600'
              }`}
            >
              Business Info
            </div>
            <div
              className={`text-center ${
                currentStep === 'market-analysis'
                  ? 'text-brand-primary font-semibold'
                  : 'text-gray-600'
              }`}
            >
              Market Analysis
            </div>
            <div
              className={`text-center ${
                currentStep === 'products-services'
                  ? 'text-brand-primary font-semibold'
                  : 'text-gray-600'
              }`}
            >
              Products/Services
            </div>
            <div
              className={`text-center ${
                currentStep === 'financial-info'
                  ? 'text-brand-primary font-semibold'
                  : 'text-gray-600'
              }`}
            >
              Financial Info
            </div>
            <div
              className={`text-center ${
                currentStep === 'review'
                  ? 'text-brand-primary font-semibold'
                  : 'text-gray-600'
              }`}
            >
              Review
            </div>
          </div>
        </div>

        {/* Status / Error Feedback */}
        <div aria-live="polite" className="mb-4 space-y-2">
          {statusMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 flex items-center gap-2 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Step content */}
        <Card className="mb-6">{renderStep()}</Card>

        {/* Navigation buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {currentStep !== 'business-info' ? (
            <Button
              type="button"
              variant="outline"
              leftIcon={ArrowLeft}
              onClick={handlePreviousStep}
              disabled={Boolean(submittingMode)}
              className="min-h-[44px] border-gray-300 text-gray-800"
            >
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep !== 'review' ? (
            <Button
              type="button"
              variant="default"
              rightIcon={ArrowRight}
              onClick={handleNextStep}
              disabled={!isCurrentStepValid()}
              className="min-h-[44px]"
            >
              Next
            </Button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                leftIcon={Save}
                onClick={() => handleSubmitToIdeaStudio(false)}
                isLoading={submittingMode === 'save'}
                disabled={Boolean(submittingMode)}
                className="min-h-[44px] border-gray-300 text-gray-800"
              >
                Save Brief to Idea Studio
              </Button>
              <Button
                type="button"
                variant="gradient"
                leftIcon={Sparkles}
                onClick={() => handleSubmitToIdeaStudio(true)}
                isLoading={submittingMode === 'research'}
                disabled={Boolean(submittingMode)}
                className="min-h-[44px]"
              >
                Submit &amp; Run M1 Research
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessPlanWizard;
