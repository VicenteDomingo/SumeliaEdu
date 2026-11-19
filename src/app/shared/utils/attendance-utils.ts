// Interpretem els estats d'assistència. Centralitzem els textos, les lletres i icones que representa cada estat; A més, creem un funció que determine l'estat general d'un alumne en un dia concret

import { Attendance, AttendanceStatus } from '../models/database.models';

// creem un tipus nou que inclou una altre estat "none" -> dia sense registres
export type DayStatus = AttendanceStatus | 'none'; 

// "Record<Keys, Type>: Construye un tipo de objeto cuyas claves de propiedad son Keys y cuyos valores de propiedad son Type. Esta utilidad se puede utilizar para asignar las propiedades de un tipo a otro tipo." https://mrando-via.medium.com/el-tipo-record-en-typescript-c40a4c3bbcdc

export const STATUS_LABELS: Record<DayStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  justified: 'Justified',
  none: 'Not recorded'
};

export const STATUS_LETTERS: Record<DayStatus, string> = {
  present: 'P',
  absent: 'A',
  late: 'L',
  justified: 'J',
  none: '-'
};

export const STATUS_ICONS: Record<DayStatus, string> = {
  present: 'check_circle',
  absent: 'cancel',
  late: 'schedule',
  justified: 'verified',
  none: 'help'
};

// Registrem l'estat d'un dia, a partir dels registres d'eixe (un per assignatura)
// Fem que prenga més importància el més greu: absent, despres late, justified i present
export function getDayStatus(records: Attendance[]): DayStatus {
  if (records.length === 0) {
    return 'none';
  }

  if (records.some(record => record.status === 'absent')) { // amb el mètode .some() recorrem els registres i, si, al menys, un element d'una llista compleix la condició
    return 'absent';
  }

  if (records.some(record => record.status === 'late')) {
    return 'late';
  }

  if (records.some(record => record.status === 'justified')) {
    return 'justified';
  }

  return 'present';
}