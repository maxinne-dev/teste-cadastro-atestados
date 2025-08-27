import { Test, TestingModule } from '@nestjs/testing';
import { CremespCid10Service } from './cremesp-cid10.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CremespCid10Service', () => {
  let service: CremespCid10Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CremespCid10Service],
    }).compile();

    service = module.get<CremespCid10Service>(CremespCid10Service);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCid10Code', () => {
    const mockMainTableHtml = `
      <html>
        <body>
          <table>
            <tr>
              <td>F84</td>
              <td>Transtornos globais do desenvolvimento</td>
              <td><button onclick="carregarConteudoCid10(471)">Ver</button></td>
            </tr>
            <tr>
              <td>F90</td>
              <td>Transtornos hipercinéticos</td>
              <td><button onclick="carregarConteudoCid10(472)">Ver</button></td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const mockSubCodesHtml = `
      <html>
        <body>
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
        </body>
      </html>
    `;

    it('should validate CID-10 code and return all valid codes', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockMainTableHtml });
      mockedAxios.post.mockResolvedValueOnce({ data: mockSubCodesHtml });

      const result = await service.validateCid10Code('F84');

      expect(result).toEqual(['F84', 'F84.0', 'F84.1']);
    });

    it('should validate specific sub-code and return only that code', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockMainTableHtml });
      mockedAxios.post.mockResolvedValueOnce({ data: mockSubCodesHtml });

      const result = await service.validateCid10Code('F84.0');

      expect(result).toEqual(['F84.0']);
    });

    it('should return empty array for non-existent sub-code', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockMainTableHtml });
      mockedAxios.post.mockResolvedValueOnce({ data: mockSubCodesHtml });

      const result = await service.validateCid10Code('F84.9');

      expect(result).toEqual([]);
    });

    it('should return empty array for invalid codes', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockMainTableHtml });

      const result = await service.validateCid10Code('INVALID');

      expect(result).toEqual([]);
    });

    it('should return empty array for codes that are too short', async () => {
      const result = await service.validateCid10Code('A');

      expect(result).toEqual([]);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.validateCid10Code('F84');

      expect(result).toEqual([]);
    });

    it('should cache main table requests', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockMainTableHtml });

      await service.validateCid10Code('F84');
      await service.validateCid10Code('F90');

      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Should be cached
    });
  });

  describe('CID-10 pattern validation', () => {
    it('should validate correct CID-10 patterns', async () => {
      mockedAxios.get.mockResolvedValue({ data: '<table></table>' });

      const validCodes = ['F84', 'F84.0', 'F84.123', 'Z99', 'A00'];
      
      for (const code of validCodes) {
        const result = await service.validateCid10Code(code);
        expect(result).toBeDefined(); // Should not throw error for valid patterns
      }
    });
  });
});