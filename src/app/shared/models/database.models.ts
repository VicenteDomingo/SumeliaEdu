// Escrivim els diferents models de la base de dades en TypeScript. Cada interfície representa una taula de la base de dades i els tipus reflecteixen els CHECKs i restriccions definits a la base de dades.

// Representen els valors permesos per a determinats camps de les taules, com ara el rol d'un usuari, el gènere d'un estudiant, l'estat d'assistència, etc. Aquests tipus ajuden a garantir que només pugam assignar valors vàlids a aquests camps en el codi TypeScript.
export type Role = 'admin' | 'teacher' | 'parent';
export type Gender = 'male' | 'female' | 'other';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified';
export type AnnouncementTarget = 'all' | 'parents' | 'teachers' | 'class';
export type Term = 1 | 2 | 3;
export type RsvpAnswer = 'yes' | 'no';

// Entitats que representen les taules de la base de dades. Cada interfície defineix els camps de la taula i els seus tipus corresponents, reflectint les restriccions i relacions definides a la base de dades.
export interface School {
  id: string;
  name: string;
  country: string;
  currency: string;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  school_id: string;
  full_name: string;
  role: Role;
  email: string;
  created_at: string;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  name: string;
  year: number;
  tutor_id: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string | null;
  parent_id: string | null;
  full_name: string;
  admission_no: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  class_id: string;
  teacher_id: string | null;
  name: string;
  code: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  school_id: string;
  student_id: string;
  subject_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
}

export interface Grade {
  id: string;
  school_id: string;
  student_id: string;
  subject_id: string;
  term: Term;
  assessment_name: string;
  score: number | null;
  max_score: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  school_id: string;
  author_id: string | null;
  title: string;
  body: string;
  target: AnnouncementTarget;
  class_id: string | null;
  pinned: boolean;
  rsvp: boolean;
  created_at: string;
}

export interface RsvpResponse {
  id: string;
  announcement_id: string;
  user_id: string;
  response: RsvpAnswer | null;
  created_at: string;
}

export interface Message {
  id: string;
  school_id: string;
  from_id: string;
  to_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface Fee {
  id: string;
  school_id: string;
  student_id: string;
  description: string;
  amount: number;
  due_date: string | null;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

// Interfície que representa un alumne junt amb el nom de la seua classe. Aquesta interfície s'utilitza per mostrar informació combinada d'un alumne i la seva classe en la vista de l'aplicació.
export interface StudentWithClass extends Student { // Estén la intefície Student. A més, amb el camp extra "classes". 
  classes: { name: string } | null;
}

// Les dades que enviem a Supabase en crear o editar un alumne. Aquesta interfície defineix els camps necessaris per a la creació o actualització d'un registre d'alumne a la base de dades.
export interface StudentData {
  school_id: string;
  class_id: string;
  parent_id: string | null;
  full_name: string;
  admission_no: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
}
