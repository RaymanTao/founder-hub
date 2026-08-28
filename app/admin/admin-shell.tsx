"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAdmin } from "./actions";
import { AdminSearchButton, AdminThemeButtons } from "./admin-tools";

type NavItem = { label: string; href: string; icon: string; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "工作台", items: [{ label: "仪表盘", href: "/admin/dashboard", icon: "⌂", exact: true }] },
  {
    label: "内容管理",
    items: [
      { label: "文章管理", href: "/admin", icon: "▤", exact: true },
      { label: "RSS 聚合", href: "/admin/rss", icon: "◔" },
      { label: "内容洞察", href: "/admin/insights", icon: "◌" }
    ]
  },
  {
    label: "资产管理",
    items: [
      { label: "资源库", href: "/admin/resources", icon: "□" },
      { label: "媒体库", href: "/admin/media", icon: "▣" }
    ]
  },
  {
    label: "运营管理",
    items: [{ label: "线索管理", href: "/admin/leads", icon: "♧" }, { label: "Newsletter", href: "/admin/newsletter", icon: "✉" }]
  }
];

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="admin-shell min-h-screen">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">✦</span>
          <span>Founder Hub</span>
        </Link>
        <div className="admin-sidebar-scroll">
          {groups.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <p className="admin-nav-label">{group.label}</p>
              <nav className="space-y-1" aria-label={group.label}>
                {group.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <Link key={item.href} href={item.href} className={`admin-nav-item${active ? " is-active" : ""}`}>
                      <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-topbar-eyebrow">Founder Hub / Workspace</p>
            <p className="admin-topbar-title">内容工作台</p>
          </div>
          <div className="admin-topbar-actions">
            <AdminSearchButton />
            <AdminThemeButtons />
            <form action={logoutAdmin}>
              <button type="submit" title="退出登录" aria-label="退出登录" className="admin-tool-button"><span className="admin-tool-icon"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M14 3h5v18h-5" /></svg></span></button>
            </form>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
