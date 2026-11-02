// Representa el mòdul arrel. A l'article següent trobem més informació sobre aquest mòdul: https://v2.angular.io/docs/ts/latest/guide/appmodule.html
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

@NgModule({
  declarations: [
    AppComponent 
  ],
  imports: [
    BrowserModule,    // "the BrowserModule that this and every application needs to run in a browser."
    AppRoutingModule  // Aquest és el nostre sistema de rutes
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent] // "the root component that Angular creates and inserts into the index.html host web page."
})
export class AppModule { }
