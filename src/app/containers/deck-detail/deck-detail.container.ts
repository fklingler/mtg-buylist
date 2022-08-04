import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, switchMap, tap } from 'rxjs';
import { Deck, observeDeck, updateDeck as updateDeckInStorage } from '../../storage';

@Component({
    template: `
        <deck-detail
            [deck]="(deck$ | async)!"
            (shouldUpdateDeck)="updateDeck($event)"
        ></deck-detail>
    `
})
export class DeckDetailContainer {
    public readonly deck$: Observable<Deck>;

    public constructor(
        readonly router: Router,
        readonly activatedRoute: ActivatedRoute) {

        this.deck$ = activatedRoute.paramMap.pipe(
            map(paramMap => paramMap.get('deckName')),
            switchMap(deckName => observeDeck(deckName ?? '')),
            tap(deck => {
                if (!deck) {
                    // noinspection JSIgnoredPromiseFromCall
                    router.navigate([]);
                }
            }),
            filter((deck): deck is Deck => !!deck));
    }

    public updateDeck(deck: Deck): void {
        updateDeckInStorage(deck);
    }
}
