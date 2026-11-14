import { exampleStudent } from '../../../data/examples';
import { ProfilePreview } from './ProfilePreview';
import '../../../styles/tokens.css';
import '../../../styles/components.css';
import './profile.css';

export default function ProfilePage() {
  return <ProfilePreview initialProfile={exampleStudent} />;
}
