import React, { useState } from 'react';
import { BarChart2, PieChart, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, ChevronRight, Calendar, Users, Target } from 'lucide-react';
import DataCard from '../components/ui/DataCard';

const DashboardPage: React.FC = () => {
  const [activeTimeframe, setActiveTimeframe] = useState<string>('month');
  
  // Revenue data for a typical development company
  const revenueData = [
    { name: 'Custom Development', value: 45, amount: 57825, color: 'rgba(59, 130, 246, 0.8)' },
    { name: 'Maintenance & Support', value: 20, amount: 25700, color: 'rgba(16, 185, 129, 0.8)' },
    { name: 'Implementation Services', value: 15, amount: 19275, color: 'rgba(139, 92, 246, 0.8)' },
    { name: 'SaaS Products', value: 10, amount: 12850, color: 'rgba(245, 158, 11, 0.8)' },
    { name: 'Training & Workshops', value: 5, amount: 6425, color: 'rgba(239, 68, 68, 0.8)' },
    { name: 'Consulting', value: 5, amount: 6425, color: 'rgba(14, 165, 233, 0.8)' },
  ];

  // Calculate total expenses based on revenue and profit margin
  const totalRevenue = 128500;
  const profitMargin = 0.32;
  const totalExpenses = Math.round(totalRevenue * (1 - profitMargin));

  // Expense data for a typical development company
  const expenseData = [
    { name: 'Developer Salaries', value: 65, amount: Math.round(totalExpenses * 0.65), color: 'rgba(239, 68, 68, 0.8)' },
    { name: 'Office & Equipment', value: 10, amount: Math.round(totalExpenses * 0.10), color: 'rgba(245, 158, 11, 0.8)' },
    { name: 'Software Licenses', value: 8, amount: Math.round(totalExpenses * 0.08), color: 'rgba(139, 92, 246, 0.8)' },
    { name: 'Marketing & Sales', value: 7, amount: Math.round(totalExpenses * 0.07), color: 'rgba(16, 185, 129, 0.8)' },
    { name: 'Admin & Operations', value: 5, amount: Math.round(totalExpenses * 0.05), color: 'rgba(59, 130, 246, 0.8)' },
    { name: 'Hosting & Infrastructure', value: 5, amount: Math.round(totalExpenses * 0.05), color: 'rgba(14, 165, 233, 0.8)' },
  ];
  
  return (
    <div className="py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-semibold text-brand.primary">Business Plan Dashboard</h1>
        
        <div className="mt-3 sm:mt-0 bg-white rounded-lg shadow-card border border-brand.neutral.200 p-1 flex">
          <button 
            onClick={() => setActiveTimeframe('week')}
            className={`px-3 py-1.5 text-sm rounded ${activeTimeframe === 'week' 
              ? 'bg-blue-50 text-nexus-blue font-medium' 
              : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setActiveTimeframe('month')}
            className={`px-3 py-1.5 text-sm rounded ${activeTimeframe === 'month' 
              ? 'bg-blue-50 text-nexus-blue font-medium' 
              : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setActiveTimeframe('year')}
            className={`px-3 py-1.5 text-sm rounded ${activeTimeframe === 'year' 
              ? 'bg-blue-50 text-nexus-blue font-medium' 
              : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Yearly
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard className="text-center">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-50 text-brand.primary">
              <BarChart2 className="h-6 w-6" />
            </div>
            <span className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              12%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Revenue Projection</h3>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold">$128,500</p>
            <span className="ml-2 text-sm text-gray-500">USD</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a href="#" className="text-brand.primary text-sm font-medium inline-flex items-center">
              View details <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </div>
        </DataCard>
        
        <DataCard className="text-center">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              5%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Profit Margin</h3>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold">32%</p>
            <span className="ml-2 text-sm text-gray-500">avg</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a href="#" className="text-brand.primary text-sm font-medium inline-flex items-center">
              View details <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </div>
        </DataCard>
        
        <DataCard className="text-center">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <PieChart className="h-6 w-6" />
            </div>
            <span className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              2.1%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Market Share</h3>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold">8.5%</p>
            <span className="ml-2 text-sm text-gray-500">total</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a href="#" className="text-brand.primary text-sm font-medium inline-flex items-center">
              View details <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </div>
        </DataCard>
        
        <DataCard className="text-center">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="flex items-center text-red-600 text-sm font-medium">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              3%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mt-4">Startup Costs</h3>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold">$42,000</p>
            <span className="ml-2 text-sm text-gray-500">USD</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a href="#" className="text-brand.primary text-sm font-medium inline-flex items-center">
              View details <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </div>
        </DataCard>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataCard>
          <h2 className="text-lg font-semibold mb-4">Revenue Streams</h2>
          <div className="h-80 flex items-end justify-center">
            {revenueData.map((item, index) => (
              <div key={index} className="mx-2 flex flex-col items-center">
                <div className="text-xs font-medium text-gray-800 mb-1">
                  ${item.amount.toLocaleString()}
                </div>
                <div 
                  className="w-20 rounded-t-md shadow-sm flex flex-col justify-end items-center"
                  style={{
                    height: `${item.value * 2.2}px`, 
                    backgroundColor: item.color
                  }}
                >
                  <span className="text-xs font-medium text-white py-1">{item.value}%</span>
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium text-gray-700">{item.name.split(' ')[0]}</div>
                  <div className="text-xs text-gray-500">{item.name.includes(' ') ? item.name.split(' ').slice(1).join(' ') : ''}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              {revenueData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-gray-700">{item.name} (${item.amount.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>
        </DataCard>
        
        <DataCard>
          <h2 className="text-lg font-semibold mb-4">Expense Distribution (${totalExpenses.toLocaleString()})</h2>
          <div className="h-80 flex items-center justify-center">
            <svg width="240" height="240" viewBox="0 0 100 100">
              {expenseData.map((item, index) => {
                // Calculate pie segments
                const total = expenseData.reduce((sum, item) => sum + item.value, 0);
                
                // Calculate start and end angles
                let startAngle = 0;
                expenseData.slice(0, index).forEach(d => {
                  startAngle += (d.value / total) * 360;
                });
                const endAngle = startAngle + (item.value / total) * 360;
                
                // Convert angles to radians
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                // Calculate path coordinates
                const x1 = 50 + 45 * Math.cos(startRad);
                const y1 = 50 + 45 * Math.sin(startRad);
                const x2 = 50 + 45 * Math.cos(endRad);
                const y2 = 50 + 45 * Math.sin(endRad);
                
                // Determine if the arc should be drawn as a large arc
                const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                
                // Path string for the pie segment
                const pathData = `
                  M 50 50
                  L ${x1} ${y1}
                  A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}
                  Z
                `;
                
                // Label positioning (middle of the arc)
                const midAngle = (startAngle + endAngle) / 2;
                const midRad = (midAngle - 90) * Math.PI / 180;
                
                // Position for percentage
                const labelX = 50 + 30 * Math.cos(midRad);
                const labelY = 50 + 30 * Math.sin(midRad);
                
                // Position for dollar amount (slightly outward)
                const amountX = 50 + 38 * Math.cos(midRad);
                const amountY = 50 + 38 * Math.sin(midRad);
                
                return (
                  <g key={index}>
                    <path
                      d={pathData}
                      fill={item.color}
                      stroke="#fff"
                      strokeWidth="1"
                    />
                    {item.value >= 8 && (
                      <>
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          fill="white"
                          fontSize="4"
                          fontWeight="bold"
                        >
                          {item.value}%
                        </text>
                        {item.value >= 10 && (
                          <text
                            x={amountX}
                            y={amountY}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill="white"
                            fontSize="3"
                          >
                            ${(item.amount / 1000).toFixed(0)}K
                          </text>
                        )}
                      </>
                    )}
                  </g>
                );
              })}
              <circle cx="50" cy="50" r="15" fill="white" stroke="#f3f4f6" strokeWidth="1" />
              <text x="50" y="48" textAnchor="middle" alignmentBaseline="middle" fontSize="5" fontWeight="bold" fill="#374151">Expenses</text>
              <text x="50" y="54" textAnchor="middle" alignmentBaseline="middle" fontSize="4" fill="#6b7280">${totalExpenses.toLocaleString()}</text>
            </svg>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              {expenseData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-gray-700">{item.name} (${item.amount.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>
        </DataCard>
      </div>
      
      <DataCard className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Business Plan Timeline</h2>
        <div className="space-y-6">
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-nexus-blue rounded-full">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="w-0.5 h-full bg-gray-200 mt-3"></div>
            </div>
            <div className="pb-2">
              <div className="flex items-center">
                <p className="font-semibold">Business Setup & Product Development</p>
                <span className="ml-3 px-2.5 py-0.5 bg-blue-50 text-nexus-blue text-xs font-medium rounded-full">Current</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Month 1-3</p>
              <p className="text-sm text-gray-600 mt-2">Register business, develop MVP, initial market testing</p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full">
                <Users className="h-5 w-5" />
              </div>
              <div className="w-0.5 h-full bg-gray-200 mt-3"></div>
            </div>
            <div className="pb-2">
              <p className="font-semibold">Marketing & Initial Sales</p>
              <p className="text-sm text-gray-500 mt-1">Month 4-6</p>
              <p className="text-sm text-gray-600 mt-2">Launch marketing campaign, acquire first customers</p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="w-0.5 h-full bg-gray-200 mt-3"></div>
            </div>
            <div className="pb-2">
              <p className="font-semibold">Scaling Operations</p>
              <p className="text-sm text-gray-500 mt-1">Month 7-9</p>
              <p className="text-sm text-gray-600 mt-2">Hire additional staff, expand product offerings</p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="font-semibold">Expansion & Growth</p>
              <p className="text-sm text-gray-500 mt-1">Month 10-12</p>
              <p className="text-sm text-gray-600 mt-2">Enter new markets, seek additional funding if needed</p>
            </div>
          </div>
        </div>
      </DataCard>
    </div>
  );
};

export default DashboardPage; 