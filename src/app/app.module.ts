import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent, components } from './components';
import { containers } from './containers';

@NgModule({
    declarations: [
        ...components, ...containers
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,

        ReactiveFormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
