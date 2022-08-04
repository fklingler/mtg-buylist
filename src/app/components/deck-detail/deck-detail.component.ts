import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card, CardPrice, Deck } from '../../storage';
import * as weakMemoize from 'memoizee/weak';

type PriceCategory = 'best' | 'excellent' | 'good' | 'medium' | 'bad' | 'unknown';

const colorOrder = ['W', 'U', 'B', 'R', 'G'];

@Component({
    selector: 'deck-detail',
    templateUrl: './deck-detail.component.html',
    styleUrls: ['./deck-detail.component.scss']
})
export class DeckDetailComponent {
    @Input()
    public deck?: Deck;

    @Output()
    public shouldUpdateDeck = new EventEmitter<Deck>;

    public displayedQuantityModificationCardName?: string;

    public displayedPriceDetailsCardName?: string;

    public constructor() {
        this.getBestPrice = weakMemoize(this.getBestPrice);
        this.getDisplayedDetailedPrices = weakMemoize(this.getDisplayedDetailedPrices);
    }

    /**
     * Returns filtered and sorted deck cards
     */
    public get displayedDeckCards(): Deck['cards'] {
        if (!this.deck) {
            return [];
        }

        return [...this.deck.cards]
            // Sort by name
            .sort((a, b) => a.card.name.localeCompare(b.card.name))
            // Sort by mana value
            .sort((a, b) => a.card.manaValue - b.card.manaValue)
            // Sort by colors
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
            })
            // Sort lands separately
            .sort((a, b) => Number(b.card.land) - Number(a.card.land));
    }

    public toggleDisplayedQuantityModification(card: Card): void {
        if (this.displayedQuantityModificationCardName == card.name) {
            this.displayedQuantityModificationCardName = undefined;
            return;
        }

        this.displayedQuantityModificationCardName = card.name;
    }

    public toggleDisplayPriceDetails(card: Card): void {
        if (this.displayedPriceDetailsCardName == card.name) {
            this.displayedPriceDetailsCardName = undefined;
            return;
        }

        this.displayedPriceDetailsCardName = card.name;
    }

    public updateCardQuantity(card: Card, change: { quantityBought?: number, quantityWanted?: number }): void {
        const cardInfoToUpdate = this.deck?.cards.find(cardInfo => cardInfo.card == card);

        if (!this.deck || !cardInfoToUpdate) {
            return;
        }

        this.shouldUpdateDeck.emit({
            ...this.deck,
            cards: [
                ...this.deck.cards.filter(cardInfo => cardInfo != cardInfoToUpdate),
                {
                    ...cardInfoToUpdate,
                    quantityBought: Math.max(0, cardInfoToUpdate.quantityBought + (change.quantityBought ?? 0)),
                    quantityWanted: Math.max(0, cardInfoToUpdate.quantityWanted + (change.quantityWanted ?? 0))
                }
            ]
        });
    }

    public getBestPrice(card: Card): CardPrice | undefined {
        return card.prices
            .reduce<CardPrice | undefined>((bestPrice, cardPrice) => {
                return !bestPrice || (cardPrice.price ?? Infinity) < (bestPrice.price ?? Infinity)
                    ? cardPrice
                    : bestPrice;
            }, undefined);
    }

    public getDisplayedDetailedPrices(card: Card): CardPrice[] {
        return [...card.prices]
            .filter(price => price != this.getBestPrice(card))
            .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }

    public getPriceCategory(cardPrice: CardPrice, card: Card): PriceCategory {
        if (!cardPrice.price) {
            return 'unknown';
        }

        const bestPrice = this.getBestPrice(card)?.price;

        if (!bestPrice) {
            return 'unknown';
        }

        if (cardPrice.price < bestPrice * 1.1) {
            return 'best';
        }
        if (cardPrice.price < bestPrice * 1.2) {
            return 'excellent';
        }
        if (cardPrice.price < bestPrice * 1.5) {
            return 'good';
        }
        if (cardPrice.price < bestPrice * 2) {
            return 'medium';
        }

        return 'bad';
    }

    public getColorClass(card: Card): string {
        if (card.colors.length == 0) {
            return 'colorless';
        }

        if (card.colors.length == 1) {
            return card.colors[0];
        }

        return 'multicolored';
    }
}
