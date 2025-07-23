import LiteratureNotes from './LiteratureNotes';
import { Route } from 'react-router-dom';

const AppRoutes = () => {
    return (
        <>
            <Route path="/literature" element={<LiteratureNotes />} />
        </>
    );
};

export default AppRoutes; 