import { Badge } from '@/components/ui/badge';

interface RecommendationReasonProps {
  reason: string;
}

export function RecommendationReason({ reason }: RecommendationReasonProps) {
  return (
    <Badge variant="secondary" className="text-xs font-normal">
      {reason}
    </Badge>
  );
}
