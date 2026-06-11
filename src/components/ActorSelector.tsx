import React from "react";
import { UserProfile } from "../types";
import { Sparkles } from "lucide-react";

interface ActorSelectorProps {
  currentUser: UserProfile;
  usersList: UserProfile[];
  onSelectUser: (userId: string) => void;
}

export default function ActorSelector({ currentUser, usersList, onSelectUser }: ActorSelectorProps) {
  // Simulator panel has been completely removed
  return null;
}
