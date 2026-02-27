"use client";
import { ArrowRight, GitBranch } from 'lucide-react';
import type { Project } from '../types';

const ProjectCard = ({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer p-6 flex flex-col h-full group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex space-x-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="text-xs text-slate-400 flex items-center">
        <GitBranch size={12} className="mr-1" />
        {project.versions.length} versions
      </span>
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition">
      {project.title}
    </h3>
    <p className="text-slate-500 text-sm mb-6 grow">{project.summary}</p>

    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <span className="text-xs text-slate-400">By {project.author}</span>
      <span className="text-blue-600 text-sm font-medium flex items-center">
        View Blueprint <ArrowRight size={16} className="ml-1" />
      </span>
    </div>
  </div>
);

export default ProjectCard;
