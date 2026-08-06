/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

type RouterState = {
  path: string;
  navigate: (to: string | number, options?: { replace?: boolean }) => void;
};
const RouterContext = createContext<RouterState | null>(null);

export function AppRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  const navigate = (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      history.go(to);
      return;
    }
    if (options?.replace) history.replaceState(null, "", to);
    else history.pushState(null, "", to);
    setPath(location.pathname);
  };
  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("Router manquant");
  return context.navigate;
}

export function useParams() {
  const { path } = useRouter();
  const match = path === "/projects/new" || path === "/codex/new"
    ? null
    : /^\/(?:projects|codex)\/([^/]+)(?:\/edit)?$/.exec(path);
  return useMemo(() => ({ id: match?.[1] }), [match]);
}

function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("Router manquant");
  return context;
}

export function Link({
  to,
  children,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(to);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export const NavLink = Link;

export function RouterSwitch({
  routes,
  fallback,
}: {
  routes: Record<string, ReactNode>;
  fallback: ReactNode;
}) {
  const { path } = useRouter();
  if (routes[path]) return routes[path];
  if (path === "/projects/new") return routes["/projects/new"];
  if (path === "/codex/new") return routes["/codex/new"];
  if (path === "/settings/archived-projects")
    return routes["/settings/archived-projects"];
  if (/^\/projects\/[^/]+\/edit$/.test(path))
    return routes["/projects/:id/edit"];
  if (/^\/projects\/[^/]+$/.test(path)) return routes["/projects/:id"];
  if (/^\/codex\/[^/]+\/edit$/.test(path)) return routes["/codex/:id/edit"];
  if (/^\/codex\/[^/]+$/.test(path)) return routes["/codex/:id"];
  return fallback;
}
