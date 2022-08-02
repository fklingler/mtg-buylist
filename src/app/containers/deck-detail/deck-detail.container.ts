import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, tap } from 'rxjs';
import { Deck, getDeck } from '../../storage';

@Component({
    template: `
        <deck-detail
            [deck]="(deck$ | async)!"
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
            map(deckName => deckName && getDeck(deckName)),
            tap(deck => {
                if (!deck) {
                    // noinspection JSIgnoredPromiseFromCall
                    router.navigate([]);
                }
            }),
            filter((deck): deck is Deck => !!deck));
    }
}
