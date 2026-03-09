import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Target, DollarSign, TrendingUp } from 'lucide-react';
import { api, WorkspaceOut } from '../../lib/api';

// Placeholder type for a KPI - we can refine this later
interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  sourceField?: keyof BusinessPlanData['financialInfo'] | keyof BusinessPlanData['marketAnalysis']; // Link to data model if possible
  icon?: React.ReactNode;
}

// Placeholder type for BusinessPlanData - replace with actual import if available elsewhere
interface BusinessPlanData {
  financialInfo: {
    startupCosts: string;
    expectedRevenue: string;
    breakEvenPoint: string;
    fundingNeeds: string;
  };
  marketAnalysis: {
    targetMarket: string;
    marketSize: string;
    competitors: string;
    trends: string;
  };
  // Add other sections if needed
}


const recommendedKpis: KpiDefinition[] = [
  {
    id: 'revenue-target',
    name: 'Revenue Target',
    description: 'Track progress towards your expected revenue goal.',
    sourceField: 'expectedRevenue',
    icon: <DollarSign className="w-5 h-5 text-green-600" />
  },
  {
    id: 'startup-budget',
    name: 'Startup Cost Budget',
    description: 'Monitor spending against your planned startup costs.',
    sourceField: 'startupCosts',
    icon: <DollarSign className="w-5 h-5 text-red-600" />
  },
  {
    id: 'funding-goal',
    name: 'Funding Goal',
    description: 'Track progress towards securing necessary funding.',
    sourceField: 'fundingNeeds',
    icon: <TrendingUp className="w-5 h-5 text-blue-600" />
  },
  {
    id: 'market-size-goal',
    name: 'Market Size Target',
    description: 'Define goals based on the total market size.',
    sourceField: 'marketSize',
    icon: <Target className="w-5 h-5 text-purple-600" />
  },
];

const SetKpisPage: React.FC = () => {
  const [kpis, setKpis] = useState<{ id: number; name: string; metric_key: string; target_value: number | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    api<WorkspaceOut[]>('/workspaces')
      .then((ws) => {
        const intel = ws.find((w) => w.workspace_type === 'intelligence');
        setWorkspaceId(intel?.id ?? null);
        if (!intel) return [];
        return api<{ id: number; name: string; metric_key: string; target_value: number | null }[]>(`/kpis?workspace_id=${intel.id}`);
      })
      .then(setKpis)
      .catch(() => setKpis([]));
  }, []);

  const handleAddKpi = async (kpiId: string) => {
    const kpi = recommendedKpis.find((k) => k.id === kpiId);
    if (!kpi) return;
    if (workspaceId === null) {
      alert('No Intelligence workspace. Create one from Choose workspace.');
      return;
    }
    setLoading(true);
    try {
      const created = await api<{ id: number; name: string; metric_key: string; target_value: number | null }>(`/kpis?workspace_id=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({
          name: kpi.name,
          metric_key: kpi.sourceField || kpi.id,
          target_value: null,
          unit: '',
          description: kpi.description,
        }),
      });
      setKpis((prev) => [...prev, created]);
      alert(`KPI "${kpi.name}" added successfully`);
    } catch (e) {
      alert('Failed to add KPI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Set Key Performance Indicators (KPIs)</h1>
        <p className="text-gray-600 mt-2">
          Define and track the metrics that matter most to your business success based on your plan.
        </p>
      </div>

      {/* Recommended KPIs Section - Refactored */}
      <Card 
        title="Recommended KPIs"
        subtitle="Based on your business plan data, consider tracking these common metrics."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"> {/* Added pt-4 for spacing after header */}
          {recommendedKpis.map((kpi) => (
            <div key={kpi.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                {kpi.icon && <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white">{kpi.icon}</div>}
                <div>
                  <p className="font-semibold">{kpi.name}</p>
                  <p className="text-sm text-gray-500">{kpi.description}</p>
                  {kpi.sourceField && <p className="text-xs text-gray-400 italic">Source: {kpi.sourceField}</p>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleAddKpi(kpi.id)} disabled={loading}>
                Track
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Your KPIs */}
      {kpis.length > 0 && (
        <Card title="Your KPIs" subtitle="KPIs you are tracking.">
          <div className="pt-4 space-y-2">
            {kpis.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-sm text-gray-500">{k.metric_key}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Custom KPI Creation Section */}
      <Card
        title="Create Custom KPI"
        subtitle="Define your own specific KPIs based on available data fields."
      >
        <div className="pt-4">
          <p className="text-center text-gray-500 py-8">
            Custom KPI creation form coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SetKpisPage; 