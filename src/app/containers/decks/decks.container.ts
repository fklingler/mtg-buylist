import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { getDeck, getDeckList, observeDeckList, removeDeck } from '../../storage';

@Component({
    template: `
        <decks
            [decks]="(decks$ | async)!"
            (shouldOpenDeck)="openDeck($event)"
        ></decks>
    `
})
export class DecksContainer {
    public readonly decks$ = observeDeckList();

    public constructor(private readonly router: Router) {
        this.clearInvalidDecks();
    }

    public openDeck(deckName: string): void {
        // noinspection JSIgnoredPromiseFromCall
        this.router.navigate(['deck', deckName]);
    }

    private clearInvalidDecks(): void {
        const deckList = getDeckList();

        for (const deckInfo of deckList) {
            const deck = getDeck(deckInfo.name);

            if (!deck) {
                removeDeck(deckInfo.name);
            }
        }
    }
}
