'use client';

type TabId = 'overview' | 'tasks' | 'timeline' | 'files' | 'team' | 'activity';

interface ProjectTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  counts: {
    tasks: number;
    files: number;
    team: number;
  };
}

export default function ProjectTabs({ activeTab, onTabChange, counts }: ProjectTabsProps) {
  return (
    <div>
      <p>Project Tabs</p>
    </div>
  );
}
