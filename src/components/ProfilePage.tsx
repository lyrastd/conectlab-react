import React, { useState } from "react";
import { UserProfile, Project, Badge } from "../types";
import { Award, Zap, Briefcase, Mail, Linkedin, Github, FileText, CheckCircle, TrendingUp, Sparkles, Globe, Building, Compass, Goal, Plus, Trash2, Image, Edit, Save, X, Settings } from "lucide-react";

interface ProfilePageProps {
  user: UserProfile;
  projects: Project[];
  badges: Badge[];
  currentUser?: UserProfile | null;
  onUpdateUser?: (updated: UserProfile) => Promise<void> | void;
}

export default function ProfilePage({ user, projects, badges, currentUser, onUpdateUser }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Form states matching UserProfile parameters
  const [name, setName] = useState(user.name || "");
  const [specialty, setSpecialty] = useState(user.specialty || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [bio, setBio] = useState(user.bio || "");
  const [skillsStr, setSkillsStr] = useState(user.skills ? user.skills.join(", ") : "");
  const [linkedin, setLinkedin] = useState(user.linkedin || "");
  const [github, setGithub] = useState(user.github || "");
  const [website, setWebsite] = useState(user.website || "");
  const [companiesText, setCompaniesText] = useState(user.companiesText || "");
  const [careerVision, setCareerVision] = useState(user.careerVision || "");
  const [professionalObjective, setProfessionalObjective] = useState(user.professionalObjective || "");
  
  // Local portfolio items list
  const [portfolio, setPortfolio] = useState<{ id: string; url: string; title: string; description?: string }[]>(
    user.portfolio || []
  );
  
  // States to add new portfolio item
  const [newPortTitle, setNewPortTitle] = useState("");
  const [newPortUrl, setNewPortUrl] = useState("");
  const [newPortDesc, setNewPortDesc] = useState("");

  const [saving, setSaving] = useState(false);

  const canEdit = currentUser && currentUser.id === user.id;

  // Find projects owned by this user
  const userProjects = projects.filter((p) => p.ownerId === user.id);
  // Find projects where they participate
  const participantProjects = projects.filter((p) => p.participants.some(part => part.userId === user.id));

  // XP Progress Calculation
  const nextLevelXP = user.level * 300;
  const currentLevelMinXP = (user.level - 1) * 300;
  const levelProgressPercent = Math.min(
    100,
    Math.max(0, ((user.xp - currentLevelMinXP) / 300) * 100)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specialty.trim()) {
      alert("Os campos Nome e Especialidade são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const parsedSkills = typeof skillsStr === "string"
        ? skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
        : user.skills;

      const updatedUser: UserProfile = {
        ...user,
        name: name.trim(),
        specialty: specialty.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        skills: parsedSkills,
        linkedin: linkedin.trim(),
        github: github.trim(),
        website: website.trim(),
        companiesText: companiesText.trim(),
        careerVision: careerVision.trim(),
        professionalObjective: professionalObjective.trim(),
        portfolio: portfolio
      };

      if (onUpdateUser) {
        await onUpdateUser(updatedUser);
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o perfil em nuvem.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPortfolioItem = () => {
    if (!newPortTitle.trim() || !newPortUrl.trim()) {
      alert("Insera ao menos um Título e o Link da foto para adicionar o trabalho ao seu portfólio.");
      return;
    }
    const item = {
      id: `port_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: newPortTitle.trim(),
      url: newPortUrl.trim(),
      description: newPortDesc.trim()
    };
    setPortfolio([...portfolio, item]);
    setNewPortTitle("");
    setNewPortUrl("");
    setNewPortDesc("");
  };

  const handleRemovePortfolioItem = (id: string) => {
    setPortfolio(portfolio.filter((item) => item.id !== id));
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0 animate-fade-in">
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-150 p-6 md:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-indigo-600 shrink-0" /> Editar Perfil Profissional & Pessoal
              </h2>
              <p className="text-xs text-slate-500">Mantenha seu cadastro de transição atualizado para decolar em conexões.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                // reset fields to original values
                setName(user.name || "");
                setSpecialty(user.specialty || "");
                setAvatar(user.avatar || "");
                setBio(user.bio || "");
                setSkillsStr(user.skills ? user.skills.join(", ") : "");
                setLinkedin(user.linkedin || "");
                setGithub(user.github || "");
                setWebsite(user.website || "");
                setCompaniesText(user.companiesText || "");
                setCareerVision(user.careerVision || "");
                setProfessionalObjective(user.professionalObjective || "");
                setPortfolio(user.portfolio || []);
                setIsEditing(false);
              }}
              className="p-1 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 font-extrabold text-xs transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sec 1: Basic personal info */}
            <div className="sm:col-span-2">
              <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-indigo-600 block mb-2 border-b pb-1">1. Apresentação Geral</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-750">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clara Dias"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-750">Especialidade Principal *</label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Designer UX/UI / Dev Cloud Senior"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-750">URL da Foto de Perfil (Opcional)</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="Copie aqui o link de uma imagem válida (Ex: https://images.unsplash.com/...)"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-750">Bio & Resumo Profissional</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Uma breve introdução sobre você e o tipo de cocriação técnica que busca."
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-755">Skills/Competências (Separadas por vírgulas)</label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="React, CSS, Node.js, ESG, UX Design"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            {/* Sec 2: Links */}
            <div className="sm:col-span-2 mt-2">
              <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-indigo-600 block mb-2 border-b pb-1">2. Links e Conexões (Opcionais)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-750">LinkedIn</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/usuario"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-750">GitHub</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="github.com/usuario"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 text-slate-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-750">Website do Portfólio Geral</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://meuportforlio.com"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 text-slate-600"
              />
            </div>

            {/* Sec 3: Trajectory */}
            <div className="sm:col-span-2 mt-2">
              <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-indigo-600 block mb-2 border-b pb-1">3. Trajetória, Visão e Objetivos (Opcionais)</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-750">Empresas e Experiências Profissionais Recentes</label>
              <input
                type="text"
                value={companiesText}
                onChange={(e) => setCompaniesText(e.target.value)}
                placeholder="Ex: Siemens, Google, Freelancer de UX, Bolsista CNPq"
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-750">Visão de Carreira (Futuro)</label>
              <textarea
                value={careerVision}
                onChange={(e) => setCareerVision(e.target.value)}
                rows={2}
                placeholder="Onde você planeja estar ou que parcerias transformadoras deseja atrair."
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-755">Objetivo Profissional</label>
              <textarea
                value={professionalObjective}
                onChange={(e) => setProfessionalObjective(e.target.value)}
                rows={2}
                placeholder="Seu alvo principal a curto/médio prazo (Ex: Atuar na modelagem ágil de tecnologias hidrotérmicas)."
                className="mt-1 block w-full px-3.5 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
              />
            </div>

            {/* Sec 4: Portfolio */}
            <div className="sm:col-span-2 mt-2">
              <span className="text-[10px] uppercase font-bold font-mono tracking-widest text-indigo-600 block mb-2 border-b pb-1">4. Galeria de Fotos e Trabalhos do Portfólio</span>
            </div>

            {/* Existing portfolio items */}
            <div className="sm:col-span-2">
              {portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {portfolio.map((item, idx) => (
                    <div key={item.id || idx} className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2.5 flex flex-col justify-between group">
                      <img src={item.url} alt={item.title} className="w-full h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                      <div className="mt-1.5 min-w-0">
                        <h5 className="text-[10px] font-bold text-slate-800 truncate">{item.title}</h5>
                        {item.description && <p className="text-[9px] text-slate-450 line-clamp-1">{item.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioItem(item.id)}
                        className="absolute top-1.5 right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-md transition shadow-md cursor-pointer"
                        title="Remover este item de portfólio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic mb-4">Nenhum certificado ou trabalho listado na sua galeria.</p>
              )}

              {/* Form to append a portfolio item */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-350 space-y-2.5">
                <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5" /> Adicionar Trabalho/Certificado à Galeria (Opcional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Título do Trabalho (Ex: Certificado Docker)"
                    value={newPortTitle}
                    onChange={(e) => setNewPortTitle(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Link da imagem (Ex: https://images.unsplash.com/...)"
                    value={newPortUrl}
                    onChange={(e) => setNewPortUrl(e.target.value)}
                    className="block w-full px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Descrição Opcional das Competências"
                  value={newPortDesc}
                  onChange={(e) => setNewPortDesc(e.target.value)}
                  className="block w-full px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPortfolioItem}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Incorporar Trabalho
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Salvando em Nuvem..." : "Salvar Alterações do Perfil"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
              }}
              className="px-6 py-2 border border-slate-250 text-slate-650 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Voltar sem Alterar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 px-4 md:px-0 animate-fade-in">
      
      {/* Profile banner & essential personal/professional details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
        {/* Background ambient mesh */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative">
          <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-2 border-indigo-100 object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
                <span className="bg-indigo-600 text-white font-mono px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 shadow-sm shadow-indigo-600/10">
                  <Zap className="w-3 h-3 fill-current" /> Nível {user.level}
                </span>
                
                {user.userName && (
                  <span className="bg-slate-100 text-indigo-750 font-mono px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    {user.userName}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-600 font-semibold mt-1 font-mono">{user.specialty}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 self-stretch sm:self-auto items-stretch sm:items-center">
            {/* Social icons */}
            <div className="flex items-center justify-center gap-2">
              {user.linkedin && (
                <a
                  href={user.linkedin.startsWith("http") ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-500 flex items-center gap-1.5 transition text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Linkedin className="w-3.5 h-3.5 shrink-0" /> LinkedIn
                </a>
              )}
              {user.github && (
                <a
                  href={user.github.startsWith("http") ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-800 flex items-center gap-1.5 transition text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Github className="w-3.5 h-3.5 shrink-0" /> GitHub
                </a>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-500 flex items-center gap-1.5 transition text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" /> Website
                </a>
              )}
            </div>

            {/* Quick action: Edit profile if mine */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Editar Cadastro
              </button>
            )}
          </div>
        </div>

        {/* Bio segment */}
        <p className="text-xs text-slate-600 mt-6 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-sans italic">
          "{user.bio || "Nenhuma bio preenchida ainda..."}"
        </p>

        {/* Skills List display */}
        {user.skills && user.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {user.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-indigo-50/70 text-indigo-700 border border-indigo-100 text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono"
              >
                #{skill}
              </span>
            ))}
          </div>
        )}

        {/* Dynamic XP Progress panel */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-450 font-mono flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Progresso de Contribuição
            </span>
            <span className="font-bold text-slate-800 font-mono">
              {user.xp} XP / {nextLevelXP} XP
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300 shadow-sm shadow-indigo-600/30"
              style={{ width: `${levelProgressPercent}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono text-right">
            Faltam {nextLevelXP - user.xp} XP para alcançar o Nível {user.level + 1}
          </p>
        </div>
      </div>

      {/* Trajectories and Foci (optional fields card) */}
      {(user.companiesText || user.careerVision || user.professionalObjective) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Award className="w-4 h-4 text-indigo-500" /> Trajetória de Competências & Foco estratégico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user.companiesText && (
              <div className="space-y-1 bg-slate-50 p-3 h-full rounded-xl border border-slate-100 flex flex-col justify-start">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-slate-550 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Empresas / Projetos
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed font-sans pt-1">
                  {user.companiesText}
                </p>
              </div>
            )}
            
            {user.careerVision && (
              <div className="space-y-1 bg-slate-50 p-3 h-full rounded-xl border border-slate-100 flex flex-col justify-start">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-slate-550 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Visão de Carreira
                </span>
                <p className="text-xs text-slate-750 leading-relaxed font-sans pt-1">
                  {user.careerVision}
                </p>
              </div>
            )}

            {user.professionalObjective && (
              <div className="space-y-1 bg-slate-50 p-3 h-full rounded-xl border border-slate-100 flex flex-col justify-start">
                <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-slate-550 flex items-center gap-1">
                  <Goal className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Objetivo Profissional
                </span>
                <p className="text-xs text-slate-750 leading-relaxed font-sans pt-1">
                  {user.professionalObjective}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio works gallery */}
      {user.portfolio && user.portfolio.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Image className="w-4.5 h-4.5 text-indigo-600 shrink-0" /> Galeria & Fotos de Portfólio ({user.portfolio.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user.portfolio.map((item) => (
              <div key={item.id} className="group border border-slate-100 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-100 transition duration-200 bg-slate-50/50 flex flex-col justify-between">
                <div className="relative overflow-hidden aspect-video bg-slate-200 flex items-center justify-center">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-3 bg-white border-t border-slate-100/50 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                  {item.description && (
                    <p className="text-[10px] text-slate-450 line-clamp-2 mt-1 leading-normal font-sans">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges block */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Award className="w-4.5 h-4.5 text-amber-500" /> Medalhas e Conquistas Destacadas ({user.badges.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const isUnlocked = user.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                  isUnlocked
                    ? `${badge.color} shadow-sm`
                    : "bg-slate-50 border-slate-200 text-slate-350 opacity-60"
                }`}
              >
                <div className="p-1.5 rounded-lg bg-white shrink-0 shadow-sm">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-normal truncate">{badge.name}</h4>
                  <p className="text-[10px] leading-tight line-clamp-2 mt-0.5">
                    {badge.description}
                  </p>
                  {isUnlocked && (
                    <span className="text-[8px] font-bold font-mono tracking-wider text-emerald-600 flex items-center gap-0.5 mt-1 block uppercase">
                      ✓ Desbloqueada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of Portfolio & Contributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: My Portfolio (projects owned and participating in) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Briefcase className="w-4 h-4 text-indigo-500" /> Portfólio de Projetos ({userProjects.length + participantProjects.length})
          </h3>

          <div className="space-y-3">
            {/* User Owned Projects */}
            {userProjects.map((proj) => (
              <div key={proj.id} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{proj.title}</h4>
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.2 rounded text-[9px] font-bold font-mono">
                    PROPRIETÁRIO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{proj.description}</p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-slate-400">
                  <span>Maturidade: <strong className="text-slate-600">{proj.maturity}</strong></span>
                  <span>•</span>
                  <span>{proj.components.length} módulos</span>
                </div>
              </div>
            ))}

            {/* User Participating Projects */}
            {participantProjects.map((proj) => (
              <div key={proj.id} className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{proj.title}</h4>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.2 rounded text-[9px] font-bold font-mono">
                    COLABORADOR
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{proj.description}</p>
                <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-slate-400">
                  <span>Dono: <strong className="text-slate-650">{proj.ownerName}</strong></span>
                  <span>•</span>
                  <span>Maturidade: <strong className="text-slate-600">{proj.maturity}</strong></span>
                </div>
              </div>
            ))}

            {userProjects.length === 0 && participantProjects.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-4">Nenhum projeto ativo neste portfólio.</p>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Contribution Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Histórico de Contribuições Detalhado
          </h3>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {user.contributions.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma contribuição listada no histórico.</p>
            ) : (
              [...user.contributions]
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">{log.type}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{log.projectTitle}</p>
                      <span className="text-[9px] text-slate-450 font-mono">
                        {new Date(log.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono py-0.5 px-2 rounded-full border border-emerald-250">
                        +{log.xpEarned} XP
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
