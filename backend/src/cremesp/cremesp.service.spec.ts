import { Test } from '@nestjs/testing';
import { CremespService } from './cremesp.service';
import axios from 'axios';

jest.mock('axios');

describe('CremespService', () => {
  let service: CremespService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CremespService],
    }).compile();

    service = module.get<CremespService>(CremespService);
    jest.clearAllMocks();
  });

  describe('searchCid10', () => {
    const mockMainTableHtml = `
      <table>
        <tr>
          <td>F84</td>
          <td>Transtornos globais do desenvolvimento</td>
          <td><button onclick="carregarConteudoCid10(123)">Ver sub-itens</button></td>
        </tr>
        <tr>
          <td>Z99</td>
          <td>Dependência de máquinas e dispositivos capacitantes</td>
          <td><button onclick="carregarConteudoCid10(456)">Ver sub-itens</button></td>
        </tr>
      </table>
    `;

    const mockSubItemsHtml = `
      <table>
        <tr>
          <td>F84.0</td>
          <td>Autismo infantil</td>
        </tr>
        <tr>
          <td>F84.1</td>
          <td>Autismo atípico</td>
        </tr>
      </table>
    `;

    it('should return empty array for short queries', async () => {
      const result = await service.searchCid10('F');
      expect(result).toEqual([]);
    });

    it('should find exact three-character code in main table', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockMainTableHtml });

      const result = await service.searchCid10('F84');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: 'F84',
        description: 'Transtornos globais do desenvolvimento',
        internalId: '123',
      });
    });

    it('should find sub-items for codes with dots', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockMainTableHtml });
      mockedAxios.post.mockResolvedValue({ data: mockSubItemsHtml });

      const result = await service.searchCid10('F84.1');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: 'F84.1',
        description: 'Autismo atípico',
      });
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://cremesp.org.br/resources/views/site_cid10_tabela.php',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
    });

    it('should search descriptions for non-conforming queries', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockMainTableHtml });

      const result = await service.searchCid10('autismo');
      
      expect(result).toHaveLength(0); // No match in main table descriptions
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.searchCid10('F84');
      
      expect(result).toEqual([]);
    });

    it('should cache main table results', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockMainTableHtml });

      // First call
      await service.searchCid10('F84');
      // Second call
      await service.searchCid10('Z99');

      // Should only call axios.get once due to caching
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });
});