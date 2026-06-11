import React, { useState } from "react";
import { UserProfile } from "../types";
import { Lock, Mail, User, Briefcase, Code, Shield, Sparkles, AlertTriangle, ExternalLink, HelpCircle, Globe, Building, Compass, Goal, Plus, Trash2, Image } from "lucide-react";
import { auth, signInWithPopup, googleProvider, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const conectLabLogo = "/src/assets/images/conect_lab_icon_1781198769916.jpg";

const generateUniqueIdOptions = (
  userTypedName: string,
  currentUserObj: any,
  userSpecialty: string,
  existingUsers: UserProfile[]
): string[] => {
  const optionsSet = new Set<string>();

  const cleanExpression = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9_]/g, "");    // strip non-alphanumeric/underscore
  };

  const bases: string[] = [];

  // 1. Base from typed name
  if (userTypedName && userTypedName.trim()) {
    const cleanName = cleanExpression(userTypedName);
    if (cleanName) bases.push(cleanName);

    const parts = (userTypedName || "").toString().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const cleanFirstLast = cleanExpression(parts[0] + "_" + parts[parts.length - 1]);
      if (cleanFirstLast) bases.push(cleanFirstLast);
    }
  }

  // 2. Base from auth currentUser object display name
  if (currentUserObj && currentUserObj.displayName) {
    const cleanDisplay = cleanExpression(currentUserObj.displayName);
    if (cleanDisplay) bases.push(cleanDisplay);

    const parts = (currentUserObj?.displayName || "").toString().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const cleanFirstLast = cleanExpression(parts[0] + "_" + parts[parts.length - 1]);
      if (cleanFirstLast) bases.push(cleanFirstLast);
    }
  }

  if (bases.length === 0) {
    bases.push("especialista");
  }

  const uniqueBases = Array.from(new Set(bases));
  
  // Set of all existing lower-case userNames
  const existingLowerNames = new Set(
    (existingUsers || []).map(u => u.userName?.toLowerCase().replace(/^@/, "")).filter(Boolean) as string[]
  );

  // Specialties keyword extraction to satisfy combining with other user details if a collision occurs
  const specWords: string[] = [];
  if (userSpecialty) {
    const cleanSpec = userSpecialty.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_\s]/g, "");
    const parts = (cleanSpec || "").toString().split(/\s+/).filter(w => w.length > 2 && w !== "and" && w !== "dos" && w !== "das" && w !== "para");
    if (parts.length > 0) {
      specWords.push(parts[0]);
      if (parts[1]) specWords.push(parts[1]);
    }
  }

  const suffixes = [...specWords, "lab", "dev", "tech", "eng", "hub", "pro"];

  for (const b of uniqueBases) {
    // 1. Direct base (e.g. @claradias)
    if (!existingLowerNames.has(b)) {
      optionsSet.add(`@${b}`);
    }

    // 2. Base with suffixes
    for (const suffix of suffixes) {
      const cand = `${b}_${suffix}`;
      if (!existingLowerNames.has(cand)) {
        optionsSet.add(`@${cand}`);
      }
    }

    // 3. Base with some digits
    for (const d of ["2026", "26", "77", "99"]) {
      const cand = `${b}_${d}`;
      if (!existingLowerNames.has(cand)) {
        optionsSet.add(`@${cand}`);
      }
    }
  }

  // Generates safe fallback candidate lines if still small list
  let counter = 1;
  while (optionsSet.size < 5 && counter < 100) {
    const baseWord = uniqueBases[0] || "especialista";
    const randSuffix = Math.floor(10 + Math.random() * 899);
    const cand = `${baseWord}_${randSuffix}`;
    if (!existingLowerNames.has(cand)) {
      optionsSet.add(`@${cand}`);
    }
    counter++;
  }

  return Array.from(optionsSet).slice(0, 4);
};

interface AuthScreenProps {
  onLogin: (user: UserProfile, isNewRegistration?: boolean) => void;
  presetUsers?: UserProfile[]; // main context passes users, can be empty
  currentUserProfile?: UserProfile | null;
}

export default function AuthScreen({ onLogin, presetUsers, currentUserProfile }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [specialty, setSpecialty] = useState("Cocriador e Especialista");
  const [bio, setBio] = useState("Especialista comprometido com a execução de ideias inovadoras na nuvem.");
  const [skillsText, setSkillsText] = useState("Inovação, Planejamento, Colaboração");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  
  // New personal and professional optional parameters
  const [website, setWebsite] = useState("");
  const [companiesText, setCompaniesText] = useState("");
  const [careerVision, setCareerVision] = useState("");
  const [professionalObjective, setProfessionalObjective] = useState("");
  
  // Local portfolio items list
  const [portfolio, setPortfolio] = useState<{ id: string; url: string; title: string; description?: string }[]>([]);
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  // Tabbed/Guided steps indicator state (Passos 1, 2, 3)
  const [regStep, setRegStep] = useState(1);

  // Dynamically compute a clean username suggestion based on login properties
  const suggestedPlaceholder = React.useMemo(() => {
    if (name) {
      const clean = name.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "");
      if (clean) return clean;
    }
    if (auth.currentUser?.displayName) {
      const clean = auth.currentUser.displayName.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "");
      if (clean) return clean;
    }
    return "usuario";
  }, [name, auth.currentUser]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestedOptions = React.useMemo(() => {
    return generateUniqueIdOptions(name, auth.currentUser, specialty, presetUsers || []);
  }, [name, auth.currentUser, specialty, presetUsers]);

  const dropdownSuggestions = React.useMemo(() => {
    const cleanTyped = userName.trim().toLowerCase();
    if (!cleanTyped || cleanTyped === "@") {
      return suggestedOptions.map(opt => ({
        id: opt,
        isCustom: false,
        isValid: true,
        message: "Sugerido"
      }));
    }

    const formattedTyped = cleanTyped.startsWith("@") ? cleanTyped : `@${cleanTyped}`;
    
    const validRegex = /^@[a-z0-9_]+$/;
    const isValidFormat = validRegex.test(formattedTyped);
    
    const uid = auth.currentUser?.uid;
    const isTaken = (presetUsers || []).some(
      (u) => u.id !== uid && u.userName?.toLowerCase() === formattedTyped
    );

    const isUnique = !isTaken && isValidFormat;

    const cleanBase = formattedTyped.replace(/^@/, "");
    const generated: string[] = [];
    if (cleanBase && isValidFormat) {
      const suffixes = ["lab", "dev", "tech", "eng", "hub", "pro"];
      const existingLowerNames = new Set(
        (presetUsers || []).map(u => u.userName?.toLowerCase().replace(/^@/, "")).filter(Boolean) as string[]
      );

      for (const suffix of suffixes) {
        const cand = `${cleanBase}_${suffix}`;
        if (!existingLowerNames.has(cand) && cand !== cleanBase) {
          generated.push(`@${cand}`);
        }
      }
    }

    const list: { id: string; isCustom: boolean; isValid: boolean; message: string }[] = [
      {
        id: formattedTyped,
        isCustom: true,
        isValid: isUnique,
        message: isUnique ? "Disponível (Seu ID)" : (isTaken ? "Já em uso" : "Formato inválido")
      }
    ];

    generated.slice(0, 3).forEach(opt => {
      list.push({
        id: opt,
        isCustom: false,
        isValid: true,
        message: "Disponível"
      });
    });

    for (const opt of suggestedOptions) {
      if (list.length >= 5) break;
      if (!list.some(item => item.id === opt) && opt !== formattedTyped) {
        list.push({
          id: opt,
          isCustom: false,
          isValid: true,
          message: "Sugerido"
        });
      }
    }

    return list;
  }, [userName, suggestedOptions, presetUsers, auth.currentUser]);

  // Maximize pre-population: automatically fill username once validated suggestions are calculated
  React.useEffect(() => {
    if ((!userName || userName === "" || userName === "@" || userName === "@usuario") && suggestedOptions.length > 0) {
      setUserName(suggestedOptions[0]);
    }
  }, [suggestedOptions]);

  // If a user has authenticated using Google or E-mail but has no Firestore profile node or misses username,
  // we must automatically trigger registration state to gather or complement their profile parameters:
  React.useEffect(() => {
    if (currentUserProfile) {
      setIsRegistering(true);
      if (currentUserProfile.email) setEmail(currentUserProfile.email);
      if (currentUserProfile.name) setName(currentUserProfile.name);
      if (currentUserProfile.userName) setUserName(currentUserProfile.userName);
      if (currentUserProfile.avatar) setAvatar(currentUserProfile.avatar);
      if (currentUserProfile.specialty) setSpecialty(currentUserProfile.specialty);
      if (currentUserProfile.bio) setBio(currentUserProfile.bio);
      if (currentUserProfile.skills) setSkillsText(currentUserProfile.skills.join(", "));
      if (currentUserProfile.linkedin) setLinkedin(currentUserProfile.linkedin);
      if (currentUserProfile.github) setGithub(currentUserProfile.github);
      if (currentUserProfile.website) setWebsite(currentUserProfile.website);
      if (currentUserProfile.companiesText) setCompaniesText(currentUserProfile.companiesText);
      if (currentUserProfile.careerVision) setCareerVision(currentUserProfile.careerVision);
      if (currentUserProfile.professionalObjective) setProfessionalObjective(currentUserProfile.professionalObjective);
      if (currentUserProfile.portfolio) setPortfolio(currentUserProfile.portfolio);
    } else if (auth.currentUser) {
      setIsRegistering(true);
      if (!email && auth.currentUser.email) setEmail(auth.currentUser.email);
      if (!name && auth.currentUser.displayName) setName(auth.currentUser.displayName);
      if (!avatar && auth.currentUser.photoURL) setAvatar(auth.currentUser.photoURL);
    }
  }, [auth.currentUser, currentUserProfile]);

  // Pre-populate username when name changes
  React.useEffect(() => {
    if (!userName || userName === "" || userName === "@" || userName === "@usuario") {
      if (name) {
        const clean = name.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const cleanAlpha = clean.replace(/[^a-z0-9_]/g, "");
        if (cleanAlpha) {
          setUserName(`@${cleanAlpha}`);
        }
      }
    }
  }, [name]);

  const handleInstantDemoRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const randId = Math.floor(100000 + Math.random() * 900000);
      const demoEmail = `especialista.${randId}@conectlab.com`;
      const demoPassword = `demoPassword${randId}`;
      const demoName = `Especialista ${randId}`;
      const specialties = [
        "Sistemas Distribuídos & Nuvem",
        "Designer de Interface (UX/UI)",
        "Engenheiro de Analytics & IA",
        "Gestor de Projetos e Metodologia Ágil",
        "Especialista em Sustentabilidade e ESG",
        "Desenvolvedor Mobile Cross-Platform"
      ];
      const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)];
      
      const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
      const uid = userCredential.user.uid;

      const customUser: UserProfile = {
        id: uid,
        name: demoName,
        email: demoEmail,
        specialty: randomSpecialty,
        avatar: `https://images.unsplash.com/photo-${1535713875002 + (randId % 1000)}?auto=format&fit=crop&q=80&w=150`,
        bio: "Perfil demonstrativo e interativo de colaboração criado em tempo real.",
        skills: ["Trabalho Remoto", "Estratégia", "Desenvolvimento", "Metodologias Ágeis"],
        linkedin: "",
        github: "",
        xp: 155,
        level: 1,
        badges: ["first_project"],
        followingUsers: [],
        contributions: []
      };

      await setDoc(doc(db, "users", uid), customUser);
      onLogin(customUser);
    } catch (err: any) {
      console.error("Erro no cadastro de teste de 1-Clique:", err);
      setError(`Erro no cadastro de teste: ${err.message || err.code || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        onLogin(userDoc.data() as UserProfile);
      } else {
        // Auth exists but no profile document. Switch to register mode
        setName(userCredential.user.displayName || (email || "").toString().split("@")[0]);
        setEmail(userCredential.user.email || email);
        setIsRegistering(true);
      }
    } catch (err: any) {
      console.error("Erro no login por e-mail:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("Erro: O login por E-mail/Senha está desativado no Firebase Console. Por favor, acesse o console do seu projeto Firebase, vá em 'Authentication' > 'Sign-in method' e ative o provedor de E-mail/Senha.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("E-mail ou senha incorretos. Verifique suas credenciais ou faça o cadastro caso seja novo.");
      } else if (err.code === "auth/invalid-email") {
        setError("O formato do e-mail inserido é inválido.");
      } else if (err.code === "auth/user-disabled") {
        setError("Este usuário foi desativado pelo administrador.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas malsucedidas de login. Tente novamente mais tarde.");
      } else {
        setError(`Erro na requisição de login: ${err.message || err.code || err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const uid = userCredential.user.uid;
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        onLogin(userDoc.data() as UserProfile);
      } else {
        // Transition to profile setup
        setName(userCredential.user.displayName || "");
        setEmail(userCredential.user.email || "");
        setAvatar(userCredential.user.photoURL || "");
        setIsRegistering(true);
      }
    } catch (err: any) {
      console.error("Erro no login por Google:", err);
      if (err.code === "auth/popup-blocked") {
        setError("O pop-up de login do Google foi bloqueado pelo navegador. Por favor, permita pop-ups para este site ou abra o app em uma nova aba fora do iframe.");
      } else if (err.code === "auth/unauthorized-domain") {
        setUnauthorizedDomain(window.location.hostname);
        setError("unauthorized-domain");
      } else {
        setError(`Erro ao autenticar com o Google: ${err.message || err.code || err}. Se estiver dentro de um iframe, abra o site em uma nova aba.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    setError("");
    let cleanUsername = userName.trim().toLowerCase();
    if (!cleanUsername) {
      setError("Por favor, insira o seu ID Único.");
      return false;
    }
    if (!cleanUsername.startsWith("@")) {
      cleanUsername = "@" + cleanUsername;
    }
    if (cleanUsername.includes(" ")) {
      setError("O ID Único não pode conter espaços.");
      return false;
    }
    const validRegex = /^@[a-z0-9_]+$/;
    if (!validRegex.test(cleanUsername)) {
      setError(`O ID Único deve conter apenas @, letras minúsculas (a-z), números e underscores (ex: @${suggestedPlaceholder}).`);
      return false;
    }
    const uid = auth.currentUser?.uid;
    const isTaken = (presetUsers || []).some(
      (u) => u.id !== uid && u.userName?.toLowerCase() === cleanUsername
    );
    if (isTaken) {
      setError(`O ID Único ${cleanUsername} já está sendo utilizado por outro especialista.`);
      return false;
    }
    if (!name.trim()) {
      setError("Por favor, preencha o seu Nome Completo.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, insira um e-mail corporativo válido.");
      return false;
    }
    if (!auth.currentUser && (!password || password.length < 6)) {
      setError("Uma senha de no mínimo 6 caracteres é necessária para registrar.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setError("");
    if (!specialty.trim()) {
      setError("Por favor, preencha a sua Especialidade Principal.");
      return false;
    }
    if (!bio.trim()) {
      setError("Por favor, escreva uma breve biografia ou foco de parcerias.");
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setRegStep(1);
      return;
    }
    if (!validateStep2()) {
      setRegStep(2);
      return;
    }

    let cleanUsername = userName.trim().toLowerCase();
    if (!cleanUsername.startsWith("@")) {
      cleanUsername = "@" + cleanUsername;
    }

    setError("");
    setLoading(true);
    try {
      let uid = auth.currentUser?.uid;

      if (!uid) {
        if (!password || password.length < 6) {
          setError("Uma senha de no mínimo 6 caracteres é necessária para registrar.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      }

      const parsedSkills = typeof skillsText === "string"
        ? skillsText.split(",").map(s => s.trim()).filter(Boolean)
        : ["Colaboração", "Especialista"];

      const customUser: UserProfile = {
        id: uid,
        name,
        email,
        userName: cleanUsername,
        specialty,
        avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`,
        bio: bio || "Disponível para colaborar e tirar projetos do papel.",
        skills: parsedSkills,
        linkedin: linkedin || "",
        github: github || "",
        website: website || "",
        companiesText: companiesText || "",
        careerVision: careerVision || "",
        professionalObjective: professionalObjective || "",
        portfolio: portfolio || [],
        xp: currentUserProfile?.xp !== undefined ? currentUserProfile.xp : 120,
        level: currentUserProfile?.level !== undefined ? currentUserProfile.level : 1,
        badges: currentUserProfile?.badges || ["first_project"],
        followingUsers: currentUserProfile?.followingUsers || [],
        contributions: currentUserProfile?.contributions || []
      };

      await setDoc(doc(db, "users", uid), customUser);
      onLogin(customUser, true);
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este endereço de e-mail já está sendo utilizado por outra conta.");
      } else if (err.code === "auth/invalid-email") {
        setError("O endereço de e-mail inserido é inválido.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha é muito fraca. Escolha uma senha com pelo menos 6 caracteres.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Erro: O cadastro/login por E-mail e Senha está desativado no console do Firebase. Ative 'Email/Password' em seu projeto Firebase (Authentication > Sign-in method).");
      } else {
        setError(err.message || "Erro de cadastro no Firebase.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegister = async () => {
    setIsRegistering(false);
    setError("");
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in">
        <div className="mx-auto flex items-center justify-center mb-4 select-none">
          <img
            src={conectLabLogo}
            className="h-16 w-16 object-cover rounded-2xl border border-indigo-100 shadow-xl"
            alt="Conect Lab logo"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 id="auth_main_title" className="text-3xl font-bold font-sans tracking-tight text-slate-900">
          Conect Lab
        </h2>
        <p className="mt-2 text-sm text-slate-600 font-sans">
          Rede de Execução Colaborativa de Ideias em Nuvem (Real-Time)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10">
          
          {error && (
            error === "unauthorized-domain" && unauthorizedDomain ? (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 leading-relaxed shadow-sm">
                <div className="flex items-start gap-2.5 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 font-sans">
                      🔒 Domínio Não Autorizado no Firebase
                    </h4>
                    <p className="text-[11px] text-amber-800 font-medium mt-1">
                      O login pelo Google falhou porque este domínio ainda não está listado como confiável no console do seu projeto Firebase.
                    </p>
                  </div>
                </div>

                <div className="mt-3 bg-white/85 border border-amber-200/60 p-3 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Domínio Atual do App (Copie este valor):</span>
                  <div className="flex items-center justify-between gap-2 mt-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg select-all">
                    <code className="text-xs font-bold text-indigo-700 font-mono break-all">{unauthorizedDomain}</code>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-[11px] text-slate-700 font-sans">
                  <p className="font-bold text-slate-800">Para corrigir nas configurações do Firebase:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-650 pl-1">
                    <li>Copie o domínio acima.</li>
                    <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5">Console do Firebase <ExternalLink className="w-3 h-3" /></a>.</li>
                    <li>Selecione o seu projeto: <span className="font-bold text-slate-800 font-mono">assistantcreator-79401</span>.</li>
                    <li>No menu esquerdo, vá em <span className="font-extrabold text-slate-800">Authentication</span> e clique na aba <span className="font-extrabold text-slate-800">Settings</span>.</li>
                    <li>Em <span className="font-extrabold text-slate-800 font-sans">Authorized domains</span> (Domínios autorizados), clique em <span className="font-extrabold text-slate-800">Add domain</span>.</li>
                    <li>Cole o domínio copiado e clique em <span className="font-extrabold text-slate-800">Add</span>.</li>
                  </ol>
                </div>

                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[10.5px] text-indigo-850 leading-relaxed font-sans">
                      <span className="font-bold">💡 Resolução Rápida (Teste de 1-Clique):</span> Crie e autentique uma conta de especialista no Firebase em tempo real por e-mail automaticamente, sem precisar autorizar domínios ou configurar nada!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstantDemoRegister}
                    disabled={loading}
                    className="w-full mt-2.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-sans shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Criar & Entrar com Conta de Teste</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold leading-relaxed">
                {error}
              </div>
            )
          )}

          {loading && (
            <div className="mb-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-705 font-mono text-center animate-pulse">
              Processando conexão com nuvem segura...
            </div>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-mono">Painel de Acesso Seguro</span>
            </div>
          </div>

          {!isRegistering ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Endereço de E-mail</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    id="login_email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@collabsphere.com"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Senha</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    id="login_password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  id="btn_submit_login"
                  className="flex-1 py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer text-center"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  id="btn_google_login"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="py-1.5 px-4 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22l.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </button>
              </div>

              <div className="text-center mt-3">
                <button
                  type="button"
                  id="btn_go_register"
                  onClick={() => setIsRegistering(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  Não tem conta? Faça cadastro rápido pessoal e profissional
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Stepper progress tracker with percentage */}
              <div className="mb-6 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 font-mono mb-1.5 px-0.5">
                  <span className="text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    CONECT LAB • CADASTRO
                  </span>
                  <span>Passo {regStep} de 3 ({Math.round((regStep / 3) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 via-purple-550 to-indigo-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(regStep / 3) * 100}%` }}
                  />
                </div>
                
                {/* Visual tabs with validation-guards */}
                <div className="grid grid-cols-3 gap-2 mt-3.5">
                  {[
                    { step: 1, label: "1. Identidade" },
                    { step: 2, label: "2. Profissão" },
                    { step: 3, label: "3. Conexões" }
                  ].map((item) => {
                    const isPassed = regStep >= item.step;
                    const isCurrent = regStep === item.step;
                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => {
                          if (item.step === 1) {
                            setRegStep(1);
                          } else if (item.step === 2) {
                            if (validateStep1()) setRegStep(2);
                          } else if (item.step === 3) {
                            if (validateStep1() && validateStep2()) setRegStep(3);
                          }
                        }}
                        className={`py-1.5 px-1 text-[10px] font-bold rounded-xl border transition-all text-center uppercase tracking-wider ${
                          isCurrent
                            ? "bg-indigo-650 text-white border-indigo-650 shadow-md shadow-indigo-650/10"
                            : isPassed
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100 font-bold"
                            : "bg-slate-50 text-slate-400 border-slate-150 cursor-not-allowed"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 1: IDENTIDADE & DADOS BÁSICOS */}
              {regStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-150/50">
                    <p className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1 leading-tight">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      Defina seu ID Único e confirme seus dados primários.
                    </p>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold text-indigo-700 flex items-center gap-1">
                      <span>ID Único (@usuario)</span>
                      <span className="text-[10px] text-slate-400 font-normal font-sans">(apenas letras minúsculas, números e underscore)</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-500 font-bold font-mono text-xs">
                        @
                      </div>
                      <input
                        type="text"
                        required
                        value={userName.startsWith("@") ? userName.slice(1) : userName}
                        id="reg_username"
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                        onChange={(e) => {
                          const typed = e.target.value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "");
                          setUserName(`@${typed}`);
                        }}
                        placeholder={suggestedPlaceholder}
                        className="block w-full pl-8 pr-3 py-2 border border-indigo-200 bg-indigo-50/10 focus:bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 font-mono font-bold"
                      />
                    </div>

                    {showSuggestions && dropdownSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-indigo-100 rounded-2xl shadow-xl p-3 space-y-1.5 animate-fade-in max-h-56 overflow-y-auto">
                        <p className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-wider px-1">
                          💡 Validador & Sugestões de ID
                        </p>
                        <p className="text-[9px] text-slate-400 leading-tight px-1 pb-1">
                          A primeira opção mostra a validade do ID digitado. As demais são sugestões livres. Clique para selecionar:
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {dropdownSuggestions.map((item) => {
                            const isUnique = item.isValid;
                            let badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                            if (item.message === "Já em uso" || item.message === "Formato inválido") {
                              badgeStyle = "bg-rose-50 text-rose-600 border-rose-100";
                            } else if (item.message === "Sugerido") {
                              badgeStyle = "bg-indigo-50 text-indigo-600 border-indigo-100";
                            }
                            return (
                              <button
                                key={item.id}
                                type="button"
                                disabled={item.isCustom && !isUnique}
                                onMouseDown={() => {
                                  if (!item.isCustom || isUnique) {
                                    setUserName(item.id);
                                    setShowSuggestions(false);
                                  }
                                }}
                                className={`w-full text-left p-2 text-xs font-mono font-medium rounded-xl border border-transparent transition flex items-center justify-between ${
                                  item.isCustom 
                                    ? "bg-slate-50 border-slate-200 text-slate-800" 
                                    : "hover:bg-indigo-50 text-slate-700 hover:text-indigo-850 hover:border-indigo-100 cursor-pointer"
                                }`}
                              >
                                <span className={item.isCustom ? "font-bold text-indigo-950" : ""}>{item.id}</span>
                                <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full border uppercase ${badgeStyle}`}>
                                  {item.message}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 mt-1">
                      Link permanente: <span className="text-slate-600 font-mono font-semibold">{window.location.origin}/@{userName.replace(/^@/, "") || "usuario"}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Nome Completo</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        id="reg_name"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Clara Dias"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">E-mail Corporativo</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={!auth.currentUser}
                        value={email}
                        id="reg_email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {!auth.currentUser && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Senha de Acesso</label>
                      <input
                        type="password"
                        required
                        value={password}
                        id="reg_password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="No mínimo 6 caracteres"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep1()) setRegStep(2);
                      }}
                      className="flex-1 py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-650/10 active:scale-[0.98] transition cursor-pointer text-center"
                    >
                      Continuar (Passo 2)
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRegister}
                      className="py-1.5 px-4 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                    >
                      Voltar ao Login
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ATUAÇÃO PROFISSIONAL */}
              {regStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-150/50">
                    <p className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1 leading-tight">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      Especifique sua atuação. Estes dados foram pré-preenchidos para sua conveniência.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Sua Especialidade Principal</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={specialty}
                        id="reg_specialty"
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ex: Designer de Transição Energética / Dev Rust Core"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Bio & Foco de Parcerias</label>
                    <div className="mt-1 relative rounded-md">
                      <textarea
                        required
                        value={bio}
                        id="reg_bio"
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        placeholder="Descreva seu foco acadêmico ou corporativo..."
                        className="block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Skills / Competências (separadas por vírgulas) <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Code className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={skillsText}
                        id="reg_skills"
                        onChange={(e) => setSkillsText(e.target.value)}
                        placeholder="Ex: React, CAD, Redação Técnica, ESG"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep2()) setRegStep(3);
                      }}
                      className="flex-1 py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-650/10 active:scale-[0.98] transition cursor-pointer text-center"
                    >
                      Continuar (Passo 3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="py-1.5 px-4 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONEXÕES, MÍDIA E PORTFÓLIO */}
              {regStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-150/50">
                    <p className="text-[11px] text-indigo-700 font-semibold leading-tight">
                      ✨ Conexões Adicionais (Tudo Opcional): Complete seu portfólio para receber convites estratégicos!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">LinkedIn Link <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input
                        type="text"
                        value={linkedin}
                        id="reg_linkedin"
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="linkedin.com/in/usuario"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">GitHub Link <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input
                        type="text"
                        value={github}
                        id="reg_github"
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="github.com/usuario"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-indigo-550 shrink-0" /> Website / Portfólio Geral <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://meusite.com"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-indigo-550 shrink-0" /> Empresas anteriores e atuais <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={companiesText}
                        onChange={(e) => setCompaniesText(e.target.value)}
                        placeholder="Ex: Google, Siemens, Embraer, Freelancer"
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">Visão de Carreira <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <textarea
                        value={careerVision}
                        onChange={(e) => setCareerVision(e.target.value)}
                        rows={2}
                        placeholder="Sua visão de onde quer chegar nos próximos anos..."
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">Objetivo Profissional <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <textarea
                        value={professionalObjective}
                        onChange={(e) => setProfessionalObjective(e.target.value)}
                        rows={2}
                        placeholder="Seu objetivo de carreira..."
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">URL da Foto de Perfil <span className="text-slate-400 font-normal">(Opcional)</span></label>
                      <input
                        type="text"
                        value={avatar}
                        id="reg_avatar"
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Portfolio Section */}
                  <div className="border-t border-slate-150 pt-3 mt-3">
                    <label className="block text-xs font-bold text-indigo-755 flex items-center gap-1">
                      <Image className="w-4 h-4 text-indigo-600 shrink-0" /> Galeria / Fotos de Trabalhos do Portfólio <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                      Adicione links de imagens de mockups, protótipos ou projetos de inovação.
                    </p>

                    {/* Existing items */}
                    {portfolio.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {portfolio.map((item, idx) => (
                          <div key={item.id || idx} className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 group p-2 flex flex-col justify-between">
                            <img src={item.url} alt={item.title} className="w-full h-20 object-cover rounded-lg" referrerPolicy="no-referrer" />
                            <div className="mt-1.5 min-w-0">
                              <h5 className="text-[10px] font-bold text-slate-700 truncate">{item.title}</h5>
                              {item.description && <p className="text-[9px] text-slate-400 line-clamp-1">{item.description}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => setPortfolio(portfolio.filter(p => p.id !== item.id))}
                              className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New local item adder */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/55 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Título do Trabalho (Ex: App Conect Lab) (Opcional)"
                          value={newPortfolioTitle}
                          onChange={(e) => setNewPortfolioTitle(e.target.value)}
                          className="block w-full px-2 py-1 border border-slate-250 bg-white rounded-lg text-[10px] focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Link da Imagem (Ex: https://...) (Opcional)"
                          value={newPortfolioUrl}
                          onChange={(e) => setNewPortfolioUrl(e.target.value)}
                          className="block w-full px-2 py-1 border border-slate-250 bg-white rounded-lg text-[10px] focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Descrição Curta (Opcional)"
                        value={newPortfolioDesc}
                        onChange={(e) => setNewPortfolioDesc(e.target.value)}
                        className="block w-full px-2 py-1 border border-slate-250 bg-white rounded-lg text-[10px] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPortfolioUrl || !newPortfolioTitle) {
                            alert("Informe ao menos o Título e o Link da foto para adicionar ao portfólio.");
                            return;
                          }
                          const item = {
                            id: `port_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                            url: newPortfolioUrl,
                            title: newPortfolioTitle,
                            description: newPortfolioDesc
                          };
                          setPortfolio([...portfolio, item]);
                          setNewPortfolioUrl("");
                          setNewPortfolioTitle("");
                          setNewPortfolioDesc("");
                        }}
                        className="w-full py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer hover:bg-indigo-100"
                      >
                        <Plus className="w-3 h-3" /> Adicionar Trabalho ao Perfil (Opcional)
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="submit"
                      id="btn_submit_register"
                      disabled={loading}
                      className="flex-1 py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-650/10 active:scale-[0.98] transition cursor-pointer text-center"
                    >
                      {loading ? "Registrando Especialista..." : "Concluir Cadastro & Conectar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="py-1.5 px-4 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-[11px] text-slate-400 font-mono">
              ★ Conect Lab | Cocriação e Execução Estratégica
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
