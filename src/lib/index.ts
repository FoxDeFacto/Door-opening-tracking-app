// Definice 4 stavů pro čistší kód
export const DOOR_STATES = [
  { id: 1, label: "Zavřený -> Zavřený", doorOpen: false },
  { id: 2, label: "Zavřený -> Otevřený", doorOpen: true },
  { id: 3, label: "Otevřený -> Zavřený", doorOpen: false },
  { id: 4, label: "Otevřený -> Otevřený", doorOpen: true },
];