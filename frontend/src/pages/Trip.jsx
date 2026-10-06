import { Map } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

// Placeholder until the trip view lands with the Gemma integration.
export default function Trip() {
  return (
    <EmptyState icon={Map} title="Your trip will appear here" action={<ButtonLink to="/plan">Plan a trip</ButtonLink>}>
      Day-by-day plans, budget breakdowns and reshaping arrive with the Gemma integration.
    </EmptyState>
  );
}
