export enum MaturityLevel {
  Concept = "Conceito",
  Prototype = "Protótipo",
  Validation = "Validação",
  Product = "Produto"
}

export enum PostComponentType {
  Idea = "Idea",
  Diagram = "Diagram",
  Link = "Link",
  Photo = "Photo",
  Article = "Article",
  Theory = "Theory",
  Hypothesis = "Hypothesis",
  File = "File"
}

export interface PostComponent {
  id: string;
  type: PostComponentType;
  title: string;
  content: string; // Dynamic based on type (JSON serialized for diagram, text for article/idea, URL for link, photo URL)
  additionalData?: any; // Extra metadata (e.g. fileName, fileType, linkPreview)
  notes?: string; // Observations linked to this component
}

export interface ComponentComment {
  id: string;
  componentId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface ProjectAlteration {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  componentId: string; // The component being altered or "new"
  type: "new" | "edit" | "delete";
  originalComponent?: PostComponent; // For undoing or reviewing
  proposedComponent: PostComponent;
  status: "pending" | "approved" | "rejected" | "undone";
  feedback?: string; // Optional message from owner on reject
  createdAt: string;
}

export interface ParticipationRequest {
  id: string;
  projectId: string;
  applicantId: string;
  applicantName: string;
  applicantSpecialty: string;
  applicantAvatar: string;
  proposal: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface ProjectContribution {
  id: string;
  projectId: string;
  projectTitle: string;
  type: string; // e.g., "Criou o projeto", "Corrigiu o diagrama", "Sugeriu melhoria", "Aprovado no teste de fumaça"
  xpEarned: number;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon string
  color: string; // Tailwind color class
  unlockedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  userName?: string; // unique, e.g., @usuario
  specialty: string; // e.g. "Arquiteto de Software", "Designer UX/UI", "Cientista de Dados"
  avatar: string;
  bio: string;
  skills: string[];
  linkedin?: string;
  github?: string;
  website?: string;
  companiesText?: string; // Optional companies list / text
  careerVision?: string; // Optional career vision
  professionalObjective?: string; // Optional professional objective
  portfolio?: { id: string; url: string; title: string; description?: string }[]; // Portfolio images and titles
  xp: number;
  level: number;
  badges: string[]; // Badge IDs
  contributions: ProjectContribution[];
  followingUsers: string[]; // List of user IDs that they follow
  hasSeenTutorial?: boolean;
}

export interface SmokeTestFeedback {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorSpecialty: string;
  rating: number; // 1 to 5 stars
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerSpecialty: string;
  maturity: MaturityLevel;
  components: PostComponent[];
  participants: {
    userId: string;
    name: string;
    specialty: string;
    avatar: string;
    hasFreedom: boolean; // Grau de liberdade: true = can edit directly, false = needs owner approval
  }[];
  createdAt: string;
  likes: number;
  likedBy: string[]; // user IDs
}
