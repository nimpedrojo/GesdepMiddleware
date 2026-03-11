import { describe, expect, it, vi } from 'vitest';
import { ListTeamsUseCase } from '../src/application/listTeamsUseCase.js';
import { TeamsNavigator } from '../src/application/listTeamsUseCase.js';

const mockedHtml = `
  <span id="ctl00_lblTemporada">STADIUM VENECIA TEMPORADA 2025-26</span>
  <span id="ctl00_ContentPlaceHolder1_lblEquipos">Equipos activos</span>
  <span id="ctl00_ContentPlaceHolder1_lblListaEqui">
    <div>
      <a href="frmequipos.aspx?idequ=TEAM-10">
        <table>
          <tr>
            <td>Cadete A</td>
            <td align="right">CDA</td>
          </tr>
        </table>
      </a>
    </div>
  </span>
`;

describe('ListTeamsUseCase', () => {
  it('returns normalized teams payload from navigator HTML', async () => {
    const navigator: TeamsNavigator = {
      fetchTeamsHtml: vi.fn().mockResolvedValue(mockedHtml)
    };

    const useCase = new ListTeamsUseCase({ navigator });
    await expect(useCase.execute()).resolves.toEqual({
      items: [
        {
          id: 'TEAM-10',
          name: 'Cadete A',
          category: null,
          season: '2025-26',
          status: 'active'
        }
      ],
      meta: {
        source: 'gesdep',
        count: 1
      }
    });
  });
});
