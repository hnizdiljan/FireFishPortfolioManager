// Refaktorované komponenty pro editaci exit strategií
// Implementují Strategy Pattern a Factory Pattern pro lepší rozšiřitelnost

export { BaseStrategyEditor } from './BaseStrategyEditor';
export type { StrategyEditorProps, StrategyValidationResult } from './BaseStrategyEditor';

export { HodlStrategyEditor } from './HodlStrategyEditor';
export { CustomLadderStrategyEditor } from './CustomLadderStrategyEditor';
export { SmartDistributionStrategyEditor } from './SmartDistributionStrategyEditor';
export { EquidistantLadderStrategyEditor } from './EquidistantLadderStrategyEditor';
export { EquifrequentLadderStrategyEditor } from './EquifrequentLadderStrategyEditor';

export { StrategyEditorFactory } from './StrategyEditorFactory';
export type { StrategyTypeInfo } from './StrategyEditorFactory';

export { default as RefactoredExitStrategyForm } from './RefactoredExitStrategyForm'; 