import React from "react";
import StickyHeader from "@/components/layout/StickyHeader";
import { DuaBoard } from "@/components/DuaBoard";

export default function DualarPage({ onMenuOpen, onNotifications }: { onMenuOpen: () => void, onNotifications: () => void }) {
  return (
    <div className="pb-24">
      <StickyHeader onLeftClick={onMenuOpen} onRightClick={onNotifications} />
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <DuaBoard />
      </div>
    </div>
  );
}
