import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentRuleDto } from './create-assignment-rule.dto';

export class UpdateAssignmentRuleDto extends PartialType(CreateAssignmentRuleDto) {}
