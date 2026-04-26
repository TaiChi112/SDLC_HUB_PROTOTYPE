import type { Metadata } from 'next';
import ProjectDetailClient from './ProjectDetailClient';

type PageParams = {
  params: Promise<{ id: string }>;
};

async function fetchProjectMeta(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/project/${id}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) return null;

  const data = await response.json();
  return {
    title: data?.title as string,
    summary: data?.summary as string,
    tags: (data?.tags as string[]) || [],
  };
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchProjectMeta(id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const imageUrl = `${baseUrl}/project/${id}/opengraph-image`;

  if (!project) {
    return {
      title: 'Project Detail | BlueprintHub',
      description: 'View project artifacts and software specification details on BlueprintHub.',
    };
  }

  const title = `${project.title} | BlueprintHub`;
  const description = project.summary || 'View project artifacts and software specification details.';

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: project.tags,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/project/${id}`,
      siteName: 'BlueprintHub',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${project.title} preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageParams) {
  const { id } = await params;
  return <ProjectDetailClient projectId={id} />;
}
