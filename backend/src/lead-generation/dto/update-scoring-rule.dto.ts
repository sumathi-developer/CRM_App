import { PartialType } from '@nestjs/swagger';
import { CreateScoringRuleDto } from './create-scoring-rule.dto';

export class UpdateScoringRuleDto extends PartialType(CreateScoringRuleDto) {}
