import { PartialType } from '@nestjs/swagger';
import { CreateDocCategoryDto } from './create-doc-category.dto';

export class UpdateDocCategoryDto extends PartialType(CreateDocCategoryDto) {}
