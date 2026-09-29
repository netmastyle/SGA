import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Public } from '../common/decorators/public.decorator';

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  get() {
    return {
      status: 'ok',
      service: 'sga-api',
      version: readPackageVersion(),
    };
  }
}
