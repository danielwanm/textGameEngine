export type Side = 'left' | 'right';

export interface Character {
  id: string;
  side: Side;
  idle: string;
  talking: string;
}

export interface DialogLine {
  speakerId: string | null;
  text: string;
}

export interface Option {
  text: string;
  next: string;
}

export interface Node {
  nodeId: string;
  lines: DialogLine[];
  options: Option[];
  expectedInputContains?: string;
  inputNext?: string;
  wrongInputNext?: string;
  changeBackground?: string;
}

export interface Game {
  title: string;
  head: string;
  characters: Record<string, Character>;
  narratorId: string | null;
  backgrounds: Record<string, string>;
  nodes: Record<string, Node>;
}
