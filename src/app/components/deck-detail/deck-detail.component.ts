import { Component, Input } from '@angular/core';
import { Deck } from '../../storage';

@Component({
    selector: 'deck-detail',
    templateUrl: './deck-detail.component.html',
    styleUrls: ['./deck-detail.component.scss']
})
export class DeckDetailComponent {
    @Input()
    public deck?: Deck;
}
