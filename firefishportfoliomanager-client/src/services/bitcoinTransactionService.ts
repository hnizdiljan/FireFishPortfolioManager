import { components } from '../api-types';
import { apiConfig } from '../authConfig';

type BitcoinTransactionDetails = components['schemas']['BitcoinTransactionDetails'];

export const bitcoinTransactionService = {
  /**
   * Načte bitcoinové transakční detaily podle Transaction ID
   */
  async getBitcoinTransactionDetails(
    txId: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<BitcoinTransactionDetails> {
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('Nepodařilo se získat autentizační token');
    }
    
    const response = await fetch(`${apiConfig.baseUrl}/api/Loans/bitcoin-transaction/${encodeURIComponent(txId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 400) {
        throw new Error(errorText || 'Neplatné Transaction ID nebo transakce nebyla nalezena');
      } else if (response.status === 401) {
        throw new Error('Nejste autorizováni pro přístup k této funkci');
      } else if (response.status === 404) {
        throw new Error('Transakce s tímto ID nebyla nalezena');
      } else {
        throw new Error(`Chyba při načítání transakčních detailů: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  }
}; 