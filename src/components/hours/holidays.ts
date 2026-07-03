import { format } from 'date-fns';

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getHolidays(year: number): Set<string> {
  const holidays = new Set<string>();
  const easter = getEasterDate(year);
  const add = (m: number, d: number) =>
    holidays.add(format(new Date(year, m - 1, d), 'yyyy-MM-dd'));

  add(1, 1);   // Ano Novo
  add(4, 21);  // Tiradentes
  add(5, 1);   // Dia do Trabalho
  add(9, 7);   // Independência
  add(10, 12); // Nossa Senhora Aparecida
  add(11, 2);  // Finados
  add(11, 15); // Proclamação da República
  add(12, 25); // Natal

  const carnaval = new Date(easter); carnaval.setDate(carnaval.getDate() - 47);
  const sextaSanta = new Date(easter); sextaSanta.setDate(sextaSanta.getDate() - 2);
  const corpusChristi = new Date(easter); corpusChristi.setDate(corpusChristi.getDate() + 60);

  holidays.add(format(carnaval, 'yyyy-MM-dd'));
  holidays.add(format(sextaSanta, 'yyyy-MM-dd'));
  holidays.add(format(corpusChristi, 'yyyy-MM-dd'));

  return holidays;
}
