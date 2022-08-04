import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CreateDeckFromListProgress } from '../../containers/deck-create/deck-create.container';

export type ShouldCreateDeckFromListOutputData = {
    deckName: string,
    cardsList: string;
};

@Component({
    selector: 'deck-create',
    templateUrl: './deck-create.component.html',
    styleUrls: ['./deck-create.component.scss']
})
export class DeckCreateComponent {
    @Input()
    public loading = false;

    @Input()
    public error = false;

    @Input()
    public createDeckFromListProgress?: CreateDeckFromListProgress;

    @Output()
    public readonly shouldCreateDeckFromList = new EventEmitter<ShouldCreateDeckFromListOutputData>();

    @Output()
    public readonly shouldImportDeck = new EventEmitter<string>();

    public readonly deckFromListForm = new FormGroup({
        deckName: new FormControl('', Validators.required),
        cardsList: new FormControl('', Validators.required),
    });

    public readonly importForm = new FormGroup({
        importData: new FormControl('', Validators.required)
    });

    public createDeckFromList(): void {
        if (!this.deckFromListForm.valid || !this.deckFromListForm.value) {
            return;
        }

        this.shouldCreateDeckFromList.emit({
            deckName: this.deckFromListForm.value.deckName ?? '',
            cardsList: this.deckFromListForm.value.cardsList ?? ''
        });
    }

    public importDeck(): void {
        if (!this.importForm.valid || !this.importForm.value) {
            return;
        }

        this.shouldImportDeck.emit(this.importForm.value.importData ?? '');
    }
}
