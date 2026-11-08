// Mostrem un avís temporal a la part inferior de la pantalla informant a l'usuari que ha tancat sessió correctament ("You have been logged out"). 
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ 
  providedIn: 'root' 
})
export class NotificationService {

  constructor(
    private snackBar: MatSnackBar
  ) {}

  showSuccess(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}