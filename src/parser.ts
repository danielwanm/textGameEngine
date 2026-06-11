import type { Game, Node, Character, Side } from './types.ts';
import gameScript from './game.txt?raw';

const imageModules = import.meta.glob(
  './images/*.{png,jpg,jpeg,gif,webp}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

const imagesByName: Record<string, string> = {};
for (const [path, url] of Object.entries(imageModules)) {
  const name = path.split('/').pop()!;
  imagesByName[name] = url;
}

function resolveImage(name: string): string {
  const url = imagesByName[name];
  if (!url) throw new Error(`Image not found in src/images/: ${name}`);
  return url;
}

function newNode(): Node {
  return { nodeId: '', lines: [], options: [] };
}

function commitNode(game: Game, node: Node) {
  if (!node.nodeId) return;
  game.nodes[node.nodeId] = {
    ...node,
    lines: [...node.lines],
    options: [...node.options],
  };
}

export function parseGameScript(script: string = gameScript): Game {
  const lines = script.replace(/\r\n/g, '\n').split('\n');

  const game: Game = {
    title: '',
    head: '',
    characters: {},
    narratorId: null,
    backgrounds: {},
    nodes: {},
  };
  let current = newNode();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    // Directives (header)
    if (line.startsWith('@title ')) {
      game.title = line.slice('@title '.length).trim();
      continue;
    }
    if (line.startsWith('@character ')) {
      const parts = line.slice('@character '.length).trim().split(/\s+/);
      if (parts.length !== 4) throw new Error(`@character expects: id side idle talking — got "${line}"`);
      const [id, side, idle, talking] = parts;
      if (side !== 'left' && side !== 'right') throw new Error(`@character side must be left|right — got "${side}"`);
      const char: Character = {
        id,
        side: side as Side,
        idle: resolveImage(idle),
        talking: resolveImage(talking),
      };
      game.characters[id] = char;
      continue;
    }
    if (line.startsWith('@narrator ')) {
      game.narratorId = line.slice('@narrator '.length).trim();
      continue;
    }
    if (line.startsWith('@background ')) {
      const parts = line.slice('@background '.length).trim().split(/\s+/);
      if (parts.length !== 2) throw new Error(`@background expects: name file — got "${line}"`);
      game.backgrounds[parts[0]] = resolveImage(parts[1]);
      continue;
    }

    // Node header
    if (line.startsWith('::')) {
      commitNode(game, current);
      current = newNode();
      const header = line.slice(2).trim();
      const [id, ...tags] = header.split(/\s+/);
      current.nodeId = id;
      if (tags.includes('START')) game.head = id;
      continue;
    }

    // End-of-node marker
    if (line === ':!') {
      commitNode(game, current);
      current = newNode();
      continue;
    }

    // Show character (idle)
    if (line.startsWith('@')) {
      const id = line.slice(1).trim();
      current.lines.push({ speakerId: id, text: '' });
      continue;
    }

    // Narrator line: "* text"
    if (line.startsWith('* ')) {
      if (!game.narratorId) throw new Error('Narrator line found but no @narrator declared');
      current.lines.push({ speakerId: game.narratorId, text: line.slice(2).trim() });
      continue;
    }

    // Option: "--label -> nextId"
    if (line.startsWith('--')) {
      const parts = line.slice(2).split('->');
      if (parts.length !== 2) throw new Error(`Bad option syntax: "${line}"`);
      current.options.push({ text: parts[0].trim(), next: parts[1].trim() });
      continue;
    }

    // Input puzzle: "-? expected -> ok / bad"
    if (line.startsWith('-?')) {
      const cleaned = line.slice(2).trim();
      const parts = cleaned.split('->').flatMap(p => p.split('/'));
      if (parts.length !== 3) throw new Error(`Bad input puzzle: "${line}"`);
      current.expectedInputContains = parts[0].trim().toLowerCase();
      current.inputNext = parts[1].trim();
      current.wrongInputNext = parts[2].trim();
      continue;
    }

    // Background change: "cb name"
    if (line.startsWith('cb ')) {
      const name = line.slice(3).trim();
      const url = game.backgrounds[name];
      if (!url) throw new Error(`Unknown background "${name}"`);
      current.changeBackground = url;
      continue;
    }

    // Dialog: "speakerId: text"
    const colon = line.indexOf(':');
    if (colon > 0) {
      const speakerId = line.slice(0, colon).trim();
      const text = line.slice(colon + 1).trim();
      if (!game.characters[speakerId] && speakerId !== game.narratorId) {
        throw new Error(`Unknown speaker "${speakerId}" in line: "${line}"`);
      }
      current.lines.push({ speakerId, text });
      continue;
    }

    throw new Error(`Unrecognized line: "${line}"`);
  }

  commitNode(game, current);

  if (!game.head) throw new Error('No START node declared. Mark one with "::nodeId START"');
  return game;
}

export function getCharacterAssets(game: Game): string[] {
  const urls: string[] = [];
  for (const c of Object.values(game.characters)) {
    urls.push(c.idle, c.talking);
  }
  for (const url of Object.values(game.backgrounds)) urls.push(url);
  return urls;
}
