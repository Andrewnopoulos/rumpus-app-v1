import { useEffect } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useSession } from "./auth/useSession";
import { ToastProvider } from "./components/ToastProvider";
import { Loading } from "./routes/Loading";
import { SignIn } from "./routes/SignIn";
import { SignInSent } from "./routes/SignInSent";
import { ProfilePicker } from "./routes/ProfilePicker";
import { AppGrid } from "./routes/AppGrid";
import { ParentDashboard } from "./routes/ParentDashboard";
import { Locked } from "./routes/Locked";

// The founder picks one before launch; until then Clay is the default. Palette
// switching is a CSS-variable swap on <html data-palette> — this is the one line.
const DEFAULT_PALETTE = "clay";

/** Resolve `/` from session state, preserving ?from/?reason for banners. */
function RootRedirect() {
  const { session } = useSession();
  const [params] = useSearchParams();
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : "";

  if (!session?.authenticated) return <Navigate to={`/signin${suffix}`} replace />;
  if (session.mode === "parent") return <Navigate to={`/profiles${suffix}`} replace />;
  return <Navigate to="/apps" replace />;
}

function RequireParent({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (!session?.authenticated) return <Navigate to="/signin" replace />;
  if (session.mode !== "parent") return <Navigate to="/apps" replace />;
  return <>{children}</>;
}

function RequireKid({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (!session?.authenticated) return <Navigate to="/signin" replace />;
  if (session.mode !== "kid") return <Navigate to="/profiles" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { status } = useSession();
  // Initial-load gate: show Loading until the first /me resolves (brief routing).
  if (status === "loading") return <Loading />;

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signin/sent" element={<SignInSent />} />
      <Route
        path="/profiles"
        element={
          <RequireParent>
            <ProfilePicker />
          </RequireParent>
        }
      />
      <Route
        path="/apps"
        element={
          <RequireKid>
            <AppGrid />
          </RequireKid>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireParent>
            <ParentDashboard />
          </RequireParent>
        }
      />
      <Route path="/locked" element={<Locked />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  useEffect(() => {
    document.documentElement.setAttribute("data-palette", DEFAULT_PALETTE);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
