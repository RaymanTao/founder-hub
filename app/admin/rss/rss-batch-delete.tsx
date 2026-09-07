"use client";

import { useEffect, useState } from "react";

type ServerAction = (formData: FormData) => void | Promise<void>;

const checkboxSelector = '[data-rss-candidate-checkbox="true"]';

export function RssBatchDelete({ action, returnTo }: { action: ServerAction; returnTo: string }) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    const syncSelection = () => {
      const boxes = Array.from(document.querySelectorAll<HTMLInputElement>(checkboxSelector));
      const selected = boxes.filter((box) => box.checked).length;
      setSelectedCount(selected);
      setAllSelected(boxes.length > 0 && selected === boxes.length);
    };
    document.addEventListener("change", syncSelection);
    syncSelection();
    return () => document.removeEventListener("change", syncSelection);
  }, []);

  function toggleAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>(checkboxSelector).forEach((box) => { box.checked = checked; });
    setSelectedCount(checked ? document.querySelectorAll(checkboxSelector).length : 0);
    setAllSelected(checked);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    const ids = Array.from(document.querySelectorAll<HTMLInputElement>(checkboxSelector)).filter((box) => box.checked).map((box) => box.value);
    if (!ids.length) {
      event.preventDefault();
      window.alert("请先选择要删除的候选文章。");
      return;
    }
    if (!window.confirm(`确认删除选中的 ${ids.length} 条 RSS 候选吗？删除后不可恢复。`)) {
      event.preventDefault();
      return;
    }
    const form = event.currentTarget;
    const input = form.elements.namedItem("ids") as HTMLInputElement;
    input.value = ids.join("\n");
  }

  return <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] px-4 py-3"><label className="flex min-h-11 items-center gap-2 text-sm text-[var(--secondary)]"><input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} />全选当前列表<span className="text-xs text-[var(--muted)]">已选 {selectedCount} 条</span></label><form action={action} onSubmit={submit}><input type="hidden" name="ids" /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit" disabled={!selectedCount} className="min-h-11 rounded-full border border-[var(--danger)] px-4 text-sm font-medium text-[var(--danger)] transition hover:bg-[rgba(143,78,69,0.08)] disabled:cursor-not-allowed disabled:opacity-40">批量删除</button></form></div>;
}
