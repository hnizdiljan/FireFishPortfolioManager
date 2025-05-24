import React from 'react';
import { ExitStrategyType } from '@/types';
import { BaseStrategyEditor, StrategyEditorProps } from './BaseStrategyEditor';
import { HodlStrategyEditor } from './HodlStrategyEditor';
import { CustomLadderStrategyEditor } from './CustomLadderStrategyEditor';
import { SmartDistributionStrategyEditor } from './SmartDistributionStrategyEditor';
import { EquidistantLadderStrategyEditor } from './EquidistantLadderStrategyEditor';
import { EquifrequentLadderStrategyEditor } from './EquifrequentLadderStrategyEditor';

export interface StrategyTypeInfo {
  type: ExitStrategyType;
  label: string;
  description: string;
}

export class StrategyEditorFactory {
  private static readonly strategyTypes: StrategyTypeInfo[] = [
    {
      type: 'HODL',
      label: 'HODL (držet do splatnosti)',
      description: 'Při splatnosti se prodá potřebné množství BTC na splacení půjčky. Nejjednodušší strategie bez automatického prodeje v průběhu.'
    },
    {
      type: 'CustomLadder',
      label: 'Custom Ladder (vlastní žebřík)',
      description: 'Uživatel si nastaví jednotlivé prodejní úrovně (cenu a procento BTC k prodeji). Vhodné pro pokročilé uživatele.'
    },
    {
      type: 'SmartDistribution',
      label: 'Smart Distribution (chytrá distribuce)',
      description: 'Automaticky rozdělí prodej BTC podle cílového zisku vůči částce ke splacení a preference poměru BTC/CZK profitu.'
    },
    {
      type: 'EquidistantLadder',
      label: 'Equidistant Ladder (ekvidistanční žebřík)',
      description: 'Automaticky vytvoří žebřík s rovnoměrně rozloženými cenami mezi počáteční a konečnou cenou. Můžete zvolit způsob distribuce BTC.'
    },
    {
      type: 'EquifrequentLadder',
      label: 'Equifrequent Ladder (ekvifrekvenční žebřík)',
      description: 'Žebřík s intervaly čekajícími na určité procento nárůstu. Každá úroveň je o zadané procento vyšší než předchozí.'
    }
  ];

  /**
   * Získá seznam všech dostupných typů strategií
   */
  static getAvailableStrategyTypes(): StrategyTypeInfo[] {
    return [...this.strategyTypes];
  }

  /**
   * Získá informace o konkrétním typu strategie
   */
  static getStrategyTypeInfo(type: ExitStrategyType): StrategyTypeInfo | undefined {
    return this.strategyTypes.find(s => s.type === type);
  }

  /**
   * Vytvoří editor pro daný typ strategie
   */
  static createEditor(type: ExitStrategyType, props: StrategyEditorProps): React.ReactElement<StrategyEditorProps> {
    switch (type) {
      case 'HODL':
        return React.createElement(HodlStrategyEditor, props);
      case 'CustomLadder':
        return React.createElement(CustomLadderStrategyEditor, props);
      case 'SmartDistribution':
        return React.createElement(SmartDistributionStrategyEditor, props);
      case 'EquidistantLadder':
        return React.createElement(EquidistantLadderStrategyEditor, props);
      case 'EquifrequentLadder':
        return React.createElement(EquifrequentLadderStrategyEditor, props);
      default:
        throw new Error(`Unsupported strategy type: ${type}`);
    }
  }

  /**
   * Vytvoří instanci editoru pro daný typ strategie (pro přímé použití)
   */
  static createEditorInstance(type: ExitStrategyType): BaseStrategyEditor {
    switch (type) {
      case 'HODL':
        return new HodlStrategyEditor({});
      case 'CustomLadder':
        return new CustomLadderStrategyEditor({});
      case 'SmartDistribution':
        return new SmartDistributionStrategyEditor({});
      case 'EquidistantLadder':
        return new EquidistantLadderStrategyEditor({});
      case 'EquifrequentLadder':
        return new EquifrequentLadderStrategyEditor({});
      default:
        throw new Error(`Unsupported strategy type: ${type}`);
    }
  }

  /**
   * Ověří, zda je daný typ strategie podporován
   */
  static isStrategySupported(type: string): type is ExitStrategyType {
    return this.strategyTypes.some(s => s.type === type);
  }

  /**
   * Deserializuje strategii z API podle jejího typu
   */
  static deserializeFromApi(apiValue: any): any {
    if (!apiValue || !apiValue.type) {
      return null;
    }

    const strategyType = apiValue.type || apiValue.Type;
    if (!this.isStrategySupported(strategyType)) {
      throw new Error(`Unsupported strategy type: ${strategyType}`);
    }

    const editorInstance = this.createEditorInstance(strategyType);
    return editorInstance.deserializeFromApi(apiValue);
  }

  /**
   * Serializuje strategii pro API
   */
  static serializeForApi(strategyType: ExitStrategyType, value: any): any {
    if (!this.isStrategySupported(strategyType)) {
      throw new Error(`Unsupported strategy type: ${strategyType}`);
    }

    const editorInstance = this.createEditorInstance(strategyType);
    return editorInstance.serializeForApi(value);
  }

  /**
   * Validuje strategii
   */
  static validateStrategy(strategyType: ExitStrategyType, value: any): { isValid: boolean; errors: Record<string, string> } {
    if (!this.isStrategySupported(strategyType)) {
      return {
        isValid: false,
        errors: { type: `Unsupported strategy type: ${strategyType}` }
      };
    }

    const editorInstance = this.createEditorInstance(strategyType);
    return editorInstance.validateStrategy(value);
  }

  /**
   * Vytvoří výchozí hodnotu pro daný typ strategie
   */
  static createDefaultValue(strategyType: ExitStrategyType): any {
    if (!this.isStrategySupported(strategyType)) {
      throw new Error(`Unsupported strategy type: ${strategyType}`);
    }

    const editorInstance = this.createEditorInstance(strategyType);
    return editorInstance.createDefaultValue();
  }
} 