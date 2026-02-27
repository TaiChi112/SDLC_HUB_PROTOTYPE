import type React from 'react';

export type ArtifactType = 'requirement' | 'diagram' | 'testing' | 'ui';
export type ArtifactFormat = 'text' | 'mermaid' | 'structured';

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'volunteer' | 'business';
  provider: 'google' | 'github';
  bio?: string;
  joinedDate?: string;
}

export interface ExternalResource {
  title: string;
  url: string;
}

export interface StandardSectionsData {
  title?: string;
  version?: string;
  problem?: string;
  goal?: string;
  inScope?: string[];
  outScope?: string[];
  users?: string[];
  systemActors?: string[];
  features?: string[];
  userStories?: string[];
  performance?: string;
  security?: string;
  reliability?: string;
  techConstraints?: string[];
  bizConstraints?: string[];
  assumptions?: string[];
  dependencies?: string[];
  definitionOfDone?: string[];
}

export interface SectionField {
  id: string;
  label: string;
  value: string | string[];
  inputType: 'text' | 'textarea' | 'list';
  placeholder?: string;
}

export interface RequirementSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  fields: SectionField[];
  isExpanded?: boolean;
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  contentFormat?: ArtifactFormat;
  structuredContent?: RequirementSection[];
  imageUrl?: string;
  externalLinks?: ExternalResource[];
}

export interface Implementation {
  language: string;
  repoUrl: string;
  description: string;
}

export interface Version {
  versionNumber: string;
  label: string;
  description: string;
  artifacts: Artifact[];
  implementations: Implementation[];
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  author: string;
  tags: string[];
  versions: Version[];
  references?: ExternalResource[];
}

export interface Contribution {
  id: string;
  projectTitle: string;
  action: string;
  date: string;
  type: 'artifact' | 'code' | 'review';
}

export interface CreateRequestFormData {
  title: string;
  version: string;
  problem: string;
  goal: string;
  inScope: string[];
  outScope: string[];
  users: string[];
  systemActors: string[];
  features: string[];
  userStories: string[];
  performance: string;
  security: string;
  reliability: string;
  techConstraints: string[];
  bizConstraints: string[];
  assumptions: string[];
  dependencies: string[];
  definitionOfDone: string[];
}
