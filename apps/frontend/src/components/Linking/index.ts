// Barrel exports for Linking components

export { 
  LinkingComponent,
  NoteLinkingComponent,
  ProjectLinkingComponent,
  ProtocolLinkingComponent,
  RecipeLinkingComponent,
  PDFLinkingComponent,
  DatabaseEntryLinkingComponent,
  TaskLinkingComponent
} from './LinkingComponent';

export {
  ProjectLinkingExample,
  CustomProtocolLinkingExample,
  ExperimentLinkingExample,
  NoteLinkingExample,
  CompactLinkingExample
} from './ExampleUsage';

export { useLinking } from '../../hooks/useLinking';
export type { 
  EntityType,
  BaseEntity,
  Link,
  LinkingConfig,
  LinkingState,
  LinkingActions,
  LinkingComponentProps
} from '../../types/linking'; 