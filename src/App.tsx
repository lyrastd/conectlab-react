import React, { useState, useEffect } from "react";
import {
  Project,
  UserProfile,
  MaturityLevel,
  SmokeTestFeedback,
  ComponentComment,
  ParticipationRequest,
  ProjectAlteration,
  PostComponent,
  PostComponentType
} from "./types";
import { GLOBAL_BADGES } from "./mockData";
import ActorSelector from "./components/ActorSelector";
import AuthScreen from "./components/AuthScreen";
import Timeline from "./components/Timeline";
import ProjectDetails from "./components/ProjectDetails";
import ProfilePage from "./components/ProfilePage";
import GuidedTutorial from "./components/GuidedTutorial";
import { Sparkles, Compass, User, LogOut, HelpCircle } from "lucide-react";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { collection, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const conectLabLogo = "/src/assets/images/conect_lab_icon_1781198769916.jpg";

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [feedbacks, setFeedbacks] = useState<SmokeTestFeedback[]>([]);
  const [comments, setComments] = useState<ComponentComment[]>([]);
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [alterations, setAlterations] = useState<ProjectAlteration[]>([]);

  // Active view router: "feed" | "details" | "profile"
  const [activeTab, setActiveTab] = useState<"feed" | "profile" | "details">("feed");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // States to support viewing another user's profile and the custom welcome experience
  const [viewedUserProfile, setViewedUserProfile] = useState<UserProfile | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Notifications or toast alerts
  const [notification, setNotification] = useState<{ text: string; type: "success" | "info" | "xp" } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tutorialIsOpen, setTutorialIsOpen] = useState(false);

  // Trigger welcome modal of the guided tutorial only on completed registration as requested.

  // Pathname-driven routing for user profiles (e.g., domain/userName or domain/@userName)
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (!path || path === "/" || path === "/index.html") {
        return;
      }
      
      const parts = (path || "").split("/");
      const lastPart = parts[parts.length - 1]; // e.g., "@userName" or "userName"
      if (lastPart) {
        let norm = lastPart.toLowerCase().trim();
        if (!norm.startsWith("@")) {
          norm = "@" + norm;
        }
        
        // Find user by normalized userName
        const userFound = users.find((u) => u.userName?.toLowerCase() === norm);
        if (userFound) {
          setViewedUserProfile(userFound);
          setSelectedProjectId(null);
          setActiveTab("profile");
        }
      }
    };

    if (users.length > 0) {
      handleUrlRoute();
    }

    window.addEventListener("popstate", handleUrlRoute);
    return () => {
      window.removeEventListener("popstate", handleUrlRoute);
    };
  }, [users]);

  // View specific user profile handler
  const handleViewUserProfile = (userIdStrOrUser: string | UserProfile) => {
    const userToView = typeof userIdStrOrUser === "string" 
      ? users.find((u) => u.id === userIdStrOrUser)
      : userIdStrOrUser;
      
    if (userToView) {
      setViewedUserProfile(userToView);
      setSelectedProjectId(null);
      setActiveTab("profile");
      
      // Update browser URL history state to access by /userName
      const cleanName = userToView.userName?.replace(/^@/, "") || userToView.id;
      window.history.pushState(null, "", `/${cleanName}`);
    }
  };

  // --- firebase authentication listener ---
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (fUser) => {
      setLoadingAuth(true);
      if (fUser) {
        try {
          const userDocRef = doc(db, "users", fUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as UserProfile);
          } else {
            setCurrentUser(null);
          }
        } catch (e) {
          console.error("Erro ao obter documento de perfil no Firestore:", e);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // --- REAL-TIME DATABASE SNAPSHOT SYNCHRONIZATIONS ---
  useEffect(() => {
    // Keep listeners active if they have logged into auth (even if profile username setup is incomplete)
    if (!currentUser && !auth.currentUser) return;

    // Users snapshot
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      setUsers(list);
      
      if (currentUser) {
        const updatedMe = list.find((u) => u.id === currentUser.id);
        if (updatedMe) {
          if (JSON.stringify(updatedMe) !== JSON.stringify(currentUser)) {
            setCurrentUser(updatedMe);
          }
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, "users"));

    // Projects snapshot
    const unsubProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Project);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProjects(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "projects"));

    // Feedbacks snapshot
    const unsubFeedbacks = onSnapshot(collection(db, "feedbacks"), (snapshot) => {
      const list: SmokeTestFeedback[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as SmokeTestFeedback);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFeedbacks(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "feedbacks"));

    // Comments snapshot
    const unsubComments = onSnapshot(collection(db, "comments"), (snapshot) => {
      const list: ComponentComment[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ComponentComment);
      });
      setComments(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "comments"));

    // Requests snapshot
    const unsubRequests = onSnapshot(collection(db, "requests"), (snapshot) => {
      const list: ParticipationRequest[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ParticipationRequest);
      });
      setRequests(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "requests"));

    // Alterations snapshot
    const unsubAlterations = onSnapshot(collection(db, "alterations"), (snapshot) => {
      const list: ProjectAlteration[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ProjectAlteration);
      });
      setAlterations(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "alterations"));

    return () => {
      unsubUsers();
      unsubProjects();
      unsubFeedbacks();
      unsubComments();
      unsubRequests();
      unsubAlterations();
    };
  }, [currentUser?.id]);

  // Dynamically update document title based on logged-in user ID
  useEffect(() => {
    if (currentUser && currentUser.userName) {
      document.title = `${currentUser.userName} | Conect Lab`;
    } else {
      document.title = "Conect Lab";
    }
  }, [currentUser?.userName]);

  // Utility toast dispatcher
  const showToast = (text: string, type: "success" | "info" | "xp" = "success") => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // --- Auth handlers ---
  const handleUpdateUserProfile = async (updated: UserProfile) => {
    try {
      await setDoc(doc(db, "users", updated.id), updated);
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast("Seu perfil foi atualizado com sucesso em nuvem!", "success");
    } catch (err) {
      console.error("Erro ao salvar perfil em nuvem:", err);
      showToast("Não foi possível sincronizar o perfil com a nuvem.", "info");
    }
  };

  const handleLogin = (user: UserProfile, isNewRegistration?: boolean) => {
    setCurrentUser(user);
    setActiveTab("feed");
    showToast(`Bem-vindo, ${user.name}! Conta autenticada em nuvem.`, "success");
    if (isNewRegistration) {
      setShowWelcomeModal(true);
    }
  };

  const handleCompleteTutorial = async () => {
    setTutorialIsOpen(false);
    if (!currentUser) return;

    localStorage.setItem(`con_lab_showed_tutorial_${currentUser.id}`, "true");

    const updatedUser = {
      ...currentUser,
      hasSeenTutorial: true
    };
    try {
      await setDoc(doc(db, "users", currentUser.id), updatedUser);
      showToast("Tutorial concluído! Você agora domina o Conect Lab.", "success");
    } catch (err) {
      console.error("Erro ao salvar status do tutorial no Firestore:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setSelectedProjectId(null);
      setActiveTab("feed");
      showToast("Sessão finalizada com sucesso.", "info");
    } catch (err) {
      console.error(err);
    }
  };

  // --- Simulated Actor-Selector toggle helper ---
  const handleSwitchActor = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      showToast(`Sessão alternada para: ${targetUser.name}`, "info");
    }
  };

  // Give reward points and assess badge unlocking
  const awardUserXP = async (userId: string, points: number, description: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const newXP = targetUser.xp + points;
    const currentLevel = targetUser.level;
    const newLevel = Math.floor(newXP / 300) + 1;
    const updatedBadges = [...targetUser.badges];

    if (newXP >= 500 && !updatedBadges.includes("expert_contributor")) {
      updatedBadges.push("expert_contributor");
      setTimeout(() => showToast("🏆 Medalha Desbloqueada: Executor Ágil!", "success"), 2000);
    }

    const contributionLog = {
      id: "log_" + Date.now() + Math.random().toString(36).substr(2, 4),
      projectId: selectedProjectId || "",
      projectTitle: projects.find((p) => p.id === selectedProjectId)?.title || "Conect Lab Network",
      type: description,
      xpEarned: points,
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...targetUser,
      xp: newXP,
      level: newLevel,
      badges: updatedBadges,
      contributions: [contributionLog, ...targetUser.contributions]
    };

    if (newLevel > currentLevel) {
      setTimeout(() => showToast(`🎉 Parabéns! Você subiu para o Nível ${newLevel}!`, "success"), 1000);
    }

    try {
      await setDoc(doc(db, "users", userId), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }

    showToast(`+${points} XP - ${description}`, "xp");
  };

  // --- Follow logic ---
  const handleFollowUser = async (targetUserId: string) => {
    if (!currentUser) return;
    const isAlreadyFollowing = currentUser.followingUsers.includes(targetUserId);
    if (isAlreadyFollowing) return;

    const updatedFollowing = [...currentUser.followingUsers, targetUserId];
    const updated = { ...currentUser, followingUsers: updatedFollowing };

    try {
      await setDoc(doc(db, "users", currentUser.id), updated);
      showToast(`Você começou a seguir este especialista! Projetos dele agora têm prioridade na sua linha do tempo.`, "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  const handleUnfollowUser = async (targetUserId: string) => {
    if (!currentUser) return;
    const updatedFollowing = currentUser.followingUsers.filter((id) => id !== targetUserId);
    const updated = { ...currentUser, followingUsers: updatedFollowing };

    try {
      await setDoc(doc(db, "users", currentUser.id), updated);
      showToast(`Deixou de seguir. Feed reorganizado.`, "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`);
    }
  };

  // --- Like logic ---
  const handleLikeProject = async (projectId: string) => {
    if (!currentUser) return;
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const exists = proj.likedBy.includes(currentUser.id);
    const nextLikedBy = exists
      ? proj.likedBy.filter((uid) => uid !== currentUser.id)
      : [...proj.likedBy, currentUser.id];
    
    const updatedProj = {
      ...proj,
      likes: exists ? proj.likes - 1 : proj.likes + 1,
      likedBy: nextLikedBy
    };

    try {
      await setDoc(doc(db, "projects", projectId), updatedProj);
      if (!exists) {
        showToast("Você deu upvote nessa colaboração! 🚀", "success");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  // --- Add Smoke feedback logic (from non-participants) ---
  const handleAddSmokeFeedback = async (projectId: string, rating: number, content: string) => {
    if (!currentUser) return;
    const feedbackId = "f_" + Date.now();
    const newFeedback: SmokeTestFeedback = {
      id: feedbackId,
      projectId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorSpecialty: currentUser.specialty,
      rating,
      content,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "feedbacks", feedbackId), newFeedback);
      await awardUserXP(currentUser.id, 80, "Realizou teste de fumaça crítico");

      if (!currentUser.badges.includes("validator")) {
        const updatedBadges = [...currentUser.badges, "validator"];
        const updated = { ...currentUser, badges: updatedBadges };
        await setDoc(doc(db, "users", currentUser.id), updated);
        showToast("🏆 Medalha Desbloqueada: Validador Científico!", "success");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `feedbacks/${feedbackId}`);
    }
  };

  // --- Share New Project Idea ---
  const handleAddProject = async (title: string, description: string, maturity: MaturityLevel) => {
    if (!currentUser) return;
    const newProjectId = "p_custom_" + Date.now();
    const newProject: Project = {
      id: newProjectId,
      title,
      description,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerAvatar: currentUser.avatar,
      ownerSpecialty: currentUser.specialty,
      maturity,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      participants: [],
      components: [
        {
          id: "comp_base_" + Date.now(),
          type: PostComponentType.Idea,
          title: "Premissa Inicial do Conceito",
          content: description,
          notes: "Tese inicial aberta para parcerias e debates de engenharia."
        }
      ]
    };

    try {
      await setDoc(doc(db, "projects", newProjectId), newProject);
      await awardUserXP(currentUser.id, 150, `Publicou a ideia: ${title}`);

      if (!currentUser.badges.includes("first_project")) {
        const updatedBadges = [...currentUser.badges, "first_project"];
        const updated = { ...currentUser, badges: updatedBadges };
        await setDoc(doc(db, "users", currentUser.id), updated);
        showToast("🏆 Medalha Desbloqueada: Criador Original!", "success");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${newProjectId}`);
    }
  };

  // --- Add Component Comment ---
  const handleAddComment = async (componentId: string, content: string) => {
    if (!currentUser) return;
    const commentId = "comm_" + Date.now();
    const newComm: ComponentComment = {
      id: commentId,
      componentId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "comments", commentId), newComm);
      await awardUserXP(currentUser.id, 20, "Comentou em módulo de postagem");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `comments/${commentId}`);
    }
  };

  // --- Add observation notes ---
  const handleAddObservation = async (componentId: string, notes: string) => {
    if (!currentUser || !selectedProjectId) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    const isOwner = currentUser.id === project.ownerId;
    const partMeta = project.participants.find((p) => p.userId === currentUser.id);
    const hasFreedom = isOwner || (partMeta?.hasFreedom ?? false);

    if (hasFreedom) {
      const updatedProj = {
        ...project,
        components: project.components.map((c) =>
          c.id === componentId ? { ...c, notes } : c
        )
      };
      try {
        await setDoc(doc(db, "projects", selectedProjectId), updatedProj);
        showToast("Anotações de Observação salvas com sucesso!", "success");
        await awardUserXP(currentUser.id, 15, "Atualizou observações diretamente");
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${selectedProjectId}`);
      }
    } else {
      const targetComp = project.components.find((c) => c.id === componentId);
      if (!targetComp) return;

      const proposed: PostComponent = { ...targetComp, notes };
      const altId = "alt_" + Date.now();
      const newAlt: ProjectAlteration = {
        id: altId,
        projectId: selectedProjectId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        componentId: componentId,
        type: "edit",
        originalComponent: targetComp,
        proposedComponent: proposed,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "alterations", altId), newAlt);
        showToast("Como você não possui liberdade total, as anotações foram enviadas para aprovação do dono!", "info");
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `alterations/${altId}`);
      }
    }
  };

  // --- Owner Toggles Degrees of Freedom ---
  const handleToggleFreedom = async (userId: string) => {
    if (!currentUser || !selectedProjectId) return;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    const updatedProj = {
      ...project,
      participants: project.participants.map((part) =>
        part.userId === userId ? { ...part, hasFreedom: !part.hasFreedom } : part
      )
    };

    try {
      await setDoc(doc(db, "projects", selectedProjectId), updatedProj);
      showToast("Grau de Liberdade do participante alterado com sucesso!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${selectedProjectId}`);
    }
  };

  // --- Owner reviews participation request ---
  const handleReviewRequest = async (requestId: string, status: "approved" | "rejected") => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    try {
      await setDoc(doc(db, "requests", requestId), { ...req, status });

      if (status === "approved") {
        const project = projects.find((p) => p.id === req.projectId);
        if (project) {
          const exists = project.participants.some((p) => p.userId === req.applicantId);
          if (!exists) {
            const updatedProj = {
              ...project,
              participants: [
                ...project.participants,
                {
                  userId: req.applicantId,
                  name: req.applicantName,
                  specialty: req.applicantSpecialty,
                  avatar: req.applicantAvatar,
                  hasFreedom: false
                }
              ]
            };
            await setDoc(doc(db, "projects", req.projectId), updatedProj);
          }
        }

        await awardUserXP(req.applicantId, 100, `Aceito no projeto: ${projects.find(p => p.id === req.projectId)?.title}`);
        
        const applicantUser = users.find(u => u.id === req.applicantId);
        if (applicantUser && !applicantUser.badges.includes("alliance")) {
          await setDoc(doc(db, "users", req.applicantId), {
            ...applicantUser,
            badges: [...applicantUser.badges, "alliance"]
          });
        }

        showToast(`Você aceitou a parceria de ${req.applicantName}! Ele agora é um Colaborador.`, "success");
      } else {
        showToast("Solicitação de participação recusada.", "info");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `requests/${requestId}`);
    }
  };

  // --- Owner reviews alteration proposals ---
  const handleReviewAlteration = async (alterationId: string, status: "approved" | "rejected") => {
    const alt = alterations.find((a) => a.id === alterationId);
    if (!alt) return;

    try {
      await setDoc(doc(db, "alterations", alterationId), { ...alt, status });

      if (status === "approved") {
        const activeProjId = alt.projectId;
        const project = projects.find(p => p.id === activeProjId);
        if (project) {
          let nextComponents = [...project.components];
          if (alt.type === "new") {
            nextComponents.push(alt.proposedComponent);
          } else if (alt.type === "edit") {
            nextComponents = nextComponents.map((c) =>
              c.id === alt.componentId ? alt.proposedComponent : c
            );
          } else if (alt.type === "delete") {
            nextComponents = nextComponents.filter((c) => c.id !== alt.componentId);
          }

          await setDoc(doc(db, "projects", activeProjId), {
            ...project,
            components: nextComponents
          });
        }

        await awardUserXP(alt.authorId, 120, "Teve proposta de alteração aprovada e integrada!");
        showToast("Alteração aprovada com sucesso e integrada aos recursos ativos do projeto!", "success");
      } else {
        showToast("Proposta de alteração de componente rejeitada.", "info");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alterations/${alterationId}`);
    }
  };

  // --- Dono desfaz alterações (Master Undo Rollback) ---
  const handleUndoAlteration = async (alterationId: string) => {
    const alt = alterations.find((a) => a.id === alterationId);
    if (!alt) return;

    try {
      const project = projects.find(p => p.id === alt.projectId);
      if (project) {
        let nextComponents = [...project.components];
        if (alt.originalComponent) {
          nextComponents = nextComponents.map((c) =>
            c.id === alt.componentId ? alt.originalComponent! : c
          );
        } else {
          nextComponents = nextComponents.filter((c) => c.id !== alt.componentId);
        }

        await setDoc(doc(db, "projects", alt.projectId), {
          ...project,
          components: nextComponents
        });
      }

      await setDoc(doc(db, "alterations", alterationId), { ...alt, status: "undone" });
      showToast("Reversão Efetuada! O componente original foi restaurado historicamente.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alterations/${alterationId}`);
    }
  };

  // --- Applicant proposes to join ---
  const handleAddRequest = async (projectId: string, proposal: string) => {
    if (!currentUser) return;
    const reqId = "req_" + Date.now();
    const newReq: ParticipationRequest = {
      id: reqId,
      projectId,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantSpecialty: currentUser.specialty,
      applicantAvatar: currentUser.avatar,
      proposal,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "requests", reqId), newReq);
      showToast("Sua proposta estratégica foi enviada ao proprietário!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `requests/${reqId}`);
    }
  };

  // --- Add Component in details context ---
  const handleAddComponent = async (projectId: string, type: PostComponentType, title: string, content: string) => {
    if (!currentUser) return;
    const newComp: PostComponent = {
      id: "comp_" + Date.now(),
      type,
      title,
      content,
      notes: ""
    };

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const isOwner = currentUser.id === project.ownerId;
    const partMeta = project.participants.find((p) => p.userId === currentUser.id);
    const hasFreedom = isOwner || (partMeta?.hasFreedom ?? false);

    if (hasFreedom) {
      const updatedProj = {
        ...project,
        components: [...project.components, newComp]
      };
      try {
        await setDoc(doc(db, "projects", projectId), updatedProj);
        await awardUserXP(currentUser.id, 100, `Criou o componente: ${title}`);

        if (type === PostComponentType.Diagram && !currentUser.badges.includes("diagram_master")) {
          const updatedBadges = [...currentUser.badges, "diagram_master"];
          const updated = { ...currentUser, badges: updatedBadges };
          await setDoc(doc(db, "users", currentUser.id), updated);
          showToast("🏆 Medalha Desbloqueada: Arquiteto Visual!", "success");
        }

        showToast("Novo componente adicionado diretamente!", "success");
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
      }
    } else {
      const altId = "alt_" + Date.now();
      const newAlt: ProjectAlteration = {
        id: altId,
        projectId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        componentId: newComp.id,
        type: "new",
        proposedComponent: newComp,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, "alterations", altId), newAlt);
        showToast("Sua proposta de criação foi submetida e aguarda revisão do dono!", "info");
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `alterations/${altId}`);
      }
    }
  };

  // --- Edit existing component in details context ---
  const handleEditComponent = async (projectId: string, componentId: string, title: string, content: string) => {
    if (!currentUser) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const targetComp = project.components.find((c) => c.id === componentId);
    if (!targetComp) return;

    const proposed: PostComponent = {
      ...targetComp,
      title,
      content
    };

    const isOwner = currentUser.id === project.ownerId;
    const partMeta = project.participants.find((p) => p.userId === currentUser.id);
    const hasFreedom = isOwner || (partMeta?.hasFreedom ?? false);

    if (hasFreedom) {
      const updatedProj = {
        ...project,
        components: project.components.map((c) => (c.id === componentId ? proposed : c))
      };
      try {
        await setDoc(doc(db, "projects", projectId), updatedProj);
        showToast("Componente editado com sucesso!", "success");
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
      }
    } else {
      const altId = "alt_" + Date.now();
      const newAlt: ProjectAlteration = {
        id: altId,
        projectId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        componentId: componentId,
        type: "edit",
        originalComponent: targetComp,
        proposedComponent: proposed,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, "alterations", altId), newAlt);
        showToast("Sua edição foi registrada e aguarda aprovação do dono na aba de controle!", "info");
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `alterations/${altId}`);
      }
    }
  };

  // --- Update Maturity Level ---
  const handleUpdateMaturity = async (projectId: string, maturity: MaturityLevel) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      await setDoc(doc(db, "projects", projectId), { ...project, maturity });
      showToast(`Maturidade do projeto atualizada para: ${maturity}! Nova postagem espalhada na Linha do Tempo.`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="relative mb-5 select-none text-center">
          <img
            src={conectLabLogo}
            className="h-16 w-16 object-cover rounded-2xl border border-indigo-500/20 shadow-xl shadow-indigo-500/10"
            alt="Conect Lab logo"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -inset-1.5 border-2 border-indigo-500 border-t-transparent rounded-2xl animate-spin pointer-events-none" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-400 font-mono">Sincronizando com nuvem do Conect Lab...</p>
      </div>
    );
  }

  // Get active selected project
  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-indigo-500/25 text-white p-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-bounce shadow-indigo-600/10 max-w-sm">
          {notification.type === "xp" ? (
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              XP
            </div>
          ) : notification.type === "success" ? (
            <div className="h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </div>
          ) : (
            <div className="h-7 w-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              ℹ
            </div>
          )}
          <span className="text-xs font-semibold leading-snug">{notification.text}</span>
        </div>
      )}

      {!currentUser || !currentUser.userName ? (
        <AuthScreen onLogin={handleLogin} presetUsers={users} currentUserProfile={currentUser} />
      ) : (
        <>
          <header className="bg-slate-950 border-b border-indigo-950 text-white sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <img
                  src={conectLabLogo}
                  className="h-8.5 w-8.5 object-cover rounded-xl border border-indigo-500/20 shadow-sm"
                  alt="Conect Lab logo"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-sm font-black font-sans tracking-tight block text-white leading-none">Conect Lab</span>
                  <span className="text-[9px] font-mono text-indigo-400 block mt-0.5 uppercase tracking-widest font-bold">Colaboração de Especialistas</span>
                </div>
              </div>

              <nav className="flex items-center gap-1.5 md:gap-3 text-xs font-bold">
                <button
                  id="tab_timeline"
                  onClick={() => {
                    setSelectedProjectId(null);
                    setActiveTab("feed");
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${
                    activeTab === "feed" && !selectedProjectId
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span className="hidden sm:inline">Feed Geral</span>
                </button>

                <button
                  id="tab_profile"
                  onClick={() => {
                    setSelectedProjectId(null);
                    setViewedUserProfile(null); // Clear viewed user to see self
                    // Update URL to root or default to avoid staying on another user/url path
                    window.history.pushState(null, "", "/");
                    setActiveTab("profile");
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${
                    activeTab === "profile" && !viewedUserProfile
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Meu Perfil & Medalhas</span>
                </button>

                <button
                  id="btn_trigger_tutorial_manual"
                  onClick={() => setTutorialIsOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 transition flex items-center gap-1 cursor-pointer"
                  title="Acionar Tutorial Guiado"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Tutorial</span>
                </button>

                {selectedProjectId && activeProject && (
                  <span className="bg-slate-800 text-xs text-indigo-300 font-bold px-2.5 py-1.5 rounded-lg border border-indigo-500/10 truncate max-w-[120px] sm:max-w-[200px]">
                    📍 Ativo: {activeProject.title}
                  </span>
                )}
              </nav>

              <div className="flex items-center gap-3">
                <div
                  id="hud_profile_trigger"
                  onClick={() => {
                    setSelectedProjectId(null);
                    setViewedUserProfile(null); // Clear viewed user to see self
                    window.history.pushState(null, "", "/");
                    setActiveTab("profile");
                  }}
                  className="flex items-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 p-1.5 pr-3 rounded-xl border border-slate-800 text-left transition hidden md:flex"
                >
                  <img
                    src={currentUser.avatar}
                    className="w-7 h-7 rounded-lg object-cover"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-[10px] font-bold text-white truncate leading-none">{(currentUser?.name || "Usuário").toString().split(" ")[0]}</h4>
                    <p className="text-[9px] text-emerald-400 font-mono tracking-tight font-bold mt-1 text-left">Level {currentUser.level} ({currentUser.xp} XP)</p>
                  </div>
                </div>

                <button
                  id="btn_logout_header"
                  onClick={handleLogout}
                  className="p-1.5 md:p-2 bg-slate-900 border border-slate-800 hover:bg-rose-950/40 hover:border-rose-900/30 text-slate-400 hover:text-rose-450 rounded-xl transition cursor-pointer"
                  title="Sair do Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <ActorSelector
            currentUser={currentUser}
            usersList={users}
            onSelectUser={handleSwitchActor}
          />

          <main className="flex-1 py-6">
            {selectedProjectId && activeProject ? (
              <ProjectDetails
                project={activeProject}
                currentUser={currentUser}
                comments={comments}
                requests={requests}
                alterations={alterations}
                onBack={() => setSelectedProjectId(null)}
                onAddComment={handleAddComment}
                onAddObservation={handleAddObservation}
                onToggleFreedom={handleToggleFreedom}
                onReviewRequest={handleReviewRequest}
                onReviewAlteration={handleReviewAlteration}
                onUndoAlteration={handleUndoAlteration}
                onAddRequest={handleAddRequest}
                onAddComponent={handleAddComponent}
                onEditComponent={handleEditComponent}
                onUpdateMaturity={handleUpdateMaturity}
              />
            ) : activeTab === "profile" ? (
              <ProfilePage
                user={viewedUserProfile || currentUser}
                projects={projects}
                badges={GLOBAL_BADGES}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUserProfile}
              />
            ) : (
              <Timeline
                projects={projects}
                currentUser={currentUser}
                usersList={users}
                smokeFeedbacks={feedbacks}
                comments={comments}
                onSelectProject={(id) => {
                  setSelectedProjectId(id);
                  setActiveTab("details");
                }}
                onFollowUser={handleFollowUser}
                onUnfollowUser={handleUnfollowUser}
                onLikeProject={handleLikeProject}
                onAddSmokeFeedback={handleAddSmokeFeedback}
                onAddProject={handleAddProject}
                onViewUserProfile={handleViewUserProfile}
              />
            )}
          </main>

          <footer className="bg-slate-900 py-6 border-t border-slate-800 mt-auto text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="font-extrabold text-white block">Conect Lab</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Foco em Parcerias Estratégicas & Desenvolvimento Rápido de Soluções</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                ★ Versão 1.2.0 • Banco de Dados Real-Time Sincronizado
              </div>
            </div>
          </footer>

          {/* Welcome & Launch Tutorial Modal */}
          {showWelcomeModal && (
            <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs cursor-default"
                onClick={() => setShowWelcomeModal(false)}
              />
              
              <div className="relative bg-white rounded-3xl border border-indigo-100 shadow-2xl p-6 md:p-8 max-w-lg w-full z-10 animate-in fade-in zoom-in-95 duration-200 text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-3.5 rounded-2xl border-4 border-white shadow-xl inline-block mx-auto -mt-12 mb-4">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
                
                <div className="space-y-4">
                  <span className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">
                    Sincronização Iniciada ★ Conect Lab
                  </span>
                  
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    Seja muito bem-vindo ao portal, {currentUser?.name}! 🎉
                  </h2>
                  
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-mono font-medium">
                    <span>ID Único:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-bold">{currentUser?.userName}</span>
                  </div>
                  
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    Estamos muito felizes em ter você no nosso Hub de Engenharia e Colaboração Técnica. 
                    Prepare-se para cocriar, explorar protótipos em tempo real e decolar suas parcerias estratégicas na nuvem!
                  </p>
                  
                  <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100/40 p-4 text-left space-y-2">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-700 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                      Próximo passo: Tutorial interativo
                    </p>
                    <p className="text-xs text-slate-500 leading-normal">
                      Preparamos um tour guiado automático para te mostrar como pesquisar teses, criar módulos funcionais e dar feedbacks de avaliação ágil.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      id="btn_skip_welcome"
                      onClick={() => setShowWelcomeModal(false)}
                      className="flex-1 py-1.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Pular Tour
                    </button>
                    <button
                      id="btn_start_tutorial_welcome"
                      onClick={() => {
                        setShowWelcomeModal(false);
                        setTutorialIsOpen(true);
                      }}
                      className="flex-1 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Iniciar Tutorial Guiado 🚀
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guided Tutorial Overlay */}
          <GuidedTutorial
            isOpen={tutorialIsOpen}
            onClose={() => setTutorialIsOpen(false)}
            onComplete={handleCompleteTutorial}
            projects={projects}
            activeTab={activeTab}
            selectedProjectId={selectedProjectId}
            setActiveTab={setActiveTab}
            setSelectedProjectId={setSelectedProjectId}
          />
        </>
      )}
    </div>
  );
}
