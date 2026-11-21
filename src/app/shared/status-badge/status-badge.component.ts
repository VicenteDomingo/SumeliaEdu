// Creem aquest xicotet component fa referènca a les etiquetes dels estats d'assistència de l'historial d'assistència. Com que volem usar-les a altres llocs de l'aplicació (component reutilitzable), les creem a la carpeta shared.

// ng generate component shared/status-badge --change-detection OnPush. Ací decidim gastar l'estratègia que aprenguerem a Angular Avançat 'ChangeDetectionStrategy.OnPush'. Per defecte, Angular utilitza `ChangeDetectionStrategy.Default`. Així, comprova els components en cada event, siga click, petició HTTP... per veure si ha canviat alguna dada i renderitzar.

// Amb `OnPush`, Angular sols revisa el component quan, bé siga un `@Input`, Signal o event click... canvia. Aleshores, s'actualitza a la vista. Fent que siga més eficient, ja que no comprova el component en cada event, sinó només quan canvia alguna dada. Revisem el següent article per inspiració i esclariment. Com evidentment esmenta, "it reduces the number of checks performed by Angular during change detection, leading to improved performance."

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { 
  DayStatus, 
  STATUS_ICONS, 
  STATUS_LABELS 
} from '../utils/attendance-utils';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {

  @Input() status: DayStatus = 'none'; // rebem del pare, AttendanceHistoryComponent, la propietat status:DayStatus. Si no arriba cap, valdrà 'none' 

  // Els diccionaris per a que l'HTML els puga llegir
  labels = STATUS_LABELS;
  icons = STATUS_ICONS;
}
