import { MapPinOff } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export default function NotFound() {
  return (
    <EmptyState icon={MapPinOff} title="Off the map" action={<ButtonLink to="/">Back to home</ButtonLink>}>
      We couldn't find that page.
    </EmptyState>
  );
}
