import { hydrateRoot } from 'react-dom/client';
import { DesignPreview } from './DesignPreview';

hydrateRoot(document.getElementById('root')!, <DesignPreview currentPath={location.pathname} scenario={new URLSearchParams(location.search).get('scenario') ?? undefined} />);
