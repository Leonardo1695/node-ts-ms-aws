import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell';
import { AssetDetailPage } from './pages/asset-detail-page';
import { ControlPanelPage } from './pages/control-panel-page';
import { IdlingReportPage } from './pages/idling-report-page';
import { OverviewPage } from './pages/overview-page';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="assets/:assetId" element={<AssetDetailPage />} />
        <Route path="reports/idling" element={<IdlingReportPage />} />
        <Route path="control" element={<ControlPanelPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
