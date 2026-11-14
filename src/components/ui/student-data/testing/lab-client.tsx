import { hydrateRoot } from 'react-dom/client';import { AdapterLab } from './AdapterLab';
hydrateRoot(document.getElementById('root')!,<AdapterLab initialStudent={document.documentElement.dataset.labStudent==='b'?'b':'a'}/>);
