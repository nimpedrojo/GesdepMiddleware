import { load } from 'cheerio';
import {
  MatchCompetition,
  MatchResultFilter,
  TeamMatch,
  TeamMatchStatsResponse,
  teamMatchStatsResponseSchema
} from '../../domain/types.js';
import { ParsingError } from '../../shared/errors.js';

const normalizeText = (value: string) => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

const competitionTextToKey = (value: string): Exclude<MatchCompetition, 'all'> => {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'liga') return 'league';
  if (normalized === 'copa') return 'cup';
  if (normalized === 'amistoso') return 'friendly';
  return 'tournament';
};

const resultFromScores = (teamScore: number, opponentScore: number): Exclude<MatchResultFilter, 'all'> => {
  if (teamScore > opponentScore) return 'won';
  if (teamScore < opponentScore) return 'lost';
  return 'drawn';
};

const parseSummaryValues = (html: string) => {
  const $ = load(html);
  const values = $('#ctl00_ContentPlaceHolder1_lblEstadisticas td[bgcolor=\"White\"], #ctl00_ContentPlaceHolder1_lblEstadisticas td[bgcolor=\"white\"]')
    .map((_index, element) => normalizeText($(element).text()))
    .get()
    .filter(Boolean)
    .map((value) => Number(value));

  if (values.length !== 21) {
    throw new ParsingError('Invalid match stats page structure: summary values not found');
  }

  const toBlock = (offset: number) => ({
    played: values[offset],
    won: values[offset + 1],
    drawn: values[offset + 2],
    lost: values[offset + 3],
    goalsFor: values[offset + 4],
    goalsAgainst: values[offset + 5],
    points: values[offset + 6]
  });

  return {
    total: toBlock(0),
    home: toBlock(7),
    away: toBlock(14)
  };
};

const extractMatchIdFromOnClick = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/[?&]idp=([^"&]+)/i);
  return match?.[1] ?? null;
};

export class TeamMatchStatsParser {
  parse(html: string): TeamMatchStatsResponse['item'] {
    const $ = load(html);
    const teamId = $('#ctl00_ContentPlaceHolder1_cmbEquipos').val()?.toString() ?? null;
    const teamName = normalizeText($('#ctl00_ContentPlaceHolder1_cmbEquipos option:selected').text()) || null;
    const competitionSelected = $('#ctl00_ContentPlaceHolder1_cmbCompeticiones').val()?.toString() ?? '0';
    const resultSelected = ($('#ctl00_ContentPlaceHolder1_verGanados').is(':checked') && 'won')
      || ($('#ctl00_ContentPlaceHolder1_verEmpatados').is(':checked') && 'drawn')
      || ($('#ctl00_ContentPlaceHolder1_VerPerdidos').is(':checked') && 'lost')
      || 'all';

    if (!teamId) {
      throw new ParsingError('Invalid match stats page structure: selected team not found');
    }

    const matches: TeamMatch[] = [];
    $('#ctl00_ContentPlaceHolder1_lblLista tr[onclick*="idp="]').each((_index, row) => {
      const cells = $(row).find('td');
      if (cells.length < 8) {
        return;
      }

      const homeOrTeam = normalizeText($(cells[1]).text());
      const leftScore = Number(normalizeText($(cells[2]).text()));
      const rightScore = Number(normalizeText($(cells[3]).text()));
      const awayOrTeam = normalizeText($(cells[4]).text());
      const kickoffAt = normalizeText($(cells[5]).text());
      const venue = normalizeText($(cells[6]).text()) || null;
      const competition = competitionTextToKey(normalizeText($(cells[7]).text()));

      const isHome = normalizeText(awayOrTeam) !== normalizeText(teamName ?? '');
      const opponentName = isHome ? awayOrTeam : homeOrTeam;
      const teamScore = isHome ? leftScore : rightScore;
      const opponentScore = isHome ? rightScore : leftScore;

      matches.push({
        matchId: extractMatchIdFromOnClick($(row).attr('onclick')) ?? `${teamId}-${kickoffAt}-${opponentName}`,
        teamId,
        teamName: teamName ?? '',
        opponentName,
        isHome,
        teamScore,
        opponentScore,
        result: resultFromScores(teamScore, opponentScore),
        competition,
        kickoffAt,
        venue
      });
    });

    const summary = parseSummaryValues(html);

    return teamMatchStatsResponseSchema.shape.item.parse({
      teamId,
      teamName,
      filters: {
        competition:
          competitionSelected === '1' ? 'league'
            : competitionSelected === '2' ? 'cup'
              : competitionSelected === '3' ? 'friendly'
                : competitionSelected === '4' ? 'tournament'
                  : 'all',
        result: resultSelected
      },
      summary,
      chart: {
        won: summary.total.won,
        drawn: summary.total.drawn,
        lost: summary.total.lost
      },
      matches
    });
  }
}
