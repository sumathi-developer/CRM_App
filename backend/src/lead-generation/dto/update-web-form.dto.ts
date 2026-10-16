import { PartialType } from '@nestjs/swagger';
import { CreateWebFormDto } from './create-web-form.dto';

export class UpdateWebFormDto extends PartialType(CreateWebFormDto) {}
