import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { faCheck, faFilter, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { isEqual } from 'lodash-es';
import * as memoize from 'memoizee';
import { Card, CardPrice, Deck, DeckCardInfo } from '../../storage';

type PriceCategory = 'best' | 'excellent' | 'good' | 'medium' | 'bad' | 'unknown';

type NotBoughtCardsFilter = {
    type: 'not-bought'
};

type ColorsCardsFilter = {
    type: 'colors';
    colors: string[];
};

type SetCardsFilter = {
    type: 'set';
    set: string;
};

type CardsFilter =
    NotBoughtCardsFilter | ColorsCardsFilter | SetCardsFilter;

const colorOrder = ['W', 'U', 'B', 'R', 'G'];

@Component({
    selector: 'deck-detail',
    templateUrl: './deck-detail.component.html',
    styleUrls: ['./deck-detail.component.scss']
})
export class DeckDetailComponent implements OnChanges {
    @Input()
    public deck?: Deck;

    @Output()
    public shouldUpdateDeck = new EventEmitter<Deck>;

    public showFilters = false;

    public displayedQuantityModificationCardName?: string;

    public displayedPriceDetailsCardName?: string;

    private currentCardsFilters: CardsFilter[] = [];

    public readonly notBoughtCardsFilter: NotBoughtCardsFilter = { type: 'not-bought' };

    public readonly icons = { faPlus, faMinus, faFilter, faCheck };

    private readonly memoizedFunctions: Array<memoize.Memoized<unknown>> = [];

    public constructor() {
        //=> Memoize all we can. The memoization must be clear when either deck or current filters change.
        const methodsToMemoize: Array<keyof this> = [
            'getBestPrice', 'getDisplayedDetailedPrices', 'getDisplayedDeckCards', 'getFilteredDeckCards',
            'getAvailableColorFilters', 'getAvailableSetFilters', 'getBestPrice', 'getDisplayedDetailedPrices',
            'getFilteredCardPrices'
        ];

        for (const methodName of methodsToMemoize) {
            const memoized = memoize(this[methodName] as unknown as (...args: any[]) => any);

            this[methodName] = memoized as unknown as any;

            this.memoizedFunctions.push(memoized);
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if ('deck' in changes) {
            for (const memoized of this.memoizedFunctions) {
                memoized.clear();
            }
        }
    }

    /**
     * Returns filtered and sorted deck cards
     */
    public getDisplayedDeckCards(): DeckCardInfo[] {
        return [...this.getFilteredDeckCards(this.currentCardsFilters)]
            // Sort by name
            .sort((a, b) => a.card.name.localeCompare(b.card.name))
            // Sort by mana value
            .sort((a, b) => a.card.manaValue - b.card.manaValue)
            // Sort by colors
            .sort((a, b) => this.cardsColorsSorter(a.card.colors, b.card.colors))
            // Sort lands separately
            .sort((a, b) => Number(b.card.land) - Number(a.card.land));
    }

    public getFilteredDeckCards(filters: CardsFilter[]): DeckCardInfo[] {
        const notBoughtFilter = filters.find(filter => filter.type == 'not-bought') as
            NotBoughtCardsFilter | undefined;

        const colorFilters = filters.filter(filter => filter.type == 'colors') as ColorsCardsFilter[];

        const setFilters = filters.filter(filter => filter.type == 'set') as SetCardsFilter[];

        return (this.deck?.cards ?? [])
            .filter(cardInfo => {
                return (!notBoughtFilter || this.notBoughtCardsFilterPredicate(cardInfo))
                    && (!colorFilters.length || this.colorsCardsFilterPredicate(cardInfo.card, colorFilters))
                    && (!setFilters.length || cardInfo.card.prices.some(cardPrice =>
                        this.setCardsFilterPredicate(cardPrice, setFilters)))
            });
    }

    public getAvailableColorFilters(): ColorsCardsFilter[] {
        const cardsWithoutColorFilters =
            this.getFilteredDeckCards(this.currentCardsFilters.filter(filter => filter.type != 'colors'));

        return [
            ...(cardsWithoutColorFilters.some(cardInfo => cardInfo.card.land)
                ? [{ type: 'colors', colors: ['L'] } as ColorsCardsFilter]
                : []),
            ...cardsWithoutColorFilters
                .map(cardInfo => cardInfo.card.colors)
                // Unique colors
                .filter((colors, index, array) =>
                    array.findIndex(testColors => isEqual(testColors, colors)) == index)
                .map(colors => ({ type: 'colors', colors } as ColorsCardsFilter))
                .sort((a, b) => this.cardsColorsSorter(a.colors, b.colors))
        ];
    }

    public getAvailableSetFilters(): SetCardsFilter[] {
        return this.getFilteredDeckCards(this.currentCardsFilters.filter(filter => filter.type != 'set'))
            .flatMap(cardInfo => cardInfo.card.prices)
            .map(cardPrice => cardPrice.set)
            // Unique sets
            .filter((set, index, array) => array.indexOf(set) == index)
            .map(set => ({ type: 'set', set }));
        }

    public toggleFilterActive(filter: CardsFilter): void {
        const filterInCurrentFilters = this.currentCardsFilters.find(testFilter => isEqual(testFilter, filter));

        if (filterInCurrentFilters) {
            this.currentCardsFilters = this.currentCardsFilters
                .filter(testFilter => testFilter != filterInCurrentFilters);
        } else {
            this.currentCardsFilters.push(filter);
        }

        for (const memoized of this.memoizedFunctions) {
            memoized.clear();
        }
    }

    public getFilterActive(filter: CardsFilter): boolean {
        return this.currentCardsFilters.some(testFilter => isEqual(testFilter, filter));
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

    public getBestPrice(card: Card, filtered: boolean): CardPrice | undefined {
        const cardPrices = filtered
            ? this.getFilteredCardPrices(card)
            : card.prices;

        return cardPrices
            .reduce<CardPrice | undefined>((bestPrice, cardPrice) => {
                return !bestPrice || (cardPrice.price ?? Infinity) < (bestPrice.price ?? Infinity)
                    ? cardPrice
                    : bestPrice;
            }, undefined);
    }

    public getDisplayedDetailedPrices(card: Card): CardPrice[] {
        return [...this.getFilteredCardPrices(card)]
            .filter(price => price != this.getBestPrice(card, true))
            .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }

    public getPriceCategory(cardPrice: CardPrice, card: Card): PriceCategory {
        if (!cardPrice.price) {
            return 'unknown';
        }

        const bestPrice = this.getBestPrice(card, false)?.price;

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

    public getFilteredCardPrices(card: Card): CardPrice[] {
        const setFilters = this.currentCardsFilters.filter(filter => filter.type == 'set') as SetCardsFilter[];

        return card.prices
            .filter(cardPrice => (!setFilters.length || this.setCardsFilterPredicate(cardPrice, setFilters)))
    }

    public getPreviewFilters(filter: CardsFilter): CardsFilter[] {
        return [
            ...this.currentCardsFilters.filter(testFilter => testFilter.type != filter.type),
            filter
        ];
    }

    private cardsColorsSorter(a: string[], b: string[]): number {
        if (a.length != b.length) {
            return a.length - b.length;
        }

        return a.map(c => Math.pow(2, colorOrder.indexOf(c) ?? 0))
                .reduce((acc, cur) => acc + cur, 0)
            - b.map(c => Math.pow(2, colorOrder.indexOf(c) ?? 0))
                .reduce((acc, cur) => acc + cur, 0);
    }

    // noinspection JSMethodCanBeStatic
    private notBoughtCardsFilterPredicate(cardInfo: DeckCardInfo): boolean {
        return cardInfo.quantityBought < cardInfo.quantityWanted;
    }

    private colorsCardsFilterPredicate(card: Card, colorsCardsFilters: ColorsCardsFilter[]): boolean {
        return colorsCardsFilters.some(colorsCardsFilter =>
            isEqual(colorsCardsFilter.colors, ['L'])
                ? card.land
                : !card.land && isEqual(colorsCardsFilter.colors, card.colors));
    }

    private setCardsFilterPredicate(cardPrice: CardPrice, setCardsFilters: SetCardsFilter[]): boolean {
        return setCardsFilters.some(setCardsFilter => cardPrice.set == setCardsFilter.set);
    }
}
