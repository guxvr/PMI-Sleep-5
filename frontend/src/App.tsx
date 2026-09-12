import { lazy, Suspense, useEffect, useState } from "react";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Drawer,
  Select,
  Tooltip,
} from "@mantine/core";
import {
  Bell,
  BookOpen,
  ChevronDown,
  Command,
  Database,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sprout,
  Users,
  X,
} from "lucide-react";
import { Brand } from "./components/common";
import { AnalysisModal } from "./components/AnalysisModal";
import { useStore } from "./services/store-context";
import { clients } from "./services/gateway";
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Portfolio = lazy(() =>
  import("./pages/Portfolio").then((module) => ({ default: module.Portfolio })),
);
const Report = lazy(() =>
  import("./pages/Report").then((module) => ({ default: module.Report })),
);
const Alerts = lazy(() =>
  import("./pages/Alerts").then((module) => ({ default: module.Alerts })),
);
const Chat = lazy(() =>
  import("./pages/Chat").then((module) => ({ default: module.Chat })),
);
const Sources = lazy(() =>
  import("./pages/Sources").then((module) => ({ default: module.Sources })),
);
const Governance = lazy(() =>
  import("./pages/Governance").then((module) => ({
    default: module.Governance,
  })),
);
const navigation = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/carteira", label: "Carteira de clientes", icon: Users },
  { to: "/alertas", label: "Central de alertas", icon: Bell },
  { to: "/agente", label: "Assistente de risco", icon: MessageSquare },
  { to: "/fontes", label: "Fontes e contexto agro", icon: Database },
  { to: "/governanca", label: "Políticas e auditoria", icon: ShieldCheck },
];
export default function App() {
  const [newAnalysis, setNewAnalysis] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const { storageError } = useStore();
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  const active = navigation.find((n) =>
    n.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(n.to),
  );
  const sidebar = (
    <>
      <Brand />
      <div className="workspace-switch">
        <div className="workspace-icon">
          <Sprout size={18} />
        </div>
        <div>
          <b>Workspace Krilltech</b>
          <span>Operação Brasil</span>
        </div>
        <ChevronDown size={14} />
      </div>
      <div className="nav-caption">INTELIGÊNCIA DE CRÉDITO</div>
      <nav>
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setMobile(false)}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={19} />
            <span>{label}</span>
            {to === "/agente" && <span className="nav-ai">AI</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-card">
          <span className="status-dot" />
          <b>Modo de demonstração</b>
          <p>Explore a jornada com dados sintéticos do projeto.</p>
        </div>
        <button
          className="profile"
          onClick={() => nav("/governanca?tab=auditoria")}
        >
          <Avatar radius="xl" size={34} color="teal">
            AC
          </Avatar>
          <span>
            <b>Ana Costa</b>
            <small>Analista · perfil demonstrativo</small>
          </span>
          <ChevronDown size={14} />
        </button>
      </div>
    </>
  );
  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">{sidebar}</aside>
      <Drawer
        opened={mobile}
        onClose={() => setMobile(false)}
        size={270}
        withCloseButton={false}
      >
        <div className="mobile-sidebar">
          <ActionIcon
            className="mobile-close"
            variant="subtle"
            aria-label="Fechar menu"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </ActionIcon>
          {sidebar}
        </div>
      </Drawer>
      <div className="app-area">
        <header className="topbar">
          <div className="breadcrumb">
            <ActionIcon
              className="mobile-menu"
              variant="subtle"
              onClick={() => setMobile(true)}
              aria-label="Abrir menu"
            >
              <Menu size={21} />
            </ActionIcon>
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <b>{active?.label || "Análise de operação"}</b>
          </div>
          <div className="top-actions">
            <button className="global-search" onClick={() => setSearch(true)}>
              <Search size={15} />
              <span>Buscar cliente</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>
            <Badge color="orange" variant="light" className="demo-badge">
              DEMONSTRAÇÃO
            </Badge>
            <Tooltip label="Central de alertas">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Ver alertas"
                onClick={() => nav("/alertas")}
              >
                <Bell size={19} />
              </ActionIcon>
            </Tooltip>
            <Avatar size={30} radius="xl" color="teal">
              AC
            </Avatar>
          </div>
        </header>
        <main id="main-content">
          <div className="workspace-notice">
            <span className="status-dot" /> Dados sintéticos{" "}
            <span className="notice-divider">·</span> Exposição, histórico e
            recomendações ilustrativos{" "}
            <span className="notice-right">
              Revisão humana em todas as decisões <ShieldCheck size={13} />
            </span>
          </div>
          {storageError && (
            <Alert color="orange">
              O navegador não permitiu salvar as alterações. Os dados duram
              apenas nesta sessão.
            </Alert>
          )}
          <Suspense
            fallback={
              <div className="empty" role="status">
                Carregando workspace…
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={<Dashboard onAnalyze={() => setNewAnalysis(true)} />}
              />
              <Route
                path="/carteira"
                element={<Portfolio onAnalyze={() => setNewAnalysis(true)} />}
              />
              <Route path="/clientes/:id" element={<Report />} />
              <Route path="/analises/:analysisId" element={<Report />} />
              <Route path="/alertas" element={<Alerts />} />
              <Route path="/agente" element={<Chat />} />
              <Route path="/fontes" element={<Sources />} />
              <Route path="/governanca" element={<Governance />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>Página não encontrada</h1>
                    <Button onClick={() => nav("/")}>
                      Voltar à visão geral
                    </Button>
                  </div>
                }
              />
            </Routes>
          </Suspense>
          <footer className="page-footer">
            <span>
              krilltech <span> / </span> Inteligência para negociar melhor.
            </span>
            <span>
              Projeto PMI · Sleep 5 <BookOpen size={12} />
            </span>
          </footer>
        </main>
      </div>
      {newAnalysis && (
        <AnalysisModal open onClose={() => setNewAnalysis(false)} />
      )}
      <Drawer
        opened={search}
        onClose={() => setSearch(false)}
        position="right"
        title="Buscar na carteira"
        size="md"
      >
        <Select
          autoFocus
          searchable
          label="Nome ou CNPJ"
          placeholder="Busque entre os 40 clientes do mock"
          data={clients.map((c) => ({
            value: c.id,
            label: `${c.name} · ${c.cnpj}`,
          }))}
          onChange={(id) => {
            if (id) {
              setSearch(false);
              nav(`/clientes/${id}`);
            }
          }}
          nothingFoundMessage="Nenhum cliente no mock"
        />
        <p className="muted">
          Para simular um CNPJ fora da carteira, abra uma nova análise.
        </p>
        <Button
          leftSection={<Plus size={16} />}
          onClick={() => {
            setSearch(false);
            setNewAnalysis(true);
          }}
        >
          Nova análise
        </Button>
      </Drawer>
    </>
  );
}
