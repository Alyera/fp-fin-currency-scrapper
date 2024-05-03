import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import puppeteer from 'puppeteer';
import { HttpService } from '@nestjs/axios';
import { isEmpty, lastValueFrom, map, tap } from 'rxjs';
import exp from 'constants';

@Injectable()
export class CurrencyScrapperService {
  constructor(private readonly httpService: HttpService) {}

  @Cron(CronExpression.EVERY_DAY_AT_7PM)
  //@Cron(CronExpression.EVERY_10_SECONDS)
  async scrapeExchangeRates() {
    const browser = await puppeteer.launch({
      headless: 'new',
      //executablePath: '/usr/bin/google-chrome',
      //args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    let ratesDate = '';
    let euroRate = '';
    let dolarRate = '';

    try {
      await page.goto(
        'https://www.bcv.org.ve/estadisticas/tipo-cambio-de-referencia-smc',
        { waitUntil: 'load', timeout: 0 },
      );

      //Se obtiene la FECHA VALOR
      const date = await page.waitForSelector('.date-display-single');
      ratesDate = await (
        await date.evaluate((el) => el.getAttribute('content'))
      ).trim();

      const euro = await page.waitForSelector('#euro .centrado');
      euroRate = await (await euro.evaluate((el) => el.textContent)).trim();

      const dolar = await page.waitForSelector('#dolar .centrado');
      dolarRate = await (await dolar.evaluate((el) => el.textContent)).trim();
    } catch (error) {
      console.error(
        'Error al hacer scrapping al listado de monedas del BCV:',
        //error,
      );
    } finally {
    }

    let prtRate = '';
    let ptrDate = '';
    try {
      await page.goto(
        'https://www.bcv.org.ve/estadisticas/graficos/precios-petro',
      );

      const data = await page.evaluate(() => {
        const tds = Array.from(document.querySelectorAll('table tr td'));
        return tds.map((td) => td.textContent.trim());
      });

      prtRate = data[9];
      ptrDate = data[0];
    } catch (error) {
      console.error('Error al hacer scrapping a la tasa del Petro:', error);
    } finally {
      await browser.close();
    }

    console.log('Facha del scrap: ' + ratesDate);

    const ratesDatePart = ratesDate.split('T');

    const now = new Date();

    const exchdate = new Date(ratesDatePart[0]);
    const time1 = new Date(
      '1900-01-01 ' +
        now.getHours() +
        ':' +
        now.getMinutes() +
        ':' +
        now.getSeconds(),
    );
    const expndate = new Date('1900-01-01');

    const eursubstr = euroRate.substring(0, 5).replace(',', '.') + '00000';
    const usdsubstr = dolarRate.substring(0, 5).replace(',', '.') + '00000';
    //const ptrsubstr = prtRate.substring(0,4).replace(',', '.') + '00000'

    //ratesDatePart[0] = '2024-05-06';
    const url = 'http://10.160.10.92:3100/currency/rates/' + ratesDatePart[0];
    //console.log(url);

    let eur,
      usd,
      ptr = {};

    if (ratesDatePart[0] != '') {
      const today = new Date();
      const exchgDateSplit = ratesDatePart[0].split('-');
      const exchdate = new Date(
        parseInt(exchgDateSplit[0]),
        parseInt(exchgDateSplit[1]) - 1,
        parseInt(exchgDateSplit[2]),
        0,
        0,
        0,
        0,
      );

      //console.log(today.toLocaleDateString("sv") + ' ' + exchdate.toISOString());
      const newDate = new Date();
      newDate.setDate(today.getDate() + 1);
      const exchDate = new Date(newDate.toLocaleDateString('sv'))
/*       console.log(
        exchdate.toLocaleDateString('sv') +
          ' ' +
          newDate.toLocaleDateString('sv'),
      ); */

      /**
       * Consulta si existen tasas cargadas para la fecha valor
       */
      try {
        const currencies = await lastValueFrom(
          this.httpService.get(url).pipe(),
        );
        if (Object.keys(currencies.data).length != 0) {
          console.log(
            'Ya hay tasas cargadas para la fecha valor ' + ratesDatePart[0],
          );
          //console.log(currencies.data);
        } else {
          console.log(
            'No hay tasas cargadas para la fecha valor. Se realizara la insercion!',
          );
          if (
            exchdate.toLocaleDateString('sv') !=
            newDate.toLocaleDateString('sv')
          ) {
            eur = {
              EXGTBLID: 'VEB/EUR',
              CURNCYID: 'EUR',
              EXCHDATE: exchDate,
              TIME1: time1,
              XCHGRATE: parseFloat(eursubstr),
              EXPNDATE: expndate,
            };

            console.log(eur);

            usd = {
              EXGTBLID: 'VEB/USD',
              CURNCYID: 'USD',
              EXCHDATE: exchDate,
              TIME1: time1,
              XCHGRATE: parseFloat(usdsubstr),
              EXPNDATE: expndate,
            };

            console.log(usd);

            const ptrCalc =
              parseFloat(prtRate.replace(',', '.')) *
              parseFloat(dolarRate.replace(',', '.'));
            const ptrFinal = ptrCalc.toString().slice(0, 7);
            console.log(ptrFinal);
            ptr = {
              EXGTBLID: 'VEB/PTR',
              CURNCYID: 'PTR',
              EXCHDATE: exchDate,
              TIME1: time1,
              XCHGRATE: ptrFinal,
              EXPNDATE: expndate,
            };

            console.log(ptr);
          } else {
            eur = {
              EXGTBLID: 'VEB/EUR',
              CURNCYID: 'EUR',
              EXCHDATE: exchdate,
              TIME1: time1,
              XCHGRATE: parseFloat(eursubstr),
              EXPNDATE: expndate,
            };

            console.log(eur);

            usd = {
              EXGTBLID: 'VEB/USD',
              CURNCYID: 'USD',
              EXCHDATE: exchdate,
              TIME1: time1,
              XCHGRATE: parseFloat(usdsubstr),
              EXPNDATE: expndate,
            };

            console.log(usd);

            const ptrCalc =
              parseFloat(prtRate.replace(',', '.')) *
              parseFloat(dolarRate.replace(',', '.'));
            const ptrFinal = ptrCalc.toString().slice(0, 7);
            console.log(ptrFinal);
            ptr = {
              EXGTBLID: 'VEB/PTR',
              CURNCYID: 'PTR',
              EXCHDATE: exchdate,
              TIME1: time1,
              XCHGRATE: ptrFinal,
              EXPNDATE: expndate,
            };

            console.log(ptr);
          }
          /**
           * Inserta las tasas en la base de datos de MS Dynamics GP 2018
           * Base de Datos: DYNAMICS
           * Tabla: MC000100
           */
          try {
            const resEur = await lastValueFrom(
              this.httpService
                .post(
                  'http://10.160.10.92:3100/currency',
                  JSON.stringify(eur),
                  {
                    headers: { 'Content-Type': 'application/json' },
                  },
                )
                .pipe(
                  tap((resp) => console.log(resp)),
                  map((resp) => resp.data),
                  tap((data) => console.log(data)),
                ),
            );
          } catch (error) {
            console.log('No se pudo insertar el EUR');
            //console.log(error);
          }

          try {
            const resUsd = await lastValueFrom(
              this.httpService
                .post(
                  'http://10.160.10.92:3100/currency',
                  JSON.stringify(usd),
                  {
                    headers: { 'Content-Type': 'application/json' },
                  },
                )
                .pipe(
                  tap((resp) => console.log(resp)),
                  map((resp) => resp.data),
                  tap((data) => console.log(data)),
                ),
            );
          } catch (error) {
            console.log('No se pudo insertar el USD');
          }

          try {
            const resPtr = await lastValueFrom(
              this.httpService
                .post(
                  'http://10.160.10.92:3100/currency',
                  JSON.stringify(ptr),
                  {
                    headers: { 'Content-Type': 'application/json' },
                  },
                )
                .pipe(
                  tap((resp) => console.log(resp)),
                  map((resp) => resp.data),
                  tap((data) => console.log(data)),
                ),
            );
          } catch (error) {
            console.log('No se pudo insertar el PTR');
          }
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log('No se pudo obtener la fecha mediante scrapping');
    }
  }
}
