import { PartialType } from '@nestjs/swagger';
import { CreateDocPageDto } from './create-doc-page.dto';

export class UpdateDocPageDto extends PartialType(CreateDocPageDto) {}
