import * as bcrypt from 'bcrypt';

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);

export const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export const randomFutureDate = (maxDaysAhead = 45): Date => {
  const now = new Date();
  const daysToAdd = Math.floor(Math.random() * maxDaysAhead) + 1;
  const date = new Date(now);
  date.setDate(now.getDate() + daysToAdd);
  date.setHours(Math.floor(Math.random() * 8) + 9); // between 9am and 5pm
  date.setMinutes([0, 15, 30, 45][Math.floor(Math.random() * 4)]);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const uniqueEmail = (base: string, domain: string, suffix: string) =>
  `${slugify(base)}-${suffix}@${domain}`;
