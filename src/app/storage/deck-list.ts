import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';
import { map, Observable, startWith, Subject } from 'rxjs';

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

const onDeckListUpdated = new Subject<void>();

export function getDeckList(): DeckList {
    const serializedDeckList = localStorage.getItem(deckListKey);

    if (!serializedDeckList) {
        return [];
    }

    return parseDeckList(serializedDeckList) ?? [];
}

export function observeDeckList(): Observable<DeckList> {
    return onDeckListUpdated.pipe(
        startWith(undefined),
        map(() => getDeckList()));
}

export function updateDeckList(deckList: DeckList): boolean {
    const serializedDeckList = serializeDeckList(deckList);

    if (!serializedDeckList) {
        return false;
    }

    localStorage.setItem(deckListKey, serializedDeckList);

    onDeckListUpdated.next();

    return true;
}
