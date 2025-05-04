import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Define the steps for our wizard
type WizardStep = 
  | 'business-info' 
  | 'market-analysis' 
  | 'products-services' 
  | 'financial-info' 
  | 'review';

// Business plan data structure
interface BusinessPlanData {
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
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>('business-info');
  
  // Initialize business plan data
  const [businessPlanData, setBusinessPlanData] = useState<BusinessPlanData>({
    businessInfo: {
      name: '',
      industry: '',
      description: '',
      mission: '',
      vision: '',
      legalStructure: 'LLC'
    },
    marketAnalysis: {
      targetMarket: '',
      marketSize: '',
      competitors: '',
      trends: ''
    },
    productsServices: {
      description: '',
      uniqueSellingPoints: '',
      pricing: '',
      developmentStage: 'concept'
    },
    financialInfo: {
      startupCosts: '',
      expectedRevenue: '',
      breakEvenPoint: '',
      fundingNeeds: ''
    }
  });

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleInputChange = (
    section: keyof BusinessPlanData, 
    field: string, 
    value: string
  ) => {
    setBusinessPlanData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value
      }
    }));
  };

  // Navigate to next step
  const handleNextStep = () => {
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

  // Navigate to previous step
  const handlePreviousStep = () => {
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

  // Submit the business plan
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Here you would normally make an API call to submit the data
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // After submission is complete, you could redirect to dashboard or documents
      alert('Business plan created successfully!');
    } catch (error) {
      console.error('Error submitting business plan:', error);
      alert('There was an error creating your business plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current step is valid
  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 'business-info':
        return !!businessPlanData.businessInfo.name && 
          !!businessPlanData.businessInfo.industry;
      case 'market-analysis':
        return !!businessPlanData.marketAnalysis.targetMarket;
      case 'products-services':
        return !!businessPlanData.productsServices.description;
      case 'financial-info':
        return !!businessPlanData.financialInfo.startupCosts;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    const steps: WizardStep[] = ['business-info', 'market-analysis', 'products-services', 'financial-info', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };
  
  // Render current step content
  const renderStep = () => {
    switch (currentStep) {
      case 'business-info':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Business Information</h2>
            <p className="text-gray-500 mb-6">Provide key details about your business.</p>

            <div className="space-y-4">
      <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
            value={businessPlanData.businessInfo.name}
            onChange={(e) => handleInputChange('businessInfo', 'name', e.target.value)}
            placeholder="Enter your business name"
          />
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
            value={businessPlanData.businessInfo.industry}
            onChange={(e) => handleInputChange('businessInfo', 'industry', e.target.value)}
            placeholder="e.g., Technology, Retail, Healthcare"
          />
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Description
          </label>
          <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
            value={businessPlanData.businessInfo.description}
            onChange={(e) => handleInputChange('businessInfo', 'description', e.target.value)}
            placeholder="Describe your business in a few sentences"
            rows={4}
                />
        </div>
      </div>
    </div>
  );
      case 'market-analysis':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Market Analysis</h2>
            <p className="text-gray-500 mb-6">Describe your target market and competitive landscape.</p>

            <div className="space-y-4">
      <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Market <span className="text-red-500">*</span>
          </label>
          <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
            value={businessPlanData.marketAnalysis.targetMarket}
            onChange={(e) => handleInputChange('marketAnalysis', 'targetMarket', e.target.value)}
            placeholder="Describe your ideal customers or clients"
            rows={3}
                />
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market Size
          </label>
          <input
            type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
            value={businessPlanData.marketAnalysis.marketSize}
            onChange={(e) => handleInputChange('marketAnalysis', 'marketSize', e.target.value)}
            placeholder="Estimated size of your target market"
          />
        </div>
      </div>
    </div>
  );
      case 'products-services':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Products & Services</h2>
            <p className="text-gray-500 mb-6">Describe what you offer to customers.</p>

            <div className="space-y-4">
      <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product/Service Description <span className="text-red-500">*</span>
          </label>
          <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
            value={businessPlanData.productsServices.description}
            onChange={(e) => handleInputChange('productsServices', 'description', e.target.value)}
            placeholder="Describe your products or services in detail"
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
            onChange={(e) => handleInputChange('productsServices', 'uniqueSellingPoints', e.target.value)}
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
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Financial Information</h2>
            <p className="text-gray-500 mb-6">Provide financial details for your business plan.</p>

            <div className="space-y-4">
      <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Startup Costs <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
            value={businessPlanData.financialInfo.startupCosts}
            onChange={(e) => handleInputChange('financialInfo', 'startupCosts', e.target.value)}
            placeholder="Estimated costs to start your business"
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
            onChange={(e) => handleInputChange('financialInfo', 'expectedRevenue', e.target.value)}
            placeholder="Projected first year revenue"
          />
        </div>
      </div>
    </div>
  );
      case 'review':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Review Your Business Plan</h2>
            <p className="text-gray-500 mb-6">Review the information below before generating your business plan.</p>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-lg mb-2">Business Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                    <dd className="mt-1">{businessPlanData.businessInfo.name || 'Not provided'}</dd>
                  </div>
      <div>
                    <dt className="text-sm font-medium text-gray-500">Industry</dt>
                    <dd className="mt-1">{businessPlanData.businessInfo.industry || 'Not provided'}</dd>
                  </div>
          <div>
                    <dt className="text-sm font-medium text-gray-500">Legal Structure</dt>
                    <dd className="mt-1">{businessPlanData.businessInfo.legalStructure}</dd>
            </div>
                </dl>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-lg mb-2">Market Analysis</h3>
                <dl className="grid grid-cols-1 gap-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Target Market</dt>
                    <dd className="mt-1">{businessPlanData.marketAnalysis.targetMarket || 'Not provided'}</dd>
              </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Market Size</dt>
                    <dd className="mt-1">{businessPlanData.marketAnalysis.marketSize || 'Not provided'}</dd>
            </div>
                </dl>
        </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-lg mb-2">Products & Services</h3>
                <dl className="grid grid-cols-1 gap-y-2">
          <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1">{businessPlanData.productsServices.description || 'Not provided'}</dd>
            </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unique Selling Points</dt>
                    <dd className="mt-1">{businessPlanData.productsServices.uniqueSellingPoints || 'Not provided'}</dd>
            </div>
                </dl>
        </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-lg mb-2">Financial Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          <div>
                    <dt className="text-sm font-medium text-gray-500">Startup Costs</dt>
                    <dd className="mt-1">{businessPlanData.financialInfo.startupCosts || 'Not provided'}</dd>
            </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Expected Revenue</dt>
                    <dd className="mt-1">{businessPlanData.financialInfo.expectedRevenue || 'Not provided'}</dd>
            </div>
                </dl>
        </div>
      </div>
    </div>
  );
      default:
        return null;
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-primary mb-2">Create Your Business Plan</h1>
          <p className="text-brand-neutral-medium">Follow these steps to create a comprehensive business plan.</p>
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
            <div className={`text-center ${currentStep === 'business-info' ? 'text-brand-primary' : ''}`}>
              Business Info
            </div>
            <div className={`text-center ${currentStep === 'market-analysis' ? 'text-brand-primary' : ''}`}>
              Market Analysis
            </div>
            <div className={`text-center ${currentStep === 'products-services' ? 'text-brand-primary' : ''}`}>
              Products/Services
            </div>
            <div className={`text-center ${currentStep === 'financial-info' ? 'text-brand-primary' : ''}`}>
              Financial Info
            </div>
            <div className={`text-center ${currentStep === 'review' ? 'text-brand-primary' : ''}`}>
              Review
            </div>
            </div>
          </div>

        {/* Step content */}
        <Card className="mb-6">
              {renderStep()}
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          {currentStep !== 'business-info' ? (
            <Button 
              variant="outline"
              leftIcon={ArrowLeft}
                  onClick={handlePreviousStep}
            >
                  Previous
            </Button>
          ) : (
            <div></div>
          )}
                
          {currentStep !== 'review' ? (
            <Button 
              variant="default"
              rightIcon={ArrowRight}
                    onClick={handleNextStep}
              disabled={!isCurrentStepValid()}
                  >
                    Next
            </Button>
          ) : (
            <Button 
              variant="gradient"
              leftIcon={Save}
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Business Plan
            </Button>
                )}
        </div>
      </div>
    </div>
  );
};

export default BusinessPlanWizard; 