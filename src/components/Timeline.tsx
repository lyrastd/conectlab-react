import React, { useState } from "react";
import { Project, UserProfile, MaturityLevel, SmokeTestFeedback, PostComponentType, ComponentComment } from "../types";
import { Flame, MessageSquare, Heart, UserPlus, UserMinus, Star, Plus, ShieldCheck, ArrowRight, Layers, Award } from "lucide-react";

interface TimelineProps {
  projects: Project[];
  currentUser: UserProfile;
  usersList: UserProfile[];
  smokeFeedbacks: SmokeTestFeedback[];
  comments: ComponentComment[];
  onSelectProject: (projectId: string) => void;
  onFollowUser: (targetUserId: string) => void;
  onUnfollowUser: (targetUserId: string) => void;
  onLikeProject: (projectId: string) => void;
  onAddSmokeFeedback: (projectId: string, rating: number, comment: string) => void;
  onAddProject: (title: string, description: string, maturity: MaturityLevel) => void;
  onViewUserProfile?: (userId: string) => void;
}

export default function Timeline({
  projects,
  currentUser,
  usersList,
  smokeFeedbacks,
  comments,
  onSelectProject,
  onFollowUser,
  onUnfollowUser,
  onLikeProject,
  onAddSmokeFeedback,
  onAddProject,
  onViewUserProfile
}: TimelineProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaturityFilter, setSelectedMaturityFilter] = useState<string>("all");
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  // Modal form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMaturity, setNewMaturity] = useState<MaturityLevel>(MaturityLevel.Concept);

  // Smoke test feedback interactive form states per project
  const [expandedSmokeForm, setExpandedSmokeForm] = useState<string | null>(null);
  const [smokeRating, setSmokeRating] = useState(5);
  const [smokeContent, setSmokeContent] = useState("");

  // Filter projects inside search, and prioritize owners that currentUser follows.
  // Prioritized: If currentUser.followingUsers includes project.ownerId, it ranks higher.
  const processedProjects = [...projects]
    .filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMaturity = selectedMaturityFilter === "all" || p.maturity === selectedMaturityFilter;
      return matchSearch && matchMaturity;
    })
    .sort((a, b) => {
      const aIsFollowed = currentUser.followingUsers.includes(a.ownerId) ? 1 : 0;
      const bIsFollowed = currentUser.followingUsers.includes(b.ownerId) ? 1 : 0;
      if (aIsFollowed !== bIsFollowed) {
        return bIsFollowed - aIsFollowed; // Followed users show first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Then chronological order
    });

  const handleLaunchProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    onAddProject(newTitle, newDesc, newMaturity);
    // Reset
    setNewTitle("");
    setNewDesc("");
    setNewMaturity(MaturityLevel.Concept);
    setShowAddProjectModal(false);
  };

  const getMaturityBadge = (maturity: MaturityLevel) => {
    switch (maturity) {
      case MaturityLevel.Concept:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {MaturityLevel.Concept}
          </span>
        );
      case MaturityLevel.Prototype:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-300">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
            {MaturityLevel.Prototype}
          </span>
        );
      case MaturityLevel.Validation:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            {MaturityLevel.Validation}
          </span>
        );
      case MaturityLevel.Product:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {MaturityLevel.Product}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Header section with Create triggers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/55">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            💡 Linha do Tempo de Execução
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conecte-se e colabore estrategicamente. Projetos de especialistas que você segue são priorizados no feed principal.
          </p>
        </div>

        <button
          id="btn_open_add_project_modal"
          onClick={() => setShowAddProjectModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Compartilhar Ideia / Projeto
        </button>
      </div>

      {/* Filter and Search rail */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100">
        <div className="relative w-full sm:w-1/2">
          <input
            type="text"
            id="timeline_search_input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por ideia, especialista ou tecnologia..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="absolute left-3 top-2.5 text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto whitespace-nowrap py-1">
          <span className="text-xs text-slate-400 font-mono">Filtro de Maturidade:</span>
          {["all", MaturityLevel.Concept, MaturityLevel.Prototype, MaturityLevel.Validation, MaturityLevel.Product].map((m) => (
            <button
              key={m}
              id={`filter_maturity_${m}`}
              onClick={() => setSelectedMaturityFilter(m)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
                selectedMaturityFilter === m
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {m === "all" ? "Todos os Status" : m}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Feed Layout */}
      {processedProjects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-700 font-medium">Nenhum projeto encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Submeta seu próprio projeto ou limpe os filtros de busca para prosseguir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {processedProjects.map((project) => {
            const isOwner = currentUser.id === project.ownerId;
            const isFollowingUser = currentUser.followingUsers.includes(project.ownerId);
            const isLiked = project.likedBy.includes(currentUser.id);
            const projectFeedbacks = smokeFeedbacks.filter((f) => f.projectId === project.id);
            const averageRating = projectFeedbacks.length
              ? (projectFeedbacks.reduce((acc, f) => acc + f.rating, 0) / projectFeedbacks.length).toFixed(1)
              : null;

            return (
              <div
                key={project.id}
                id={`project_card_${project.id}`}
                className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isFollowingUser
                    ? "border-l-4 border-l-indigo-600 border-slate-200/90 shadow-md shadow-indigo-100/10"
                    : "border-slate-100 shadow-sm"
                }`}
              >
                {/* Followed Ribbon indicator */}
                {isFollowingUser && (
                  <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-bl-xl text-[10px] font-bold font-mono tracking-wider">
                    SEGUINDO AUTOR
                  </div>
                )}

                {/* Card Header & Owner meta */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div 
                      onClick={() => onViewUserProfile?.(project.ownerId)}
                      className="flex items-center gap-3 cursor-pointer group"
                      title={`Ver perfil de ${project.ownerName}`}
                    >
                      <img
                        src={project.ownerAvatar}
                        alt={project.ownerName}
                        className="w-10 h-10 rounded-full border border-slate-100 object-cover group-hover:scale-105 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 group-hover:underline">{project.ownerName}</h3>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[11px] text-indigo-600 font-medium group-hover:text-indigo-700">{project.ownerSpecialty}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Publicado em {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    {/* Follow Trigger inside feed */}
                    {!isOwner && (
                      <button
                        id={`btn_follow_feed_${project.ownerId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          isFollowingUser ? onUnfollowUser(project.ownerId) : onFollowUser(project.ownerId);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition ${
                          isFollowingUser
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {isFollowingUser ? (
                          <>
                            <UserMinus className="w-3.5 h-3.5" /> Deixar de Seguir
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" /> Seguir Especialista
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Project Summary Body */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h2
                        onClick={() => onSelectProject(project.id)}
                        className="text-base font-bold text-slate-900 tracking-tight hover:text-indigo-600 transition cursor-pointer flex items-center gap-2"
                      >
                        {project.title}
                      </h2>
                      {getMaturityBadge(project.maturity)}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Mini visualization of components */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase">Componentes inclusos:</span>
                    {project.components.map((c) => (
                      <span
                        key={c.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-150 font-mono text-slate-500"
                      >
                        {c.type === PostComponentType.Idea ? "💡 " : ""}
                        {c.type === PostComponentType.Diagram ? "📊 " : ""}
                        {c.type === PostComponentType.Link ? "🔗 " : ""}
                        {c.type === PostComponentType.Photo ? "🖼️ " : ""}
                        {c.type === PostComponentType.Theory ? "🔬 " : ""}
                        {c.type === PostComponentType.Hypothesis ? "❓ " : ""}
                        {c.title}
                      </span>
                    ))}
                  </div>

                  {/* Actions & Smoke rating bar */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
                    <div className="flex items-center gap-4">
                      {/* Like trigger */}
                      <button
                        id={`btn_like_feed_${project.id}`}
                        onClick={() => onLikeProject(project.id)}
                        className={`flex items-center gap-1.5 transition cursor-pointer ${
                          isLiked ? "text-rose-600 font-bold" : "text-slate-400 hover:text-rose-500"
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                        <span>{project.likes} upvotes</span>
                      </button>

                      {/* Comment count trigger to detail page */}
                      <button
                        id={`btn_explore_details_${project.id}`}
                        onClick={() => onSelectProject(project.id)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>
                          {project.components.reduce(
                            (acc, c) => acc + (comments.filter((comm) => comm.componentId === c.id).length),
                            0
                          ) + projectFeedbacks.length}{" "}
                          interações
                        </span>
                      </button>

                      {/* Smoke rating summary badge */}
                      {averageRating && (
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-800 px-2.5 py-0.5 rounded-md font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{averageRating} ({projectFeedbacks.length} Testes de fumaça)</span>
                        </div>
                      )}
                    </div>

                    <button
                      id={`btn_go_to_project_page_${project.id}`}
                      onClick={() => onSelectProject(project.id)}
                      className="px-3.5 py-1 bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    >
                      Explorar Colaboração <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Smoke Test Feedback area for non-participating specialists */}
                <div id="section_smoke_analysis" className="bg-slate-50/50 border-t border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <h4 className="text-xs font-bold text-slate-800">
                        Testes de Fumaça & Validação Técnica ({projectFeedbacks.length})
                      </h4>
                    </div>
                    
                    {/* Only non-participants and non-owner can submit a Smoke Test */}
                    {!isOwner && !project.participants.some(p => p.userId === currentUser.id) && (
                      <button
                        id={`btn_toggle_smoke_form_${project.id}`}
                        onClick={() => setExpandedSmokeForm(expandedSmokeForm === project.id ? null : project.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                      >
                        {expandedSmokeForm === project.id ? "Fechar Formulário" : "★ Dar Feedback Técnico"}
                      </button>
                    )}
                  </div>

                  {/* Form input to post a Smoke Test Feedback */}
                  {expandedSmokeForm === project.id && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-3 space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Nível de Maturidade Teórico/Técnico (De 1 a 5 estrelas)
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setSmokeRating(star)}
                              className="focus:outline-none cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= smokeRating ? "fill-amber-400 text-amber-400" : "text-slate-350"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Avaliação Crítica e Observações de Risco
                        </label>
                        <textarea
                          rows={2}
                          value={smokeContent}
                          onChange={(e) => setSmokeContent(e.target.value)}
                          placeholder="Ex: Quais são as inconsistências, dificuldades regulatórias ou problemas que você enxerga nessa hipótese?"
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          id={`btn_submit_smoke_feedback_${project.id}`}
                          onClick={() => {
                            if (!smokeContent) return;
                            onAddSmokeFeedback(project.id, smokeRating, smokeContent);
                            setSmokeContent("");
                            setExpandedSmokeForm(null);
                          }}
                          className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Publicar Avaliação Técnica
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Smoke Feed List */}
                  {projectFeedbacks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Nenhum teste de fumaça enviado ainda. Seja o primeiro especialista não participante a analisar este projeto!</p>
                  ) : (
                    <div className="space-y-3">
                      {projectFeedbacks.map((fb) => (
                        <div key={fb.id} className="bg-white p-3 rounded-xl border border-slate-100 flex gap-2">
                          <img src={fb.authorAvatar} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-slate-700">{fb.authorName} <span className="text-[9px] text-indigo-500 font-medium">({fb.authorSpecialty})</span></span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < fb.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-normal italic font-sans">
                              "{fb.content}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Dialog/Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Compartilhar Ideia Estratégica
              </h2>
              <button
                id="btn_close_add_project"
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-white font-mono text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLaunchProject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Título do Projeto/Ideia</label>
                <input
                  type="text"
                  required
                  id="modal_project_title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: DroneGuard - Monitoramento Florestal Autônomo"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Descrição de Execução e Valores</label>
                <textarea
                  rows={3}
                  required
                  id="modal_project_desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Descreva a dor, o diferencial tecnológico, quem você busca para parcerias e qual o core ideal."
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Maturidade Inicial do Projeto</label>
                  <select
                    value={newMaturity}
                    id="modal_project_maturity"
                    onChange={(e) => setNewMaturity(e.target.value as MaturityLevel)}
                    className="mt-1 block w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 bg-white"
                  >
                    <option value={MaturityLevel.Concept}>{MaturityLevel.Concept}</option>
                    <option value={MaturityLevel.Prototype}>{MaturityLevel.Prototype}</option>
                    <option value={MaturityLevel.Validation}>{MaturityLevel.Validation}</option>
                    <option value={MaturityLevel.Product}>{MaturityLevel.Product}</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[10px] text-slate-500 flex items-center">
                  Você iniciará com 1 componente básico e poderá detalhar depois diagramas, links, teses e observações compartilhadas!
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="btn_cancel_add_project"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn_submit_add_project"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white transition cursor-pointer"
                >
                  Compartilhar Ideia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
