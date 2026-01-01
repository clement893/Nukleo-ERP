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

export default function ProjectTabs({ activeTab: _activeTab, onTabChange: _onTabChange, counts: _counts }: ProjectTabsProps) {
  return (
    <div>
      <p>Project Tabs</p>
    </div>
  );
}
