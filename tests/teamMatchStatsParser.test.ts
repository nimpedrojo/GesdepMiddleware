import { describe, expect, it } from 'vitest';
import { TeamMatchStatsParser } from '../src/gesdep/parsers/teamMatchStatsParser.js';

const html = `
  <select id="ctl00_ContentPlaceHolder1_cmbEquipos">
    <option value="636" selected>JUVENIL PREFERENTE</option>
  </select>
  <select id="ctl00_ContentPlaceHolder1_cmbCompeticiones">
    <option value="0" selected>Todas</option>
  </select>
  <input type="radio" id="ctl00_ContentPlaceHolder1_verTodos" checked />
  <input type="radio" id="ctl00_ContentPlaceHolder1_verGanados" />
  <input type="radio" id="ctl00_ContentPlaceHolder1_verEmpatados" />
  <input type="radio" id="ctl00_ContentPlaceHolder1_VerPerdidos" />
  <span id="ctl00_ContentPlaceHolder1_lblEstadisticas">
    <table><tr>
      <td bgcolor="White">2</td><td bgcolor="White">1</td><td bgcolor="White">0</td><td bgcolor="White">1</td><td bgcolor="White">3</td><td bgcolor="White">3</td><td bgcolor="White">3</td>
      <td bgcolor="White">1</td><td bgcolor="White">1</td><td bgcolor="White">0</td><td bgcolor="White">0</td><td bgcolor="White">2</td><td bgcolor="White">1</td><td bgcolor="White">3</td>
      <td bgcolor="White">1</td><td bgcolor="White">0</td><td bgcolor="White">0</td><td bgcolor="White">1</td><td bgcolor="White">1</td><td bgcolor="White">2</td><td bgcolor="White">0</td>
    </tr></table>
  </span>
  <span id="ctl00_ContentPlaceHolder1_lblLista">
    <table>
      <tr onclick="document.location = &quot;frmpartidomtn.aspx?idp=M1&quot;">
        <td></td><td>JUVENIL PREFERENTE</td><td>2</td><td>1</td><td>Rival A</td><td>01/03/2026 - 16:30</td><td>Stadium</td><td>Liga</td>
      </tr>
      <tr onclick="document.location = &quot;frmpartidomtn.aspx?idp=M2&quot;">
        <td></td><td>Rival B</td><td>2</td><td>1</td><td>JUVENIL PREFERENTE</td><td>07/03/2026 - 18:30</td><td>CDM</td><td>Copa</td>
      </tr>
    </table>
  </span>
`;

describe('TeamMatchStatsParser', () => {
  it('parses summary and matches', () => {
    const parser = new TeamMatchStatsParser();
    const parsed = parser.parse(html);

    expect(parsed.teamId).toBe('636');
    expect(parsed.summary.total.played).toBe(2);
    expect(parsed.chart).toEqual({ won: 1, drawn: 0, lost: 1 });
    expect(parsed.matches).toEqual([
      expect.objectContaining({
        matchId: 'M1',
        isHome: true,
        teamScore: 2,
        opponentScore: 1,
        result: 'won',
        competition: 'league'
      }),
      expect.objectContaining({
        matchId: 'M2',
        isHome: false,
        teamScore: 1,
        opponentScore: 2,
        result: 'lost',
        competition: 'cup'
      })
    ]);
  });
});
