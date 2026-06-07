"use client";

import { Tabs } from "@base-ui/react/tabs";

const adminSections = [
  {
    value: "odai",
    title: "Odai",
    description: "Create and review prompts for Slack games.",
  },
  {
    value: "kotae",
    title: "Kotae",
    description: "Inspect answers before moderation tools arrive.",
  },
  {
    value: "results",
    title: "Results",
    description: "Keep a place for vote summaries and AI reviews.",
  },
];

export function AdminTabs() {
  return (
    <Tabs.Root className="admin-tabs" defaultValue="odai">
      <Tabs.List className="admin-tab-list" aria-label="Admin sections">
        {adminSections.map((section) => (
          <Tabs.Tab
            className={({ active }) =>
              active ? "admin-tab admin-tab-active" : "admin-tab"
            }
            key={section.value}
            value={section.value}
          >
            {section.title}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {adminSections.map((section) => (
        <Tabs.Panel
          className="admin-tab-panel"
          key={section.value}
          value={section.value}
        >
          <strong>{section.title}</strong>
          <span>{section.description}</span>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
