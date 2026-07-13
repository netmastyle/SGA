import { IsIn } from 'class-validator';
import { SerialNumberStatus } from '../../common/enums';

export class UpdateSerialNumberStatusDto {
  @IsIn(SerialNumberStatus)
  status: (typeof SerialNumberStatus)[number];
}
