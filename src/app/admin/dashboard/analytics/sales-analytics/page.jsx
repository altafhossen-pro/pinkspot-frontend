'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, Calendar, AlertCircle, ShoppingCart, 
  BarChart3, PieChart as PieChartIcon, Clock, Users, MapPin, Tag,
  PackageX, Activity, Eye, X
} from 'lucide-react';
import { analyticsAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import Image from 'next/image';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const formatCurrency = (amount) => {
  return `৳ ${Math.round(amount || 0).toLocaleString()}`;
};

// --- Subcomponents for Cards ---

function SalesOverviewCard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const res = await analyticsAPI.getSalesAnalytics({ startDate: firstDayOfYear, groupBy: 'month' }, token);
        if (res.success) {
          const formatted = res.data.map(item => ({
            name: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
            sales: item.totalSales,
            orders: item.totalOrders
          }));
          setData(formatted);
        }
      } catch (error) {
        console.error('Error fetching sales overview:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Monthly Sales Trend (This Year)
        </h2>
      </div>
      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `৳${val/1000}k`} />
              <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function DailySalesOverviewCard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const res = await analyticsAPI.getSalesAnalytics({ startDate: thirtyDaysAgo.toISOString(), groupBy: 'day' }, token);
        if (res.success) {
          const last30Days = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last30Days.push({
              dateString: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
              name: d.toLocaleString('default', { month: 'short', day: 'numeric' }),
              sales: 0,
              orders: 0
            });
          }

          res.data.forEach(item => {
            const dateStr = `${item._id.year}-${item._id.month}-${item._id.day}`;
            const foundIndex = last30Days.findIndex(d => d.dateString === dateStr);
            if (foundIndex !== -1) {
              last30Days[foundIndex].sales = item.totalSales;
              last30Days[foundIndex].orders = item.totalOrders;
            }
          });

          setData(last30Days);
        }
      } catch (error) {
        console.error('Error fetching daily sales:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-500" />
          Daily Sales Trend (Last 30 Days)
        </h2>
      </div>
      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDailySales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 10}} minTickGap={20} />
              <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `৳${val/1000}k`} />
              <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val) => formatCurrency(val)} />
              <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDailySales)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function OrdersByDayCard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getOrdersByDayOfWeek(token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching orders by day:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-500" />
          Orders by Day of Week (All Time)
        </h2>
      </div>
      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="orderCount" name="Total Orders" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function TopProductsCard({ token }) {
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getAdvancedTopProducts(timeframe, token);
        if (res.success) {
          setData(res.data.topProducts || []);
        }
      } catch (error) {
        console.error('Error fetching top products:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe, token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          Top Selling Products
        </h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Product</th>
              <th className="px-6 py-3 font-medium text-center">Qty Sold</th>
              <th className="px-6 py-3 font-medium text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 relative">
            {loading ? (
              <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
            ) : data.length > 0 ? (
              data.map((product, index) => (
                <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                        {product.featuredImage ? (
                          <Image src={product.featuredImage} alt={product.title} fill className="object-cover" />
                        ) : (
                          <Package className="w-5 h-5 m-2.5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1" title={product.title}>{product.title}</p>
                        <span className="text-xs text-slate-500">Rank #{index + 1}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {product.totalQuantitySold}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-900">
                    {formatCurrency(product.totalRevenue)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                  No product sales found for {timeframe}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryPerformanceCard({ token }) {
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let dateRange = {};
        const now = new Date();
        if (timeframe === 'today') {
          const today = new Date(now.setHours(0,0,0,0)).toISOString();
          dateRange = { startDate: today, endDate: new Date().toISOString() };
        } else if (timeframe === 'week') {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          dateRange = { startDate: lastWeek.toISOString(), endDate: new Date().toISOString() };
        } else if (timeframe === 'month') {
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          dateRange = { startDate: firstDay, endDate: new Date().toISOString() };
        } else if (timeframe === 'year') {
          const firstDay = new Date(now.getFullYear(), 0, 1).toISOString();
          dateRange = { startDate: firstDay, endDate: new Date().toISOString() };
        }

        const res = await analyticsAPI.getCategoryPerformance(dateRange, token);
        if (res.success) {
          setData(res.data || []);
        }
      } catch (error) {
        console.error('Error fetching category performance:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe, token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-purple-500" />
          Sales by Category
        </h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>
      ) : data.length > 0 ? (
        <div className="flex flex-col lg:flex-row items-center gap-4 flex-1">
          <div className="h-52 w-full lg:w-1/2 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="totalRevenue"
                  nameKey="categoryName"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 space-y-3 overflow-y-auto pr-2 max-h-52">
            {data.map((category, index) => (
              <div key={category._id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-700 font-medium truncate max-w-[120px]" title={category.categoryName}>{category.categoryName}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatCurrency(category.totalRevenue)}</div>
                  <div className="text-xs text-slate-500">{category.totalQuantitySold} items sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          No category data for {timeframe === 'all' ? 'all time' : 'this period'}.
        </div>
      )}
    </div>
  );
}

function InventoryMovementCard({ token }) {
  const [data, setData] = useState({ fastMoving: [], slowMoving: [], needsRestock: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getInventoryMovement(token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching inventory movement:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-64 flex items-center justify-center">
        <div className="text-slate-400">Loading Inventory Data...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-500" />
            Inventory Movement & Restock Estimations
          </h2>
          <p className="text-sm text-slate-500 mt-1">Based on sales velocity over the last 30 days (Static Window)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Needs Restock */}
        <div className="p-6 bg-red-50/30">
          <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Critical: Needs Restock
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {data.needsRestock?.length > 0 ? (
              data.needsRestock.map(item => (
                <div key={item._id} className="flex justify-between items-start pb-3 border-b border-slate-100/50 last:border-0 last:pb-0 bg-white p-3 rounded-lg shadow-sm">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2" title={item.title}>{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Stock: {item.currentStock} • Runs out in <span className="font-bold text-red-600">{item.daysUntilOOS} days</span></p>
                  </div>
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Sells ~{Math.round(item.velocityPerDay)} / day
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic bg-white p-3 rounded-lg">No products need immediate restock.</p>
            )}
          </div>
        </div>

        {/* Fast Moving */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Fast Moving (Top 10)
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {data.fastMoving?.length > 0 ? (
              data.fastMoving.map(item => (
                <div key={item._id} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="pr-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden relative shrink-0">
                      {item.featuredImage ? (
                        <Image src={item.featuredImage} alt={item.title} fill className="object-cover" />
                      ) : <Package className="w-4 h-4 m-2 text-slate-400" />}
                    </div>
                    <p className="text-sm font-medium text-slate-900 line-clamp-1" title={item.title}>{item.title}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {item.sold30d} sold
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No fast moving products found.</p>
            )}
          </div>
        </div>

        {/* Slow Moving */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Slow Moving (Bottom 10)
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {data.slowMoving?.length > 0 ? (
              data.slowMoving.map(item => (
                <div key={item._id} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="pr-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden relative shrink-0">
                      {item.featuredImage ? (
                        <Image src={item.featuredImage} alt={item.title} fill className="object-cover" />
                      ) : <Package className="w-4 h-4 m-2 text-slate-400" />}
                    </div>
                    <p className="text-sm font-medium text-slate-900 line-clamp-1" title={item.title}>{item.title}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {item.sold30d} sold
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No slow moving products found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerRetentionCard({ token }) {
  const [data, setData] = useState(null);
  const [timeframe, setTimeframe] = useState('year');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getCustomerRetention(timeframe, token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching retention:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe, token]);

  const pieData = data ? [
    { name: 'New Customers', value: data.newRevenue },
    { name: 'Returning Customers', value: data.returningRevenue }
  ] : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-500" />
          Customer Retention
        </h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>
      ) : data && (data.newRevenue > 0 || data.returningRevenue > 0) ? (
        <div className="flex flex-col items-center flex-1">
          <div className="h-48 w-full shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={70}
                  paddingAngle={5} dataKey="value"
                >
                  <Cell fill="#06b6d4" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full mt-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-sm font-medium text-slate-700">New Customers ({data.newCount})</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(data.newRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm font-medium text-slate-700">Returning ({data.returningCount})</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(data.returningRevenue)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No data for {timeframe}</div>
      )}
    </div>
  );
}

function SalesByTimeCard({ token }) {
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getSalesByTimeOfDay(timeframe, token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching time of day:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe, token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          Sales Heatmap (Time of Day)
        </h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 10}} interval={2} />
              <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
              <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}


function CouponAnalyticsCard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getCouponAnalytics(token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <Tag className="h-5 w-5 text-fuchsia-500" />
        Top Coupon Usage
      </h2>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">Coupon Code</th>
              <th className="px-4 py-3 font-medium text-center">Uses</th>
              <th className="px-4 py-3 font-medium text-right">Given Discount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-900 uppercase">
                    <div className="inline-block px-2 py-1 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 rounded">
                      {item._id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700">{item.usageCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(item.totalDiscountGiven)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-500">No coupon usage found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function OrderStatusCard({ token }) {
  const [data, setData] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getOrderStatusReport(timeframe, token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe, token]);

  const pieData = data?.statusBreakdown?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const COLORS_MAP = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#6366f1',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
    returned: '#f43f5e'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-rose-500" />
          Order Status Report
        </h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>
      ) : data ? (
        <div className="flex flex-col lg:flex-row items-center gap-4 flex-1">
          <div className="h-72 w-full lg:w-1/2 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 space-y-3 overflow-y-auto pr-2 max-h-72">
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Total Orders:</span>
                <span className="font-bold text-slate-900">{data.totalOrders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Sent to Steadfast:</span>
                <span className="font-bold text-blue-600">{data.steadfastCount}</span>
              </div>
            </div>
            
            {pieData.map((status, index) => (
              <div key={status.name} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS_MAP[status.name] || '#94a3b8' }}></div>
                  <span className="text-slate-700 font-medium capitalize">{status.name}</span>
                </div>
                <div className="font-bold text-slate-900">{status.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No data</div>
      )}
    </div>
  );
}

function OrderSourceCard({ token }) {
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getOrderSourceReport(timeframe, token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching order source:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe, token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-teal-500" />
          Order Source Breakdown
        </h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="h-72 w-full flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis dataKey="_id" type="category" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12, textTransform: 'capitalize'}} width={100} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
              <Bar dataKey="count" name="Total Orders" fill="#14b8a6" radius={[0, 4, 4, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data</div>
        )}
      </div>
    </div>
  );
}


function AovTrendCard({ token }) {
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('year');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getAovTrend(timeframe, token);
        if (res.success) {
          const formatted = res.data.map(item => ({
            name: timeframe === 'month' 
              ? `${item._id.day}/${item._id.month}` 
              : new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
            aov: item.avgOrderValue || 0
          }));
          setData(formatted);
        }
      } catch (error) {
        console.error('Error fetching AOV:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [timeframe, token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          Average Order Value (AOV)
        </h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none cursor-pointer"
        >
          <option value="month">Last 30 Days</option>
          <option value="year">This Year</option>
        </select>
      </div>
      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAov" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} minTickGap={20} />
              <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `৳${val/1000}k`} />
              <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{borderRadius: '8px', border: 'none'}} formatter={(val) => formatCurrency(val)} />
              <Area type="monotone" dataKey="aov" name="Avg Order Value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAov)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function TopCustomersCard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getTopCustomers(token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching top customers:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <Users className="h-5 w-5 text-amber-500" />
        Top Spending Customers
      </h2>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium text-center">Orders</th>
              <th className="px-4 py-3 font-medium text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-600 font-semibold text-xs">{item.name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 line-clamp-1">{item.name || 'Unknown User'}</div>
                        <div className="text-xs text-slate-500">{item.phone || item.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-slate-700">{item.orderCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(item.totalSpent)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReturnAnalyticsCard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getReturnAnalytics(token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching return analytics:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <PackageX className="h-5 w-5 text-red-500" />
        Product Return Analytics
      </h2>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium text-center">Returned</th>
              <th className="px-4 py-3 font-medium text-right">Lost Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.featuredImage && (
                        <div className="w-8 h-8 rounded-md bg-slate-100 shrink-0 overflow-hidden">
                          <img src={item.featuredImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="font-medium text-slate-900 line-clamp-1" title={item.title}>{item.title}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-red-600">{item.returnCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(item.lostRevenue)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-500">No returned products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentActivityCard({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getRecentActivity(token);
        if (res.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'returned': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
            Live Activity Feed
          </h2>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading...</div>
          ) : data.length > 0 ? (
            data.map((item, index) => (
              <div key={item._id || index} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-slate-900">
                      <span className="text-slate-600">Order</span> #{item.orderId || 'New'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    <span className="font-semibold text-slate-800">{item.name}</span> ordered {item.itemCount} items for <span className="font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <button 
                      onClick={() => setSelectedOrder(item)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="w-3 h-3" /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">No recent activity.</div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Order #{selectedOrder.orderId}
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Shipping Information</h4>
                <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{selectedOrder.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-900">{selectedOrder.phone || 'N/A'}</span></div>
                  
                  <div className="flex justify-between border-t border-slate-200 mt-2 pt-2">
                    <span className="text-slate-500">Address:</span> 
                    <span className="font-medium text-slate-900 text-right max-w-[200px]">
                      {(() => {
                        const street = selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address || '';
                        const city = selectedOrder.shippingAddress?.city || '';
                        if (street && city) return `${street}, ${city}`;
                        if (street) return street;
                        if (city) return city;
                        return 'No address provided';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Order Items ({selectedOrder.itemCount})</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-sm hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-200 overflow-hidden shrink-0">
                          {item.product?.featuredImage ? (
                            <img src={item.product.featuredImage} alt={item.product?.title || 'Product'} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400 m-2.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 line-clamp-1">{item.product?.title || 'Unknown Product'}</div>
                          <div className="text-slate-500 text-xs">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        {formatCurrency((item.quantity || 1) * (item.price || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Summary */}
              <div className="flex flex-col gap-4">
                {selectedOrder.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Order Notes</h4>
                    <p className="text-sm bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
                
                <div className="bg-emerald-50 text-emerald-900 p-4 rounded-lg flex flex-col gap-2 border border-emerald-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-700">Delivery Charge:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.deliveryCharge || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-emerald-200/50 pt-2">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-lg font-bold">{formatCurrency(selectedOrder.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Main Page Component ---

export default function SalesAnalyticsPage() {
  const token = getCookie('token');

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Advanced Sales & Inventory Analytics
            </h1>
            <p className="text-sm text-slate-500">Comprehensive, real-time insights into your business performance</p>
          </div>
        </div>
      </div>

      <div className="p-6 w-full mx-auto space-y-6">
        
        {/* Row 1: Sales Overview (Monthly & Daily) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesOverviewCard token={token} />
          <DailySalesOverviewCard token={token} />
        </div>

        {/* Row 2: Customer Retention, Time of Day, Orders by Day */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <OrdersByDayCard token={token} />
          <CustomerRetentionCard token={token} />
          <SalesByTimeCard token={token} />
        </div>

        {/* Row 3: Top Products */}
        <div className="w-full">
          <TopProductsCard token={token} />
        </div>

        {/* Row 4: AOV & Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AovTrendCard token={token} />
          <CategoryPerformanceCard token={token} />
        </div>

        {/* Row 5: Top Customers & Return Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopCustomersCard token={token} />
          <ReturnAnalyticsCard token={token} />
        </div>

        {/* Row 6: Order Status & Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderStatusCard token={token} />
          <OrderSourceCard token={token} />
        </div>

        {/* Row 7: Live Feed & Coupons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivityCard token={token} />
          <CouponAnalyticsCard token={token} />
        </div>

        {/* Row 8: Inventory Movement */}
        <div className="w-full">
          <InventoryMovementCard token={token} />
        </div>

      </div>
    </div>
  );
}
