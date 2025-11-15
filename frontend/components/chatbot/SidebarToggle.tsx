"use client";

import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarToggle({
  isOpen,
  onToggle,
}: SidebarToggleProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <Button
        onClick={onToggle}
        variant="ghost"
        size="sm"
        className="bg-zinc-900/80 cursor-pointer backdrop-blur-sm border border-zinc-800 hover:bg-zinc-800 text-gray-400 hover:text-white h-9 w-9 p-0"
      >
        {isOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
