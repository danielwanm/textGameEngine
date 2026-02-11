export interface Game {
    head: string;
    nodes: Record<string, Node>
}
export interface Node {
    nodeId: string;

    daniel: boolean;
    mel: boolean;
    danielText: string;
    melText: string;
    forest: boolean;
    forestText: string;

    options: Option[];
    expectedInputContains: string;
    inputNext: string;
    wrongInputNext: string;
    changeBackground?:string;
}

export interface Option {
    text: string;
    next: string;
}


