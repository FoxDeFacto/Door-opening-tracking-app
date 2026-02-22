import { DoorClosed, DoorOpen } from "lucide-react";

export const DOOR_STATES = {
  1: { label: "Zavřený -> Zavřený", doorOpen: false, icon: DoorClosed },
  2: { label: "Zavřený -> Otevřený", doorOpen: true , icon: DoorOpen },
  3: { label: "Otevřený -> Zavřený", doorOpen: false, icon: DoorClosed},
  4: { label: "Otevřený -> Otevřený", doorOpen: true, icon: DoorOpen },
} as const;