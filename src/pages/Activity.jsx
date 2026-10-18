import PageHeader from '../components/layout/PageHeader.jsx';
import ExportMenu from '../components/layout/ExportMenu.jsx';
import { RecentActivityCard } from '../components/dashboard/TeamSection.jsx';

export default function Activity() {
  return (
    <>
      <PageHeader title="Recent Activity" subtitle="Everything the team did in the selected period. Filter by record type or employee." actions={<ExportMenu />} />
      <RecentActivityCard withExport pageSize={15} />
    </>
  );
}
