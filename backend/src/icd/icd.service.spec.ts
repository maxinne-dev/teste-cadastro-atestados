import { Test } from '@nestjs/testing';
import { IcdService } from './icd.service';
import { IcdCacheService } from '../icd-cache/icd-cache.service';
import axios from 'axios';

jest.mock('axios');

describe('IcdService', () => {
  let service: IcdService;
  let cache: jest.Mocked<Partial<IcdCacheService>>;

  beforeEach(async () => {
    process.env.WHO_ICD_CLIENT_ID = 'x';
    process.env.WHO_ICD_CLIENT_SECRET = 'y';
    cache = {
      upsert: jest.fn(async () => ({}) as any),
      search: jest.fn(async () => []),
    };

    const module = await Test.createTestingModule({
      providers: [IcdService, { provide: IcdCacheService, useValue: cache }],
    }).compile();

    service = module.get(IcdService);
    (axios.post as unknown as jest.Mock).mockReset();
    (axios.get as unknown as jest.Mock).mockReset();
  });

  it('search fetches WHO results and upserts cache', async () => {
    // eslint-disable-next-line no-unexpected-multiline
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock).mockResolvedValue({
      data: {
        destinationEntities: [
          { theCode: 'J06.9', title: { '@value': 'URI, unspecified' } },
          { code: 'A00', title: 'Cholera' },
        ],
      },
    });

    const res = await service.search('chol');
    expect(res.length).toBeGreaterThanOrEqual(2);
    expect(cache.upsert).toHaveBeenCalled();
    // token cached: second call should not call axios.post again
    await service.search('cold');
    expect((axios.post as any).mock.calls.length).toBe(1);
  });

  it('fallback returns cached suggestions when WHO fails', async () => {
    // eslint-disable-next-line no-unexpected-multiline
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock).mockRejectedValue(new Error('network'));
    (cache.search as jest.Mock).mockResolvedValue([
      { code: 'B00', title: 'Herpesviral infection' },
    ]);
    const res = await service.search('herp');
    expect(res).toEqual([{ code: 'B00', title: 'Herpesviral infection' }]);
  });

  // eslint-disable-next-line no-unexpected-multiline
  it('retries once on 401 then succeeds', async () => {
    (axios.post as unknown as jest.Mock).mockResolvedValue({
      data: { access_token: 't', expires_in: 3600 },
    });
    (axios.get as unknown as jest.Mock)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({
        data: { destinationEntities: [{ code: 'A00', title: 'Cholera' }] },
      });
    const res = await service.search('cho');
    expect(res).toEqual([{ code: 'A00', title: 'Cholera' }]);
  });

  describe('CID-10 support', () => {
    const mockCremespMainTable = `
      <table>
        <tr>
          <td>F69</td>
          <td>Transtorno da personalidade e do comportamento do adulto, não especificado</td>
          <td><button onclick="carregarConteudoCid10(471)"></button></td>
        </tr>
        <tr>
          <td>F84</td>
          <td>Transtornos globais do desenvolvimento</td>
          <td><button onclick="carregarConteudoCid10(472)"></button></td>
        </tr>
        <tr>
          <td>Z99</td>
          <td>Dependência de máquinas e dispositivos capacitantes, não classificada em outra parte</td>
          <td><button onclick="carregarConteudoCid10(473)"></button></td>
        </tr>
      </table>
    `;

    const mockCremespSubCodes = `
      <table>
        <tr>
          <td>F84.0</td>
          <td>Autismo infantil</td>
        </tr>
        <tr>
          <td>F84.1</td>
          <td>Autismo atípico</td>
        </tr>
        <tr>
          <td>F84.5</td>
          <td>Síndrome de Asperger</td>
        </tr>
      </table>
    `;

    beforeEach(() => {
      // Reset mocks before each CID-10 test
      (axios.post as unknown as jest.Mock).mockReset();
      (axios.get as unknown as jest.Mock).mockReset();
    });

    it('detects CID-10 code patterns correctly', async () => {
      // Mock CREMESP main table response
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: mockCremespMainTable,
      });

      const res = await service.search('F69');
      
      expect(res).toEqual([
        { code: 'F69', title: 'Transtorno da personalidade e do comportamento do adulto, não especificado' }
      ]);
      
      // Verify it called CREMESP, not WHO ICD
      expect(axios.get).toHaveBeenCalledWith(
        'http://cremesp.org.br/resources/views/site_cid10_tabela.php',
        expect.any(Object)
      );
    });

    it('searches for sub-codes when specific code is requested', async () => {
      // Mock CREMESP main table response
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: mockCremespMainTable,
      });

      // Mock CREMESP sub-codes response
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: mockCremespSubCodes,
      });

      const res = await service.search('F84.1');
      
      expect(res).toEqual([
        { code: 'F84.1', title: 'Autismo atípico' }
      ]);
      
      // Verify it called both main table and sub-codes
      expect(axios.get).toHaveBeenCalledWith(
        'http://cremesp.org.br/resources/views/site_cid10_tabela.php',
        expect.any(Object)
      );
      expect(axios.post).toHaveBeenCalledWith(
        'http://cremesp.org.br/resources/views/site_cid10_tabela.php',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
    });

    it('returns base code when sub-code not found', async () => {
      // Mock CREMESP main table response
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: mockCremespMainTable,
      });

      // Mock CREMESP sub-codes response (empty)
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: '<table></table>',
      });

      const res = await service.search('F84.9');
      
      expect(res).toEqual([
        { code: 'F84', title: 'Transtornos globais do desenvolvimento' }
      ]);
    });

    it('validates CID-10 results with WHO ICD API when available', async () => {
      // Mock CREMESP main table response
      (axios.get as unknown as jest.Mock)
        .mockResolvedValueOnce({
          data: mockCremespMainTable,
        })
        // Mock WHO ICD validation response
        .mockResolvedValueOnce({
          data: { 
            destinationEntities: [
              { code: 'F69', title: { '@value': 'Personality disorder, unspecified' } }
            ]
          },
        });

      // Mock WHO ICD token response
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 'token', expires_in: 3600 },
      });

      const res = await service.search('F69');
      
      // Should return WHO ICD validated result
      expect(res).toEqual([
        { code: 'F69', title: 'Personality disorder, unspecified' }
      ]);

      // Should cache with cid-10 release tag
      expect(cache.upsert).toHaveBeenCalledWith(
        'F69',
        'Personality disorder, unspecified',
        'cid-10'
      );
    });

    it('falls back to CREMESP data when WHO validation fails', async () => {
      // Mock CREMESP main table response
      (axios.get as unknown as jest.Mock)
        .mockResolvedValueOnce({
          data: mockCremespMainTable,
        })
        // Mock WHO ICD validation failure
        .mockRejectedValueOnce(new Error('WHO API error'));

      // Mock WHO ICD token response
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 'token', expires_in: 3600 },
      });

      const res = await service.search('F69');
      
      // Should return original CREMESP result
      expect(res).toEqual([
        { code: 'F69', title: 'Transtorno da personalidade e do comportamento do adulto, não especificado' }
      ]);

      // Should still cache the result
      expect(cache.upsert).toHaveBeenCalledWith(
        'F69',
        'Transtorno da personalidade e do comportamento do adulto, não especificado',
        'cid-10'
      );
    });

    it('falls back to CID-11 search when CID-10 fails completely', async () => {
      // Mock CREMESP failure
      (axios.get as unknown as jest.Mock)
        .mockRejectedValueOnce(new Error('CREMESP error'))
        // Mock successful CID-11 search
        .mockResolvedValueOnce({
          data: { destinationEntities: [{ code: 'F69', title: 'Disorder' }] },
        });

      // Mock WHO ICD token response
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 'token', expires_in: 3600 },
      });

      const res = await service.search('F69');
      
      // Should return CID-11 result
      expect(res).toEqual([
        { code: 'F69', title: 'Disorder' }
      ]);
    });

    it('handles non-CID-10 patterns normally', async () => {
      // Mock successful CID-11 search for normal term
      (axios.post as unknown as jest.Mock).mockResolvedValue({
        data: { access_token: 'token', expires_in: 3600 },
      });
      (axios.get as unknown as jest.Mock).mockResolvedValue({
        data: { destinationEntities: [{ code: 'fever', title: 'Fever symptoms' }] },
      });

      const res = await service.search('fever');
      
      expect(res).toEqual([
        { code: 'fever', title: 'Fever symptoms' }
      ]);

      // Should not call CREMESP endpoints
      expect(axios.get).not.toHaveBeenCalledWith(
        'http://cremesp.org.br/resources/views/site_cid10_tabela.php',
        expect.any(Object)
      );
    });
  });
});
