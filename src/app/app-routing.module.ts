import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeckDetailContainer, DecksContainer } from './containers';

const routes: Routes = [
    {
        path: '',
        component: DecksContainer
    },
    {
        path: 'deck/:deckName',
        component: DeckDetailContainer
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
