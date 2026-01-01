'use client';

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    client: string;
    status: string;
    progress: number;
    startDate: string;
    endDate: string;
    isFavorite: boolean;
  };
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div>
      <h1>Project Header</h1>
    </div>
  );
}
