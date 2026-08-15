"use client";

import { FormEvent, useState, useTransition } from "react";

const serviceOptions = [
  "咨询",
  "AI 产品策略",
  "AI Agent 与自动化",
  "Skill 开发",
  "MVP 产品开发",
  "自媒体"
] as const;

type ContactFormState = {
  name: string;
  email: string;
  company: string;
  serviceType: (typeof serviceOptions)[number];
  budget: string;
  timeline: string;
  message: string;
  website: string;
};

const initialForm: ContactFormState = {
  name: "",
  email: "",
  company: "",
  serviceType: serviceOptions[0],
  budget: "",
  timeline: "",
  message: "",
  website: ""
};

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const result = (await response.json()) as { message: string };
      setMessage(result.message);

      if (response.ok) {
        setForm(initialForm);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(event) =>
          setForm((current) => ({ ...current, website: event.target.value }))
        }
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="姓名"
          value={form.name}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
        />
        <Field
          label="邮箱"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="公司"
          value={form.company}
          required={false}
          onChange={(value) =>
            setForm((current) => ({ ...current, company: value }))
          }
        />
        <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
          服务类型
          <select
            value={form.serviceType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                serviceType: event.target.value as ContactFormState["serviceType"]
              }))
            }
            className="min-h-11 rounded-3xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)]"
          >
            {serviceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="预算"
          value={form.budget}
          required={false}
          onChange={(value) => setForm((current) => ({ ...current, budget: value }))}
        />
        <Field
          label="时间线"
          value={form.timeline}
          required={false}
          onChange={(value) =>
            setForm((current) => ({ ...current, timeline: value }))
          }
        />
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        项目说明
        <textarea
          required
          rows={6}
          value={form.message}
          onChange={(event) =>
            setForm((current) => ({ ...current, message: event.target.value }))
          }
          className="rounded-[1.5rem] border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--accent)]"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--secondary)]">
          提交后会发送确认信息，并进入后续跟进流程。
        </p>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-[var(--foreground)] px-6 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:text-white"
        >
          {pending ? "提交中..." : "发送咨询"}
        </button>
      </div>

      {message ? (
        <p className="text-sm text-[var(--secondary)]" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-3xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}
