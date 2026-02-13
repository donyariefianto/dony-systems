// app/services/date_service.ts
import moment from 'moment-timezone'
import env from '#start/env'

export class DateService {
 // Mengambil default timezone dari ENV (contoh: Asia/Jakarta)
 private static get TZ() {
  return env.get('APP_TIMEZONE', 'UTC')
 }

 /**
  * Menghasilkan object Date sekarang (untuk simpan ke MongoDB)
  */
 static now(): Date {
  return moment().tz(this.TZ).toDate()
 }

 /**
  * Menambah waktu (Manipulate: Add)
  * Contoh: add(5, 'days'), add(1, 'month')
  * @param amount Jumlah yang ditambahkan
  * @param unit Satuan (days, months, years, hours, minutes, seconds)
  * @param baseDate Tanggal dasar (opsional, default sekarang)
  */
 static add(amount: number, unit: moment.unitOfTime.DurationConstructor, baseDate?: Date): Date {
  return moment(baseDate || new Date())
   .tz(this.TZ)
   .add(amount, unit)
   .toDate()
 }

 /**
  * Mengurangi waktu (Manipulate: Subtract)
  * Contoh: subtract(2, 'hours'), subtract(7, 'days')
  * @param amount Jumlah yang dikurangi
  * @param unit Satuan (days, months, years, hours, minutes, seconds)
  * @param baseDate Tanggal dasar (opsional, default sekarang)
  */
 static subtract(
  amount: number,
  unit: moment.unitOfTime.DurationConstructor,
  baseDate?: Date
 ): Date {
  return moment(baseDate || new Date())
   .tz(this.TZ)
   .subtract(amount, unit)
   .toDate()
 }

 /**
  * Helper untuk format tampilan ke user (Display)
  */
 static format(date: Date | string, pattern: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return moment(date).tz(this.TZ).format(pattern)
 }
}
