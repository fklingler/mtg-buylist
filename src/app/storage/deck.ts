import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';
import { getDeckList, updateDeckList } from './deck-list';

export type Card = {
    name: string;

    colors: string[];
    colorIdentity: string[];
    manaValue: number;

    prices: Array<{
        set: string;
        collectorNumber: string;
        releasedAt: string;
        price?: string;
    }>;
}

export type Deck = {
    name: string;

    pricesUpdateDate: string;

    cards: Array<{
        card: Card;

        quantityWanted: number;

        quantityBought: number;
    }>
}

const cardSchema: JTDSchemaType<Card> = {
    properties: {
        name: { type: 'string' },
        colors: {
            elements: { type: 'string' }
        },
        colorIdentity: {
            elements: { type: 'string' }
        },
        manaValue: { type: 'uint8' },
        prices: {
            elements: {
                properties: {
                    set: { type: 'string' },
                    collectorNumber: { type: 'string' },
                    releasedAt: { type: 'string' }
                },
                optionalProperties: {
                    price: { type: 'string' }
                }
            }
        }
    }
};

const deckSchema: JTDSchemaType<Deck> = {
    properties: {
        name: { type: 'string' },
        pricesUpdateDate: { type: 'string' },
        cards: {
            elements: {
                properties: {
                    card: cardSchema,

                    quantityWanted: { type: 'uint8' },
                    quantityBought: { type: 'uint8' }
                }
            }
        }
    }
};

const ajv = new Ajv();

export const serializeDeck = ajv.compileSerializer(deckSchema);
export const parseDeck = ajv.compileParser(deckSchema);

const deckKey = (deckName: string) => `deck-${deckName}`;

export function getDeck(name: string): Deck | undefined {
    const serializedDeck = localStorage.getItem(deckKey(name));

    if (!serializedDeck) {
        return undefined;
    }

    return parseDeck(serializedDeck) ?? undefined;
}

export function updateDeck(deck: Deck): boolean {
    const serializedDeck = serializeDeck(deck);

    if (!serializedDeck) {
        return false;
    }

    localStorage.setItem(deckKey(deck.name), serializedDeck);

    return true;
}

export function createDeck(deck: Deck): boolean {
    const deckList = new Set(getDeckList());

    deckList.add({ name: deck.name });

    return updateDeck(deck) && updateDeckList([...deckList]);
}

export function removeDeck(deckName: string): boolean {
    const deckList = getDeckList().filter(deck => deck.name != deckName);

    localStorage.removeItem(deckKey(deckName));

    return updateDeckList(deckList);
}
