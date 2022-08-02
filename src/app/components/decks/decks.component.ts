import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DeckList } from '../../storage';

@Component({
    selector: 'decks',
    templateUrl: './decks.component.html',
    styleUrls: ['./decks.component.scss']
})
export class DecksComponent {
    @Input()
    public decks?: DeckList;

    @Output()
    public readonly shouldOpenDeck = new EventEmitter<string>();
}
