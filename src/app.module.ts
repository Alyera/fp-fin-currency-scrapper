import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CurrencyScrapperService } from './currency-scrapper/currency-scrapper.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ScheduleModule.forRoot(), HttpModule],
  controllers: [AppController],
  providers: [AppService, CurrencyScrapperService, PrismaService],
})
export class AppModule {}
