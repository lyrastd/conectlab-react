import { Project, UserProfile, Badge, MaturityLevel, PostComponentType, SmokeTestFeedback, ComponentComment, ParticipationRequest, ProjectAlteration } from "./types";

export const GLOBAL_BADGES: Badge[] = [
  {
    id: "first_project",
    name: "Criador Original",
    description: "Publicou seu primeiro projeto original na plataforma.",
    icon: "Sparkles",
    color: "bg-amber-100 text-amber-700 border-amber-300"
  },
  {
    id: "alliance",
    name: "Parceiro de Elite",
    description: "Firmou uma parceria estratégica e tornou-se participante de um projeto.",
    icon: "Users",
    color: "bg-blue-100 text-blue-700 border-blue-300"
  },
  {
    id: "expert_contributor",
    name: "Executor Ágil",
    description: "Realizou contribuições valiosas com aprovação do dono do projeto.",
    icon: "CheckCircle",
    color: "bg-emerald-100 text-emerald-700 border-emerald-300"
  },
  {
    id: "validator",
    name: "Validador Científico",
    description: "Realizou testes de fumaça técnicos e feedbacks robustos em projetos alheios.",
    icon: "Flame",
    color: "bg-orange-100 text-orange-700 border-orange-300"
  },
  {
    id: "diagram_master",
    name: "Arquiteto Visual",
    description: "Desenhou ou editou um fluxo representativo/diagrama de execução.",
    icon: "GitBranch",
    color: "bg-purple-100 text-purple-700 border-purple-300"
  }
];

export const PRESET_USERS: UserProfile[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_SMOKE_TESTS: SmokeTestFeedback[] = [];

export const INITIAL_COMMENTS: ComponentComment[] = [];

export const INITIAL_REQUESTS: ParticipationRequest[] = [];

export const INITIAL_ALTERATIONS: ProjectAlteration[] = [];
