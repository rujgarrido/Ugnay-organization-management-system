import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AccountPage } from "@/pages/AccountPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { MembersPage } from "@/pages/MembersPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OrganizationPositionsPage } from "@/pages/OrganizationPositionsPage";
import { OrganizationProfilePage } from "@/pages/OrganizationProfilePage";
import { OrganizationSettingsLayout } from "@/pages/OrganizationSettingsLayout";
import { ProjectBoardPage } from "@/pages/ProjectBoardPage";
import { ProjectLayoutPage } from "@/pages/ProjectLayoutPage";
import { ProjectOverviewPage } from "@/pages/ProjectOverviewPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProposalLayoutPage } from "@/pages/ProposalLayoutPage";
import { ProposalSignaturesPage } from "@/pages/ProposalSignaturesPage";
import { ProposalStatusPage } from "@/pages/ProposalStatusPage";
import { ProposalsPage } from "@/pages/ProposalsPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ProtectedRoute } from "@/routes/protected-route";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/organization" element={<OrganizationSettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<OrganizationProfilePage />} />
            <Route path="positions" element={<OrganizationPositionsPage />} />
          </Route>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectLayoutPage />}>
            <Route index element={<Navigate to="board" replace />} />
            <Route path="board" element={<ProjectBoardPage />} />
            <Route path="overview" element={<ProjectOverviewPage />} />
          </Route>
          <Route path="/proposals" element={<ProposalsPage />} />
          <Route path="/proposals/:proposalId" element={<ProposalLayoutPage />}>
            <Route index element={<Navigate to="status" replace />} />
            <Route path="status" element={<ProposalStatusPage />} />
            <Route path="signatures" element={<ProposalSignaturesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
