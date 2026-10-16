import { PartialType } from '@nestjs/swagger';
import { CreateQualificationRuleDto } from './create-qualification-rule.dto';

export class UpdateQualificationRuleDto extends PartialType(CreateQualificationRuleDto) {}
