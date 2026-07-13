import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { TopologyModule } from './topology/topology.module';
import { ItemsModule } from './items/items.module';
import { StockModule } from './stock/stock.module';
import { HandlingUnitsModule } from './handling-units/handling-units.module';
import { SerialNumbersModule } from './serial-numbers/serial-numbers.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    RolesModule,
    UsersModule,
    WarehousesModule,
    TopologyModule,
    ItemsModule,
    StockModule,
    HandlingUnitsModule,
    SerialNumbersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
