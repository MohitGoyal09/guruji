export interface RoadmapSubtopic {
  id: string;
  title: string;
  description?: string;
  estimatedHours?: number;
}

export interface RoadmapSection {
  id: string;
  title: string;
  description?: string;
  subtopics: RoadmapSubtopic[];
  prerequisites?: string[]; // Array of topic IDs that are prerequisites
  estimatedHours?: number;
}

export interface RoadmapLevel {
  id: string;
  title: string;
  description?: string;
  sections: RoadmapSection[];
  estimatedHours?: number;
}

export interface RoadmapStructure {
  levels: RoadmapLevel[];
  metadata?: {
    totalEstimatedHours?: number;
    totalTopics?: number;
  };
}

export interface Prerequisite {
  topicId: string;
  requiredTopics: string[]; // Array of topic IDs that must be completed first
  skillChecks?: string[]; // Array of skills to verify before proceeding
}

export interface PrerequisitesMap {
  [topicId: string]: Prerequisite;
}

export interface Roadmap {
  id: number;
  roadmapId: string;
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'pro';
  structure: RoadmapStructure;
  prerequisites: PrerequisitesMap;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  level: number; // Depth in hierarchy (0 = root level)
  children: RoadmapNode[];
  prerequisites?: string[];
  estimatedHours?: number;
  type: 'level' | 'section' | 'subtopic';
}

