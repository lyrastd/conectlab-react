import React, { useState } from "react";
import { Project, UserProfile, PostComponent, PostComponentType, ComponentComment, ParticipationRequest, ProjectAlteration, MaturityLevel } from "../types";
import { ArrowLeft, Users, FileText, Check, X, Shield, GitBranch, MessageSquare, Plus, Edit2, Bookmark, Flame, Upload, RefreshCw, Trash2, HelpCircle } from "lucide-react";

interface ProjectDetailsProps {
  project: Project;
  currentUser: UserProfile;
  comments: ComponentComment[];
  requests: ParticipationRequest[];
  alterations: ProjectAlteration[];
  onBack: () => void;
  onAddComment: (componentId: string, text: string) => void;
  onAddObservation: (componentId: string, notes: string) => void;
  onToggleFreedom: (userId: string) => void;
  onReviewRequest: (requestId: string, status: "approved" | "rejected") => void;
  onReviewAlteration: (alterationId: string, status: "approved" | "rejected") => void;
  onUndoAlteration: (alterationId: string) => void;
  onAddRequest: (projectId: string, proposal: string) => void;
  onAddComponent: (projectId: string, type: PostComponentType, title: string, content: string) => void;
  onEditComponent: (projectId: string, componentId: string, title: string, content: string) => void;
  onUpdateMaturity: (projectId: string, maturity: MaturityLevel) => void;
}

export default function ProjectDetails({
  project,
  currentUser,
  comments,
  requests,
  alterations,
  onBack,
  onAddComment,
  onAddObservation,
  onToggleFreedom,
  onReviewRequest,
  onReviewAlteration,
  onUndoAlteration,
  onAddRequest,
  onAddComponent,
  onEditComponent,
  onUpdateMaturity
}: ProjectDetailsProps) {
  const isOwner = currentUser.id === project.ownerId;
  const isParticipant = project.participants.some((p) => p.userId === currentUser.id);
  const participantMeta = project.participants.find((p) => p.userId === currentUser.id);
  const hasDirectFreedom = isOwner || (participantMeta?.hasFreedom ?? false);

  // Comments state per component
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Edit component states
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Edit observations states
  const [editingObsComponentId, setEditingObsComponentId] = useState<string | null>(null);
  const [obsText, setObsText] = useState("");

  // Apply request proposal form
  const [hasApplied, setHasApplied] = useState(requests.some((r) => r.projectId === project.id && r.applicantId === currentUser.id));
  const [proposalText, setProposalText] = useState("");

  // Add new component form
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newCompType, setNewCompType] = useState<PostComponentType>(PostComponentType.Idea);
  const [newCompTitle, setNewCompTitle] = useState("");
  const [newCompContent, setNewCompContent] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Quick diagram interactive builder
  const [diagramNodesText, setDiagramNodesText] = useState("A -> B -> C");

  const handleApplyToProject = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRequest(project.id, proposalText);
    setProposalText("");
    setHasApplied(true);
  };

  const handleAddNewComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompTitle || !newCompContent) return;

    let parsedContent = newCompContent;
    if (newCompType === PostComponentType.Diagram) {
      // Build a simple sequential nodes diagram
      const steps = (diagramNodesText || "").toString().split("->").map(s => s.trim()).filter(Boolean);
      const nodes = steps.map((s, idx) => ({
        id: String.fromCharCode(65 + idx),
        label: s,
        x: 100 + idx * 180,
        y: 120
      }));
      const connections = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({ from: nodes[i].id, to: nodes[i + 1].id });
      }
      parsedContent = JSON.stringify({ nodes, connections });
    }

    onAddComponent(project.id, newCompType, newCompTitle, parsedContent);
    // Reset
    setNewCompTitle("");
    setNewCompContent("");
    setShowAddComponent(false);
  };

  const handleEditSubmit = (componentId: string) => {
    onEditComponent(project.id, componentId, editTitle, editContent);
    setEditingComponentId(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setNewCompType(PostComponentType.File);
      setNewCompTitle(`Arquivo: ${file.name}`);
      setNewCompContent(`Simulado: Arquivo técnico do tipo ${file.type || "binário"} com tamanho de ${(file.size / 1024).toFixed(1)} KB.`);
      setShowAddComponent(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewCompType(PostComponentType.File);
      setNewCompTitle(`Arquivo: ${file.name}`);
      setNewCompContent(`Simulado: Arquivo anexado de tipo ${file.type || "binário"} com tamanho de ${(file.size / 1024).toFixed(1)} KB.`);
      setShowAddComponent(true);
    }
  };

  // Safe JSON parse for Diagrams
  const renderDiagram = (content: string) => {
    try {
      const { nodes, connections } = JSON.parse(content) as {
        nodes: { id: string; label: string; x: number; y: number }[];
        connections: { from: string; to: string }[];
      };
      return (
        <div className="bg-slate-900 text-white rounded-xl p-4 my-2 overflow-x-auto relative min-h-[160px] border border-slate-800">
          <span className="absolute top-2 right-2 text-[9px] font-mono text-indigo-400 font-bold uppercase">Diagrama Iterativo</span>
          <div className="flex items-center justify-around gap-4 min-w-[500px] py-4 h-full">
            {nodes.map((node, i) => (
              <React.Fragment key={node.id}>
                {i > 0 && (
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-xs text-indigo-400 font-mono">➡</span>
                  </div>
                )}
                <div className="bg-indigo-950 border border-indigo-500/40 text-indigo-100 p-3 rounded-lg text-center shadow-md relative min-w-[120px]">
                  <span className="absolute -top-2.5 -left-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {node.id}
                  </span>
                  <p className="text-xs font-bold leading-tight">{node.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    } catch {
      return (
        <div className="p-3 bg-slate-100 text-slate-500 text-xs italic rounded-lg">
          Diagrama com formatação corrompida.
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-0 pb-12">
      
      {/* Back to feed button */}
      <button
        id="btn_back_to_feed"
        onClick={onBack}
        className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para a Linha do Tempo
      </button>

      {/* Main Cover Metadata */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">Ambiente de Execução</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-400 font-mono">ID: {project.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {project.description}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <img src={project.ownerAvatar} className="w-8 h-8 rounded-full border border-slate-200 object-cover" alt="" referrerPolicy="no-referrer"/>
            <div>
              <p className="text-xs font-bold text-slate-800">Dono: {project.ownerName}</p>
              <p className="text-[10px] text-indigo-500">{project.ownerSpecialty}</p>
            </div>
          </div>
        </div>

        {/* Change Maturity Selector for Owner */}
        <div className="flex flex-col items-stretch sm:items-end gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100 w-full md:w-auto">
          <span className="text-[10px] font-mono text-slate-450 uppercase font-semibold">Status de Desenvolvimento</span>
          <div className="flex items-center gap-1.5">
            {isOwner ? (
              <select
                id="select_project_maturity"
                value={project.maturity}
                onChange={(e) => onUpdateMaturity(project.id, e.target.value as MaturityLevel)}
                className="text-xs font-bold bg-white border border-slate-300 rounded-lg p-1 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={MaturityLevel.Concept}>Conceito</option>
                <option value={MaturityLevel.Prototype}>Protótipo</option>
                <option value={MaturityLevel.Validation}>Validação</option>
                <option value={MaturityLevel.Product}>Produto</option>
              </select>
            ) : (
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                {project.maturity}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-450 italic mt-0.5">
            {isOwner ? "Alterar status atualiza a comunidade" : "Visualização pública de maturidade"}
          </p>
        </div>
      </div>

      {/* Grid of details: components canvas (left 2/3) and collaboration settings (right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Post Components list & inline reviews */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Section banner and fast add triggers */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              ★ Componentes do Projeto ({project.components.length})
            </h2>

            {/* Direct and Indirect Freedom alerts */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                hasDirectFreedom ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                {isOwner ? "Dono (Acesso Pleno)" : hasDirectFreedom ? "Liberdade Concedida (Livre)" : "Revisão Necessária (Controlado)"}
              </span>
              
              {(isOwner || isParticipant) && (
                <button
                  id="btn_add_component_trigger"
                  onClick={() => setShowAddComponent(!showAddComponent)}
                  className="p-1 px-2.5 bg-slate-900 hover:bg-slate-700 rounded-md text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Elemento
                </button>
              )}
            </div>
          </div>

          {/* Add Component form & File upload trigger */}
          {showAddComponent && (
            <div className="bg-white p-5 rounded-2xl border border-indigo-100/80 shadow-md shadow-indigo-100/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800">
                  Adicionar Componente Técnico ou Documento
                </h3>
                <button
                  onClick={() => setShowAddComponent(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-mono font-bold cursor-pointer"
                >
                  cancelar ✕
                </button>
              </div>

              {/* Drag and Drop Container for Files */}
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                  dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">Arrastar & Soltar arquivo técnico aqui</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Suporta diagramas, fotos, artigos (.pdf, .png, .json, .ipynb)</p>
                
                <div className="mt-2 text-xs">
                  <label className="cursor-pointer bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-700 shadow-sm hover:bg-slate-50 inline-block text-[10px]">
                    Procurar no computador
                    <input type="file" onChange={handleFileSelect} className="hidden" />
                  </label>
                </div>
              </div>

              <form onSubmit={handleAddNewComponent} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] text-slate-450 uppercase font-mono font-semibold">Tipo do Novo Recurso</label>
                    <select
                      value={newCompType}
                      id="new_component_type"
                      onChange={(e) => setNewCompType(e.target.value as PostComponentType)}
                      className="mt-1 block w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none text-slate-800"
                    >
                      <option value={PostComponentType.Idea}>💡 Ideia / Conceito Técnico</option>
                      <option value={PostComponentType.Diagram}>📊 Fluxo / Diagrama de Execução</option>
                      <option value={PostComponentType.Theory}>🔬 Teoria Científica</option>
                      <option value={PostComponentType.Hypothesis}>❓ Hipótese Técnica</option>
                      <option value={PostComponentType.Link}>🔗 Link Externo / Repositório</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-450 uppercase font-mono font-semibold">Título Técnico</label>
                    <input
                      type="text"
                      required
                      id="new_component_title"
                      value={newCompTitle}
                      onChange={(e) => setNewCompTitle(e.target.value)}
                      placeholder="Ex: Arquitetura de Comunicação em Barramento"
                      className="mt-1 block w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                {newCompType === PostComponentType.Diagram ? (
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 space-y-2">
                    <label className="block text-[10px] text-indigo-700 font-bold uppercase font-mono">Editor Rápido de Fluxograma (Anotação de Passos)</label>
                    <input
                      type="text"
                      value={diagramNodesText}
                      onChange={(e) => setDiagramNodesText(e.target.value)}
                      placeholder="Passo A -> Passo B -> Passo C"
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                    />
                    <p className="text-[9px] text-indigo-600">Escreva seqüencial com setas '-&gt;' para simular graficamente o fluxo de execução.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-slate-450 uppercase font-mono font-semibold">Conteúdo principal / Descrição</label>
                    <textarea
                      rows={2}
                      required
                      id="new_component_content"
                      value={newCompContent}
                      onChange={(e) => setNewCompContent(e.target.value)}
                      placeholder="Qual a tese principal, links, link da foto ou especificação?"
                      className="mt-1 block w-full p-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none text-slate-800"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    id="btn_submit_new_component"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {!hasDirectFreedom ? "Propor Alteração ao Dono" : "Aplicar Componente"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List Components in details view */}
          {project.components.map((c) => {
            const isEditing = editingComponentId === c.id;
            const isEditingObs = editingObsComponentId === c.id;
            const compComments = comments.filter((comm) => comm.componentId === c.id);

            return (
              <div
                key={c.id}
                id={`component_container_${c.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 relative"
              >
                {/* Component Head */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs font-bold flex items-center justify-center">
                      {c.type === PostComponentType.Idea ? "💡 IDEIA" : ""}
                      {c.type === PostComponentType.Diagram ? "📊 DIAGRAMA" : ""}
                      {c.type === PostComponentType.Link ? "🔗 LINK" : ""}
                      {c.type === PostComponentType.File ? "📎 ARQUIVO" : ""}
                      {c.type === PostComponentType.Theory ? "🔬 TEORIA" : ""}
                      {c.type === PostComponentType.Hypothesis ? "❓ HIPÓTESE" : ""}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
                      {c.title}
                    </h3>
                  </div>

                  {/* Edit permissions check */}
                  {(isOwner || isParticipant) && !isEditing && (
                    <button
                      id={`btn_edit_component_${c.id}`}
                      onClick={() => {
                        setEditingComponentId(c.id);
                        setEditTitle(c.title);
                        setEditContent(c.content);
                      }}
                      className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  )}
                </div>

                {/* Edit component layout inside same space */}
                {isEditing ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Edição do Elemento</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded bg-white font-mono"
                      />
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2 text-xs font-bold">
                      <button
                        onClick={() => setEditingComponentId(null)}
                        className="px-2 py-1 bg-white border border-slate-300 text-slate-600 rounded transition"
                      >
                        Cancelar
                      </button>
                      <button
                        id={`btn_save_edit_component_${c.id}`}
                        onClick={() => handleEditSubmit(c.id)}
                        className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-750 transition"
                      >
                        {!hasDirectFreedom ? "Propor Alteração" : "Salvar Alterações"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard display of component body */
                  <div className="text-xs text-slate-700 leading-relaxed font-sans">
                    {c.type === PostComponentType.Diagram ? (
                      renderDiagram(c.content)
                    ) : c.type === PostComponentType.Link ? (
                      <p className="bg-indigo-50/40 p-2 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-450 font-mono">Link de Referência:</span>
                        <a
                          href={c.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 font-semibold underline truncate flex-1 hover:text-indigo-850"
                        >
                          {c.content}
                        </a>
                      </p>
                    ) : (
                      <p className="whitespace-pre-line bg-slate-50/40 p-3 rounded-xl border border-slate-100 font-sans">{c.content}</p>
                    )}
                  </div>
                )}

                {/* Observations section ("Observação do Post") */}
                <div className="bg-amber-500/5 rounded-xl border border-amber-500/10 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 font-mono flex items-center gap-1 uppercase tracking-wider">
                      <Bookmark className="w-3.5 h-3.5" /> Observações & Detalhamentos Técnicos
                    </span>

                    {(isOwner || isParticipant) && !isEditingObs && (
                      <button
                        id={`btn_edit_obs_${c.id}`}
                        onClick={() => {
                          setEditingObsComponentId(c.id);
                          setObsText(c.notes || "");
                        }}
                        className="text-[10px] text-amber-700 font-bold underline cursor-pointer"
                      >
                        Editar Observações
                      </button>
                    )}
                  </div>

                  {isEditingObs ? (
                    <div className="space-y-2 mt-1">
                      <textarea
                        rows={2}
                        value={obsText}
                        onChange={(e) => setObsText(e.target.value)}
                        placeholder="Adicione rascunhos, dificuldades ou anotações..."
                        className="w-full text-xs p-1.5 border border-amber-300 rounded focus:outline-none bg-white text-slate-800"
                      />
                      <div className="flex justify-end gap-1.5 text-[10px] font-bold">
                        <button
                          onClick={() => setEditingObsComponentId(null)}
                          className="px-2 py-0.5 bg-white border border-slate-350 text-slate-600 rounded transition"
                        >
                          Cancelar
                        </button>
                        <button
                          id={`btn_save_obs_${c.id}`}
                          onClick={() => {
                            onAddObservation(c.id, obsText);
                            setEditingObsComponentId(null);
                          }}
                          className="px-2 py-0.5 bg-amber-700 text-white rounded transition"
                        >
                          {!hasDirectFreedom ? "Propor Notas" : "Salvar Notas"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-900 leading-normal italic">
                      {c.notes ? c.notes : "Nenhuma anotação vinculada. Edite para preencher."}
                    </p>
                  )}
                </div>

                {/* Sub-comments specific to this component */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-450 uppercase mb-2">
                    <span className="flex items-center gap-1.5 font-mono">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Comentários Vinculados ({compComments.length})
                    </span>

                    <button
                      id={`btn_trigger_comment_box_${c.id}`}
                      onClick={() => {
                        setActiveCommentBox(activeCommentBox === c.id ? null : c.id);
                        setCommentText("");
                      }}
                      className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer font-bold"
                    >
                      {activeCommentBox === c.id ? "Cancelar" : "+ Comentar neste item"}
                    </button>
                  </div>

                  {/* Add comment box */}
                  {activeCommentBox === c.id && (
                    <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Escreva um apontamento técnico sobre este item específico..."
                        className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                      />
                      <button
                        id={`btn_submit_comment_${c.id}`}
                        onClick={() => {
                          if (!commentText) return;
                          onAddComment(c.id, commentText);
                          setCommentText("");
                          setActiveCommentBox(null);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Comentar
                      </button>
                    </div>
                  )}

                  {/* Sub-comments list */}
                  {compComments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {compComments.map((comm) => (
                        <div key={comm.id} className="text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 flex gap-2">
                          <img src={comm.authorAvatar} className="w-6 h-6 rounded-full shrink-0 object-cover" alt="" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 leading-none">
                              {comm.authorName}{" "}
                              <span className="text-[9px] font-normal text-slate-400 font-mono ml-1">
                                {new Date(comm.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </p>
                            <p className="text-slate-650 mt-1">{comm.content}</p>
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

        {/* Right column: Collaborator setups, Join controls, Request reviews, Version Undo logs */}
        <div className="space-y-6">
          
          {/* Active Participants & freedom levels */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-indigo-500" /> Participantes e Permissões
            </h3>

            <div className="space-y-3">
              {/* Owner card */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <img src={project.ownerAvatar} className="w-8 h-8 rounded-full border object-cover" alt="" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{project.ownerName}</p>
                    <p className="text-[10px] text-indigo-600 font-semibold truncate">Dono do Projeto</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                  MASTER
                </span>
              </div>

              {/* Participants list */}
              {project.participants.length === 0 ? (
                <p className="text-xs text-slate-400 italic font-sans text-center py-2">Nenhum participante adicionado ainda.</p>
              ) : (
                project.participants.map((part) => (
                  <div key={part.userId} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-white">
                    <div className="flex items-center gap-2">
                      <img src={part.avatar} className="w-8 h-8 rounded-full border object-cover" alt="" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{part.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{part.specialty}</p>
                      </div>
                    </div>

                    {/* Liberty settings toggle: Click toggles degree of freedom */}
                    <div className="text-right">
                      {isOwner ? (
                        <button
                          id={`btn_toggle_freedom_${part.userId}`}
                          onClick={() => {
                            onToggleFreedom(part.userId);
                          }}
                          className={`text-[9px] font-bold py-1 px-2 rounded-md font-mono flex items-center gap-0.5 cursor-pointer border ${
                            part.hasFreedom
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {part.hasFreedom ? "Livre (Unguarded)" : "Revisar (Controlled)"}
                        </button>
                      ) : (
                        <span className={`text-[9px] font-bold py-0.5 px-1.5 rounded font-mono border ${
                          part.hasFreedom ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}>
                          {part.hasFreedom ? "LIVRE" : "MODERADO"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Request to Join button for Non-participants */}
            {!isOwner && !isParticipant && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-start gap-1 text-[11px] text-indigo-700 font-semibold leading-snug">
                  <Flame id="badge_bonus_xp_icon" className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Proponha uma parceria para obter parcerias estratégicas e ganhar XP de Execução!</span>
                </div>

                {hasApplied ? (
                  <div className="bg-white p-3 rounded-xl border border-indigo-150 text-center">
                    <p className="text-xs font-bold text-indigo-600">✓ Proposta Enviada!</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">O dono do projeto analisará o seu cadastro profissional e portfólio.</p>
                  </div>
                ) : (
                  <form onSubmit={handleApplyToProject} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Proposta de Parceria Estratégica (Opcional)</label>
                      <textarea
                        rows={3}
                        required
                        id="proposal_text"
                        value={proposalText}
                        onChange={(e) => setProposalText(e.target.value)}
                        placeholder="Ex: Gostaria de ajudar desenvolvendo as regras no ecossistema e modelando os custos de conversão de créditos."
                        className="w-full text-xs p-2 border border-slate-300 bg-white rounded-lg focus:outline-none text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      id="btn_submit_participation_request"
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition cursor-pointer"
                    >
                      Enviar Proposta de Parceria
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Pending Requests Panel (Owner Only) */}
          {isOwner && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
                ✉ Propostas de Parceria ({requests.filter(r => r.projectId === project.id && r.status === "pending").length})
              </h3>

              <div className="space-y-3">
                {requests.filter(r => r.projectId === project.id && r.status === "pending").length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2 font-sans">Nenhuma nova proposta pendente.</p>
                ) : (
                  requests
                    .filter((r) => r.projectId === project.id && r.status === "pending")
                    .map((req) => (
                      <div key={req.id} id={`req_card_${req.id}`} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
                        <div className="flex items-center gap-2">
                          <img src={req.applicantAvatar} className="w-8 h-8 rounded-full border object-cover" alt="" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 leading-tight truncate">{req.applicantName}</p>
                            <p className="text-[10px] text-indigo-500 font-semibold truncate">{req.applicantSpecialty}</p>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 border border-slate-150 rounded text-[11px] leading-relaxed text-slate-650 italic">
                          "{req.proposal}"
                        </div>

                        {/* Accept or Refuse buttons */}
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn_reject_req_${req.id}`}
                            onClick={() => onReviewRequest(req.id, "rejected")}
                            className="p-1 px-2.5 bg-white border border-slate-350 hover:bg-slate-100 text-slate-700 rounded-md font-bold text-[10px] cursor-pointer"
                          >
                            Recusar
                          </button>
                          <button
                            id={`btn_accept_req_${req.id}`}
                            onClick={() => onReviewRequest(req.id, "approved")}
                            className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-md font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Aceitar Sócio
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Pending Alterations Panel (Owner Only) */}
          {isOwner && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
                ⚡ Alterações Pendentes ({alterations.filter(alt => alt.projectId === project.id && alt.status === "pending").length})
              </h3>

              <div className="space-y-3.5">
                {alterations.filter(alt => alt.projectId === project.id && alt.status === "pending").length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2 font-sans">Nenhuma alteração aguardando análise.</p>
                ) : (
                  alterations
                    .filter((alt) => alt.projectId === project.id && alt.status === "pending")
                    .map((alt) => (
                      <div key={alt.id} id={`alt_card_${alt.id}`} className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-800 uppercase font-mono">
                            REQUISITO PROPÕE: {alt.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-slate-450">{alt.authorName}</span>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Componente:</p>
                          <p className="text-xs text-slate-800 font-mono font-medium truncate">{alt.proposedComponent.title}</p>
                        </div>

                        {alt.originalComponent && (
                          <div className="p-2 bg-slate-100 rounded text-[10px] text-slate-500 max-h-[60px] overflow-y-auto">
                            <span className="font-bold">Original:</span> {alt.originalComponent.content}
                          </div>
                        )}

                        <div className="p-2 bg-white border border-indigo-200 rounded text-[10px] text-slate-700 max-h-[85px] overflow-y-auto">
                          <span className="font-bold text-indigo-700">Modificado:</span> {alt.proposedComponent.content}
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            id={`btn_reject_alt_${alt.id}`}
                            onClick={() => onReviewAlteration(alt.id, "rejected")}
                            className="py-1 px-2.5 bg-white border border-slate-350 hover:bg-slate-100 text-slate-700 rounded-md font-bold text-[10px] cursor-pointer"
                          >
                            Recusar
                          </button>
                          <button
                            id={`btn_accept_alt_${alt.id}`}
                            onClick={() => onReviewAlteration(alt.id, "approved")}
                            className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Aprovar Alteração
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Master Undo Timeline (Owner Only) */}
          {isOwner && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} /> Linha de Reversão (Undo)
                </h3>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase font-mono">
                  Master Undo
                </span>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal font-sans">
                O dono possui o poder master de reverter e desfazer alterações efetuadas por participantes a qualquer momento.
              </p>

              <div className="space-y-2.5">
                {alterations.filter(alt => alt.projectId === project.id && alt.status === "approved").length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2 font-sans">Sem histórico de alterações realizadas.</p>
                ) : (
                  alterations
                    .filter((alt) => alt.projectId === project.id && alt.status === "approved")
                    .map((alt) => (
                      <div key={alt.id} id={`undo_item_${alt.id}`} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 font-mono text-[10px]">{alt.proposedComponent.title}</p>
                            <p className="text-[9px] text-slate-450 mt-0.5 font-sans">Modificado por {alt.authorName}</p>
                          </div>
                          
                          {/* UNDO TRIGGER */}
                          <button
                            id={`btn_undo_alteration_${alt.id}`}
                            onClick={() => onUndoAlteration(alt.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-300 rounded font-semibold text-[10px] py-0.5 px-1.5 cursor-pointer flex items-center gap-0.5"
                            title="Desfazer e reverter esta mudança de componente"
                          >
                            <Trash2 className="w-3 h-3" /> Desfazer (Undo)
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-normal truncate font-sans italic bg-white p-1.5 rounded">{alt.proposedComponent.content}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
