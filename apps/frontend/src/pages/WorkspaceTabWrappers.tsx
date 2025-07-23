import React from 'react';
import Protocols from './Protocols';
import Recipes from './Recipes';
import PDFs from './PDFs';
import Projects from './Projects';
import Tables from './Tables';
import Database from './Database';
import LiteratureNotes from './LiteratureNotes';

// Protocols wrapper
export const ProtocolsTabWrapper: React.FC = () => (
    <Protocols onOpenProtocolTab={() => { }} openTabs={[]} />
);

// Recipes wrapper (add props if needed)
export const RecipesTabWrapper: React.FC = () => <Recipes />;

// PDFs wrapper (add props if needed)
export const PDFsTabWrapper: React.FC = () => <PDFs />;

// Projects wrapper (add props if needed)
export const ProjectsTabWrapper: React.FC = () => <Projects />;

// Tables wrapper (add props if needed)
export const TablesTabWrapper: React.FC = () => <Tables />;

// Database wrapper (add props if needed)
export const DatabaseTabWrapper: React.FC = () => <Database />;

export const LiteratureNotesTabWrapper: React.FC = () => <LiteratureNotes />; 