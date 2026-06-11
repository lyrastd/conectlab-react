import React, { useEffect, useState } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Project } from "../types";

// Step structure
interface TutorialStep {
  title: string;
  description: string;
  targetId?: string;
  tab: "feed" | "profile" | "details";
  align?: "top" | "bottom" | "left" | "right" | "center";
}

interface GuidedTutorialProps {
  onClose: () => void;
  onComplete: () => void;
  isOpen: boolean;
  projects: Project[];
  activeTab: "feed" | "profile" | "details";
  selectedProjectId: string | null;
  setActiveTab: (tab: "feed" | "profile" | "details") => void;
  setSelectedProjectId: (id: string | null) => void;
}

export default function GuidedTutorial({
  onClose,
  onComplete,
  isOpen,
  projects,
  activeTab,
  selectedProjectId,
  setActiveTab,
  setSelectedProjectId
}: GuidedTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // List of descriptive tutorial steps tailored for Conect Lab
  const steps: TutorialStep[] = [
    {
      title: "Boas-vindas ao Conect Lab! 🚀",
      description: "Olá! Este é o seu portal de inovação de alta fidelidade em Nuvem. Aqui você compartilha conceitos, monta protótipos de engenharia e avança parcerias estratégicas em tempo real de forma colaborativa e dinâmica.",
      tab: "feed",
      align: "center"
    },
    {
      title: "Filtragem e Organização Inteligente",
      description: "Pesquise ideias ou filtre-as pelo status de maturidade (Conceito, Protótipo, Validação ou Produto). Projetos de especialistas que você segue são priorizados no topo do feed automaticamente!",
      targetId: "timeline_search_input",
      tab: "feed",
      align: "bottom"
    },
    {
      title: "Compartilhamento Científico de Ideias",
      description: "Tem um conceito inovador? Clique aqui para publicá-lo instantaneamente na rede, definindo a maturidade inicial e disparando a tese para a comunidade. Isso lhe concede 150 pontos de XP!",
      targetId: "btn_open_add_project_modal",
      tab: "feed",
      align: "bottom"
    },
    {
      title: "Detalhes Técnicos & Módulos Únicos",
      description: "Nós mudamos sua tela para que você veja a anatomia de um projeto ativo. Aqui você encontra diagramas lógicos, códigos, artigos de hipóteses e observações compartilhadas.",
      tab: "details",
      align: "center"
    },
    {
      title: "Anotações e Co-autoria Dinâmica",
      description: "Participantes com 'Liberdade Total' podem modificar módulos estruturais diretamente. Se você não tiver, suas sugestões são enviadas para aprovação do criador principal, garantindo integridade e conformidade de versão.",
      targetId: "btn_add_component_trigger", // We point to adding components/modules
      tab: "details",
      align: "top"
    },
    {
      title: "Testes de Fumaça (Validação Ágil)",
      description: "Dê notas e exponha feedbacks científicos estruturados para avaliar a maturidade mercadológica do projeto. Isso recompensa você com 80 XP e desbloqueia medalhas raras de Validador!",
      targetId: "section_smoke_analysis",
      tab: "details",
      align: "top"
    },
    {
      title: "Seu Perfil, XP e Medalhas Desbloqueáveis",
      description: "Acompanhe seu avanço profissional na rede. Cada comentário, feedback científica ou compartilhamento aumenta seu nível e destrava Badges incríveis para o seu portfólio.",
      tab: "profile",
      align: "center"
    },
    {
      title: "Parabéns, Pioneiro(a)! 🎉",
      description: "Agora você está pronto(a) para acelerar ideias e conectar laboratórios de engenharia. Lembre-se: você pode reiniciar este tutorial guiado a qualquer hora clicando no botão de ajuda no painel.",
      tab: "feed",
      align: "center"
    }
  ];

  // Effect to navigate tabs automatically based on tutorial step requirements!
  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStepIndex];
    if (step) {
      if (step.tab !== activeTab) {
        setActiveTab(step.tab);
        // If transitioning to details, select first project to show real elements
        if (step.tab === "details" && !selectedProjectId && projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        } else if (step.tab !== "details") {
          setSelectedProjectId(null);
        }
      } else if (step.tab === "details" && !selectedProjectId && projects.length > 0) {
        setSelectedProjectId(projects[0].id);
      }
    }
  }, [currentStepIndex, isOpen]);

  // Recalculate target element coordinates for the highlighter box
  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStepIndex];
    if (step && step.targetId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(step.targetId!);
        if (el) {
          const rect = el.getBoundingClientRect();
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        } else {
          setCoords(null);
        }
      }, 350); // Small delay to let tabs switch and render complete before calculation

      return () => clearTimeout(timer);
    } else {
      setCoords(null);
    }
  }, [currentStepIndex, activeTab, selectedProjectId, isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
        
        {/* Semi-transparent dark background for highlighted target element focus */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs pointer-events-auto cursor-default"
          onClick={onClose}
        />

        {/* Glow highlighting box to overlay on top of target HTML element */}
        {coords && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: coords.top - 6,
              left: coords.left - 6,
              width: coords.width + 12,
              height: coords.height + 12
            }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="absolute rounded-xl border-2 border-indigo-400 bg-indigo-500/10 shadow-[0_0_25px_rgba(129,140,248,0.5)] z-50 pointer-events-none"
          />
        )}

        {/* Floating Tooltip Card */}
        <div className="absolute inset-0 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`w-full max-w-sm md:max-w-md bg-white rounded-2xl border border-indigo-100 shadow-2xl p-5 pointer-events-auto flex flex-col gap-4 relative`}
            style={
              coords && currentStep.align !== "center"
                ? {
                    // Position tooltip card relative to element coordinates if viewport is large enough
                    position: "absolute",
                    top: Math.max(80, Math.min(window.innerHeight - 280, coords.top + coords.height + 16)),
                    left: Math.max(20, Math.min(window.innerWidth - 420, coords.left - 100))
                  }
                : undefined
            }
          >
            {/* Steps indicator */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-600 font-extrabold text-[10px] uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Dica {currentStepIndex + 1} de {steps.length}
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                title="Pular Tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content text */}
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                {currentStep.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Step navigation actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <button
                onClick={onClose}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Pular
              </button>

              <div className="flex items-center gap-2">
                {currentStepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-2.5 py-1 text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-0.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition shadow-sm cursor-pointer flex items-center gap-0.5"
                >
                  {currentStepIndex === steps.length - 1 ? "Pronto" : "Avançar"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
