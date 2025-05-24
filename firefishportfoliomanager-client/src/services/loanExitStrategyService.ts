import { callApi } from './apiService';
import { GetAccessTokenFunction } from '../types';
import { components } from '../api-types';

type HodlExitStrategy = components['schemas']['HodlExitStrategy'];
type CustomLadderExitStrategy = components['schemas']['CustomLadderExitStrategy'];
type SmartDistributionExitStrategy = components['schemas']['SmartDistributionExitStrategy'];
type EquidistantLadderExitStrategy = components['schemas']['EquidistantLadderExitStrategy'];
type EquifrequentLadderExitStrategy = components['schemas']['EquifrequentLadderExitStrategy'];

type ExitStrategyUnion = 
  | HodlExitStrategy 
  | CustomLadderExitStrategy 
  | SmartDistributionExitStrategy 
  | EquidistantLadderExitStrategy 
  | EquifrequentLadderExitStrategy;

/**
 * Service pro správu exit strategií
 * Implementuje Single Responsibility Principle - zaměřuje se pouze na exit strategies
 */

/**
 * Získá exit strategii pro půjčku
 */
export const fetchExitStrategy = async (
  getAccessToken: GetAccessTokenFunction,
  loanId: number
): Promise<ExitStrategyUnion | null> => {
  try {
    return await callApi<ExitStrategyUnion>(`/api/loans/${loanId}/exitstrategy`, getAccessToken);
  } catch (error) {
    // Backend vrací 204 No Content pokud strategie neexistuje
    if ((error as any)?.status === 204) {
      return null;
    }
    throw error;
  }
};

/**
 * Nastaví exit strategii pro půjčku
 */
export const setExitStrategy = async (
  getAccessToken: GetAccessTokenFunction,
  loanId: number,
  strategy: ExitStrategyUnion
): Promise<void> => {
  await callApi<null>(`/api/loans/${loanId}/exitstrategy`, getAccessToken, {
    method: 'PUT',
    body: JSON.stringify(strategy),
  });
}; 