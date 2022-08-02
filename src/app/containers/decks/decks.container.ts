import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { getDeckList } from '../../storage';

@Component({
    template: `
        <decks
            [decks]="decks"
            (shouldOpenDeck)="openDeck($event)"
        ></decks>
    `
})
export class DecksContainer {
    public readonly decks = getDeckList();

    public constructor(private readonly router: Router) {
    }

    public openDeck(deckName: string): void {
        // noinspection JSIgnoredPromiseFromCall
        this.router.navigate(['deck', deckName]);
    }
}
