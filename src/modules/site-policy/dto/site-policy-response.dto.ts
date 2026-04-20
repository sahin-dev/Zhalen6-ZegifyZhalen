import { PolicyType } from './create-site-policy.dto';

export class SitePolicyResponseDto {
  id: string;
  type: PolicyType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
