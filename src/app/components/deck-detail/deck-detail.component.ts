import { Component, Input } from '@angular/core';
import { Deck } from '../../storage';

const colorOrder = ['W', 'U', 'B', 'R', 'G'];

@Component({
    selector: 'deck-detail',
    templateUrl: './deck-detail.component.html',
    styleUrls: ['./deck-detail.component.scss']
})
export class DeckDetailComponent {
    @Input()
    public deck?: Deck;

    /**
     * Returns filtered and sorted deck cards
     */
    public get displayedDeckCards(): Deck['cards'] {
        if (!this.deck) {
            return [];
        }

        return [...this.deck.cards]
            .sort((a, b) => a.card.manaValue - b.card.manaValue)
            .sort((a, b) => {
                if (a.card.colors.length != b.card.colors.length) {
                    return a.card.colors.length - b.card.colors.length;
                }

                return a.card.colors
                        .map(c => Math.pow(2, colorOrder.indexOf(c) ?? 0))
                        .reduce((acc, cur) => acc + cur, 0)
                    - b.card.colors
                        .map(c => Math.pow(2, colorOrder.indexOf(c) ?? 0))
                        .reduce((acc, cur) => acc + cur, 0);
            });
    }
}
