import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent, components } from './components';
import { containers } from './containers';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
    declarations: [
        ...components, ...containers
    ],
    imports: [
        //=> Angular modules
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,

        //=> Third-party modules
        FontAwesomeModule,

        //=> App modules
        AppRoutingModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
