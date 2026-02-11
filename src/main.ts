import type {Game, Node, Option} from './types.ts';
import { parseGameScript } from './parser.ts';

const mainHeader = document.getElementById('mainHeader')!;

// Buttons
const startQuestButton = document.getElementById('startQuestButton')!;
startQuestButton.classList.toggle('hidden');
const gameButtonDiv = document.getElementById('gameButton');
const inputBoxDiv = document.getElementById('inputBox')!;

// Images
const danielNotTalking = document.getElementById('danielNotTalking')!;
const danielTalking = document.getElementById('danielTalking')!;
const speechBubbleRight = document.getElementById('speechBubbleRight')!;

const melNotTalking = document.getElementById('melNotTalking')!;
const melTalking = document.getElementById('melTalking')!;
const speechBubbleLeft = document.getElementById('speechBubbleLeft')!;

const title = document.getElementById('title')!;
title.classList.toggle('hidden');

// Text 
const danielGameTextBox = document.getElementById('danielGameText')!;
const melGameTextBox = document.getElementById('melGameText')!;
const forestGameTextBox = document.getElementById('forestGameText')!;

// Start game
startQuestButton.addEventListener('click', () => {
  startQuestButton.classList.toggle('hidden');
  mainHeader.classList.add('hidden');
  title.classList.toggle('hidden');

  void mainLoop();
});

async function mainLoop() {
  const game: Game = await parseGameScript();
  let currentNode: Node = game.nodes[game.head];
  while (currentNode && notEnd(currentNode)) {
    // Render text
    await render(currentNode);
    let nextNodeId: string = '';
    // Render buttons and wait
    if (currentNode.options.length > 0) {
      nextNodeId = await waitForOption(currentNode.options);
    } else if (currentNode.expectedInputContains) {
      nextNodeId = await waitForInput(currentNode.expectedInputContains, currentNode.inputNext, currentNode.wrongInputNext);
    } else {
      break;
    }
    currentNode = game.nodes[nextNodeId];
    hideAll();
    // Set currentNode to next node 
  }
  hideAll();
  renderGameEnd();
}


// Renders buttons and waits for selection
function waitForOption(options:Option[]): Promise<string> {
  return new Promise(resolve => {
    gameButtonDiv!.innerHTML = ''; // clear old buttons

    for (const option of options) {
      const button = document.createElement('button');
      button.textContent = option.text;
        
      button.addEventListener('click', () => {
        console.log(`${option.text} clicked`);
        resolve(option.next); 
      });
        
        gameButtonDiv!.appendChild(button);
    }
    
  });
}

function waitForInput(expectedInputContains:string,inputNext: string, wrongInputNext: string ): Promise<string> {
  return new Promise(resolve => {
    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.placeholder = 'Answer here';
    inputBoxDiv.appendChild(inputBox);
    inputBox.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        if (inputBox.value.toLowerCase().includes(expectedInputContains)) {
          inputBox.remove();
          resolve(inputNext);
        } else {
          inputBox.remove();
          resolve(wrongInputNext);
          console.log(wrongInputNext);
        }
      }
    });
  });
}

// Renders all sprites and backgrounds
async function render(currentNode: Node) {
  // Render background
  if (currentNode.changeBackground) {
    const appContainer = document.getElementById('appContainer');

    // Resolve the background path relative to this module (src/) so
    // the URL points to the actual file location (e.g. src/images/...)
    const resolved = new URL(currentNode.changeBackground!, import.meta.url).href;
    appContainer!.style.backgroundImage = `url(${resolved})`;
  }
  // Render Daniel
  if (currentNode.danielText) {
    danielTalking.classList.remove('hidden');
  } else if (currentNode.daniel) {
    danielNotTalking.classList.remove('hidden');
  }

  // Render Mel
  if (currentNode.melText) {
    melTalking.classList.remove('hidden');
  } else if (currentNode.mel) {
    melNotTalking.classList.remove('hidden');
  } 
  // Render text
  if (currentNode.danielText) {
    speechBubbleRight.classList.remove('hidden');
    await typeText(currentNode.danielText, danielGameTextBox);
  }

  if (currentNode.melText) {
    if (currentNode.danielText) {
      await waitForClick();
    };
    speechBubbleLeft.classList.remove('hidden'); 
    await typeText(currentNode.melText, melGameTextBox);
  }

  // Render forest
  if (currentNode.forestText) {
    if (currentNode.melText) {
      await waitForClick();
    };    forestGameTextBox.classList.remove('hidden');
    await typeText(currentNode.forestText, forestGameTextBox);
  } else if (currentNode.forest) {
    // TODO
  } 



}


// Hides all sprites and backgrounds
function hideAll() {
  danielTalking.classList.add('hidden');
  speechBubbleRight.classList.add('hidden');
  danielNotTalking.classList.add('hidden');
  melTalking.classList.add('hidden');
  speechBubbleLeft.classList.add('hidden');
  melNotTalking.classList.add('hidden');
  danielGameTextBox.textContent = '';
  melGameTextBox.textContent = '';
  forestGameTextBox.classList.add('hidden');
  forestGameTextBox.textContent = '';
  gameButtonDiv!.innerHTML = ''; // clear old buttons
  inputBoxDiv.innerHTML = '';
  inputBoxDiv.classList.add('hidden');
}


// Helper functions
function notEnd(node: Node): boolean {
  if (!node.options && !node.expectedInputContains) {
    return false;
  }
  return true;
}

function typeText(text:string, gameTextBox:HTMLElement ): Promise<void> {
  return new Promise(resolve => {
    gameTextBox.textContent = ''; // clear old text
    let i = 0;
    const interval = setInterval(() => {
      gameTextBox.textContent += text[i];
      i++;

      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, 40);
  });
}

function waitForClick() {
  return new Promise(resolve => {
    document.addEventListener('click', resolve, { once: true });
  });
}

function renderGameEnd() {
  const appContainer = document.getElementById('appContainer');
  if (!appContainer) return;

  const endEl = document.createElement('div');
  endEl.className = 'game-end';
  endEl.textContent = 'HAPPY VALENTINES DAY!';
  appContainer.appendChild(endEl);
}
