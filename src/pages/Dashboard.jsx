import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, DollarSign, Package, Users, ArrowRight } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ExportMenu from '../components/layout/ExportMenu.jsx';
import { SectionTitle } from '../components/ui/Card.jsx';
import { LeadKpis, LeadCharts } from '../components/dashboard/LeadSection.jsx';
import { QuotationKpis, QuotationCharts } from '../components/dashboard/QuotationSection.jsx';
import { DealKpis, DealCharts } from '../components/dashboard/DealsSection.jsx';
import { OrderKpis, StageProgressCard } from '../components/dashboard/OrdersSection.jsx';
import { SalesTeamCard, OpsTeamCard, RecentActivityCard } from '../components/dashboard/TeamSection.jsx';

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton h-64 rounded-xl" />)}</div>
    </div>
  );
}

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 350); return () => clearTimeout(t); }, []);

  return (
    <>
      <PageHeader title="Business Performance & Revenue Analytics" subtitle="Leads, quotations, deals, orders and revenue in one place. Every number is calculated from the records underneath it." actions={<ExportMenu />} />
      {!ready ? <Skeleton /> : (
        <>
          <SectionTitle icon={Users}>Lead Analytics</SectionTitle>
          <LeadKpis />
          <LeadCharts />

          <SectionTitle icon={FileText}>Quotation Analytics</SectionTitle>
          <QuotationKpis />
          <QuotationCharts />

          <SectionTitle icon={DollarSign}>Deals & Revenue</SectionTitle>
          <DealKpis />
          <DealCharts />

          <SectionTitle icon={Package} extra={<Link to="/orders" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">Full orders & payments view <ArrowRight size={14} /></Link>}>Orders & Payments</SectionTitle>
          <OrderKpis />

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-7"><SalesTeamCard /></div>
            <div className="min-w-0 xl:col-span-5"><OpsTeamCard /></div>
            <div className="min-w-0 xl:col-span-4"><StageProgressCard /></div>
            <div className="min-w-0 xl:col-span-8"><RecentActivityCard /></div>
          </div>
        </>
      )}
    </>
  );
}
