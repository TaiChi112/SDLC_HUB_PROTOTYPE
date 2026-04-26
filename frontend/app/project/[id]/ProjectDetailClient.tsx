"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ChevronRight, Tag, User } from 'lucide-react';
import type { Artifact, Project } from '@/types';
import { useSession } from 'next-auth/react';
import ArtifactViewer from '@/components/ArtifactViewer';
import Navbar from '@/components/Navbar';

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || 'User',
        role: 'student' as const,
        provider: 'google' as const,
        avatar:
          session.user.image ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            session.user.name || 'User'
          )}&background=random`,
      }
    : null;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/project/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found');
          } else {
            setError('Failed to load project');
          }
          return;
        }

        const data: Project = await response.json();
        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  useEffect(() => {
    const fetchRelatedProjects = async () => {
      try {
        setRelatedLoading(true);
        const response = await fetch('/api/published-specs');
        if (!response.ok) return;

        const data = await response.json();
        if (!Array.isArray(data)) return;

        const related = data
          .filter((item: Project) => item.id !== projectId)
          .slice(0, 3);
        setRelatedProjects(related);
      } catch (err) {
        console.error('Error fetching related projects:', err);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProjects();
  }, [projectId]);

  const handleArtifactAction = (artifact: Artifact, mode: 'edit' | 'suggest') => {
    console.log(`Action requested: ${mode} for artifact ${artifact.id}`);
  };

  const isOwner = useMemo(() => {
    if (!project) return false;
    return currentUser?.id === project.author || currentUser?.name === project.author;
  }, [currentUser?.id, currentUser?.name, project]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar
          onViewChange={() => {}}
          user={currentUser}
          onLoginClick={() => {}}
          onLogoutClick={() => {}}
        />
        <div className="container mx-auto py-16 px-4 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar
          onViewChange={() => {}}
          user={currentUser}
          onLoginClick={() => {}}
          onLogoutClick={() => {}}
        />
        <div className="container mx-auto py-16 px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
            <p className="text-red-700 font-semibold mb-4">{error || 'Project not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedVersion = project.versions[selectedVersionIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        onViewChange={(view) => {
          if (view === 'home') router.push('/');
          if (view === 'request') router.push('/generator-test');
          if (view === 'profile') router.push('/profile');
        }}
        user={currentUser}
        onLoginClick={() => {}}
        onLogoutClick={() => {}}
      />

      <main className="container mx-auto py-8 px-4 max-w-5xl">
        <nav className="flex items-center text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <ChevronRight size={14} className="mx-2 text-slate-400" />
          <span className="text-slate-700 truncate">{project.title}</span>
        </nav>

        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{project.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span>{project.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>{project.createdAt}</span>
            </div>
            {project.isPublished && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                Published
              </span>
            )}
          </div>

          {project.summary && <p className="text-slate-700 leading-relaxed mb-4">{project.summary}</p>}

          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-slate-400" />
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {project.versions.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex space-x-2 overflow-x-auto">
              {project.versions.map((version, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVersionIndex(idx)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                    selectedVersionIndex === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {version.label} ({version.versionNumber})
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedVersion.description && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-700">{selectedVersion.description}</p>
          </div>
        )}

        <div className="space-y-6 mb-8">
          {selectedVersion.artifacts.map((artifact) => (
            <ArtifactViewer
              key={artifact.id}
              artifact={artifact}
              isOwner={isOwner}
              onAction={handleArtifactAction}
            />
          ))}
        </div>

        {(relatedLoading || relatedProjects.length > 0) && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Related Projects</h2>

            {relatedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-5/6 mb-4" />
                    <div className="h-3 bg-blue-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedProjects.map((item) => (
                  <Link
                    key={item.id}
                    href={`/project/${item.id}`}
                    className="block border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition"
                  >
                    <h3 className="font-semibold text-slate-800 truncate">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.summary}</p>
                    <span className="inline-block mt-3 text-xs text-blue-600 font-medium">View details →</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
