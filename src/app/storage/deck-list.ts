import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';

export type DeckList = Array<{
    name: string;
}>;

const deckListSchema: JTDSchemaType<DeckList> = {
    elements: {
        properties: {
            name: { type: 'string' }
        }
    }
};


const ajv = new Ajv();
export const serializeDeckList = ajv.compileSerializer(deckListSchema);
export const parseDeckList = ajv.compileParser(deckListSchema);

const deckListKey = 'decklist';

export function getDeckList(): DeckList {
    const serializedDeckList = localStorage.getItem(deckListKey);

    if (!serializedDeckList) {
        return [];
    }

    return parseDeckList(serializedDeckList) ?? [];
}

export function updateDeckList(deckList: DeckList): boolean {
    const serializedDeckList = serializeDeckList(deckList);

    if (!serializedDeckList) {
        return false;
    }

    localStorage.setItem(deckListKey, serializedDeckList);

    return true;
}
