import type {Game, Node, Option} from './types';
const GAME_TEXT_DOC = new URL('./game.txt', import.meta.url);

function newNode(): Node {
  return {
    nodeId: '',
    daniel: false,
    mel: false,
    danielText: '',
    melText: '',
    forest: false,
    forestText: '',
    options: [],
    expectedInputContains: '',
    inputNext: '',
    wrongInputNext: ''
  };
}

function commitNode(game: Game, node: Node) {
  if (!node.nodeId) return;
  // store a copy so later mutations can't affect stored nodes
  game.nodes[node.nodeId] = { ...node, options: [...node.options] };

}

export async function parseGameScript(): Promise<Game> {
  const response = await fetch(GAME_TEXT_DOC);
  if (!response.ok) {
    throw new Error(`Failed to load game script (${response.status})`);
  }

  const script = await response.text();
  const lines = script.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const game: Game = { head: '', nodes: {} };
  let current = newNode();

  for (const raw of lines) {
    const line = raw.trim();

    // ignore blanks + comments
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    if (line.startsWith('::')) {
      // finish previous node if any
      commitNode(game, current);

      current = newNode();
      current.nodeId = line.slice(2).trim();

      if (line.endsWith('START')) game.head = current.nodeId;

    } else if (line.startsWith(':d')) {
      current.daniel = true;

    } else if (line.startsWith(':m')) {
      current.mel = true;

    } else if (line.startsWith('dt')) {
      current.danielText = line.slice(2).trim();

    } else if (line.startsWith('mt')) {
      current.melText = line.slice(2).trim();

    } else if (line.startsWith('ft')) {
      current.forestText = `EVIL FOREST: ${line.slice(2).trim()}`;

    }  else if (line.startsWith('--')) {
      // format: --option text -> nextNodeId
      const cleaned = line.slice(2).trim();
      const parts = cleaned.split('->');
      if (parts.length === 2) {
        const option: Option = {
          text: parts[0].trim(),
          next: parts[1].trim(),
        };
        current.options.push(option);
      }
    } else if (line.startsWith('-?')) {
      const cleaned = line.slice(2).trim();
      const parts = cleaned.split('->').flatMap(part => part.split('/'));
      if (parts.length === 3) {
        current.expectedInputContains = parts[0].trim();
        current.inputNext = parts[1].trim();
        current.wrongInputNext = parts[2].trim();
      }
    } else if (line.startsWith('cb')) {
      const backgrounds: Record<string, string> = {
        day: 'images/cloudyBackground.png',
        night: 'images/nightBackground.png',
        sunrise: 'images/sunriseBackground.png'
      };

      const background = line.slice(2).trim();
      const backgroundUrl = backgrounds[background];
      current.changeBackground = backgroundUrl;

    } else if (line.startsWith(':!')) {
      // end node
      commitNode(game, current);
      current = newNode();
    }
  }

  // if file doesn't end with :!
  commitNode(game, current);

  return game;
}
