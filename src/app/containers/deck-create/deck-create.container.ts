import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as Scryfall from 'scryfall-sdk';
import { ShouldCreateDeckFromListOutputData } from '../../components/deck-create/deck-create.component';
import { createDeck, Deck, parseDeck, updateDeck } from '../../storage';

export type CreateDeckFromListProgress = {
    fetchedCards: number;
    totalCards: number;
}

@Component({
    selector: 'deck-create-container',
    template: `
        <deck-create
            [loading]="loading"
            [error]="error"
            [createDeckFromListProgress]="createDeckFromListProgress"
            (shouldCreateDeckFromList)="createDeckFromList($event)"
            (shouldImportDeck)="importDeck($event)"
        ></deck-create>
    `
})
export class DeckCreateContainer {
    public loading = false;
    public error = false;
    public createDeckFromListProgress?: CreateDeckFromListProgress;

    public constructor(private readonly router: Router) {
    }

    public async createDeckFromList(data: ShouldCreateDeckFromListOutputData): Promise<void> {
        this.loading = true;

        //=> Get the cards list from the text input
        const cardsList = data.cardsList
            // Split by line
            .match(/[^\r\n]+/g)
            // Get quantity and name from line
            ?.map(line => {
                const regex = /^((?<quantity>\d+)x?\s)?(?<name>.+)/gi;
                const match = regex.exec(line.trim());

                if (!match?.groups) { return undefined; }

                return {
                    quantity: parseInt(match.groups['quantity'] ?? '1', 10),
                    name: match.groups['name'],
                };
            })
            // Filter empty results
            .filter((match): match is { quantity: number, name: string } => !!match) ?? [];

        const totalCards = cardsList.length;
        let fetchedCards = 0;

        this.createDeckFromListProgress = { fetchedCards, totalCards };

        const deckCards: Deck['cards'] = [];

        //=> Fetch the card data from Scryfall
        for (const card of cardsList) {
            try {
                const scryfallCard = await Scryfall.Cards.byName(card.name, true);
                const scryfallCardPrints = await scryfallCard.getPrints();

                deckCards.push({
                    card: {
                        name: scryfallCard.name,
                        land: scryfallCard.type_line.includes('Land'),
                        colors: scryfallCard.colors ?? [],
                        colorIdentity: scryfallCard.color_identity ?? [],
                        manaValue: scryfallCard.cmc,

                        prices: scryfallCardPrints
                            .filter(print => !print.digital && !print.oversized)
                            .map(print => ({
                                set: print.set,
                                collectorNumber: print.collector_number,
                                releasedAt: print.released_at,
                                price: print.prices.eur ? parseFloat(print.prices.eur) : undefined
                            }))
                    },
                    quantityWanted: card.quantity,
                    quantityBought: 0
                });
            } catch {
                // noop
            } finally {
                fetchedCards++;
                this.createDeckFromListProgress = { fetchedCards, totalCards };
            }
        }

        const deck: Deck = {
            name: data.deckName?.trim(),
            pricesUpdateDate: new Date().toISOString(),
            cards: deckCards
        };

        if (createDeck(deck)) {
            this.loading = false;

            // noinspection JSIgnoredPromiseFromCall
            this.router.navigate(['deck', deck.name]);
        } else {
            this.error = true;
            this.loading = false;
            this.createDeckFromListProgress = undefined;
        }
    }

    public importDeck(serializedDeck: string): void {
        this.error = false;
        this.loading = true;
        this.createDeckFromListProgress = undefined;

        const deck = parseDeck(serializedDeck);

        if (!deck || !createDeck(deck)) {
            this.error = true;
            this.loading = false;

            return;
        }

        // noinspection JSIgnoredPromiseFromCall
        this.router.navigate(['deck', deck.name]);
    }
}
