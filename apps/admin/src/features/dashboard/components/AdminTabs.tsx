'use client'

import { Tabs } from '@base-ui/react/tabs'

const adminSections = [
  {
    value: 'odai',
    title: 'Odai',
    description: 'Create and review prompts for Slack games.',
  },
  {
    value: 'kotae',
    title: 'Kotae',
    description: 'Inspect answers before moderation tools arrive.',
  },
  {
    value: 'results',
    title: 'Results',
    description: 'Keep a place for vote summaries and AI reviews.',
  },
]

export function AdminTabs() {
  return (
    <Tabs.Root
      className="grid max-w-3xl gap-px border border-stone-300 bg-stone-300"
      defaultValue="odai"
    >
      <Tabs.List
        className="grid grid-cols-1 gap-px bg-stone-300 sm:grid-cols-3"
        aria-label="Admin sections"
      >
        {adminSections.map((section) => (
          <Tabs.Tab
            className="min-h-12 cursor-pointer border-0 bg-[#f8f7f3] px-4 py-3 text-sm font-bold text-stone-500 hover:text-stone-950 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 data-active:bg-white data-active:text-stone-950"
            key={section.value}
            value={section.value}
          >
            {section.title}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {adminSections.map((section) => (
        <Tabs.Panel
          className="min-h-32 bg-[#f8f7f3] p-5 text-sm text-stone-600"
          key={section.value}
          value={section.value}
        >
          <strong className="mb-3 block text-sm text-stone-950">
            {section.title}
          </strong>
          <span className="leading-6">{section.description}</span>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  )
}
