import { Knex } from 'knex';
import {
  MatchCompetition,
  MatchResultFilter,
  TeamMatch,
  TeamMatchStatsResponse,
  teamMatchStatsResponseSchema
} from '../../domain/types.js';
import { db } from '../knex.js';

type TeamMatchRow = {
  match_id: string;
  team_id: string;
  team_name: string;
  opponent_name: string;
  is_home: number | boolean;
  team_score: number;
  opponent_score: number;
  result: 'won' | 'drawn' | 'lost';
  competition: 'league' | 'cup' | 'friendly' | 'tournament';
  kickoff_at: string;
  venue: string | null;
};

const emptyBlock = () => ({
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0
});

const summarize = (matches: TeamMatch[]) => {
  const total = emptyBlock();
  const home = emptyBlock();
  const away = emptyBlock();

  for (const match of matches) {
    const target = match.isHome ? home : away;
    for (const block of [total, target]) {
      block.played += 1;
      block.goalsFor += match.teamScore;
      block.goalsAgainst += match.opponentScore;
      if (match.result === 'won') {
        block.won += 1;
        block.points += 3;
      } else if (match.result === 'drawn') {
        block.drawn += 1;
        block.points += 1;
      } else {
        block.lost += 1;
      }
    }
  }

  return { total, home, away };
};

export class TeamMatchStatsRepository {
  constructor(private readonly knex: Knex = db) {}

  async findTeamName(teamId: string): Promise<string | null> {
    const team = await this.knex('teams').select('name').where({ id: teamId }).first();
    return team?.name ?? null;
  }

  async get(teamId: string, competition: MatchCompetition, result: MatchResultFilter): Promise<TeamMatchStatsResponse | null> {
    const teamName = await this.findTeamName(teamId);
    if (!teamName) return null;

    let query = this.knex<TeamMatchRow>('team_matches')
      .select('*')
      .where({ team_id: teamId });

    if (competition !== 'all') {
      query = query.andWhere('competition', competition);
    }
    if (result !== 'all') {
      query = query.andWhere('result', result);
    }

    const rows = await query.orderBy('kickoff_at', 'desc');
    const matches: TeamMatch[] = rows.map((row) => ({
      matchId: row.match_id,
      teamId: row.team_id,
      teamName: row.team_name,
      opponentName: row.opponent_name,
      isHome: Boolean(row.is_home),
      teamScore: row.team_score,
      opponentScore: row.opponent_score,
      result: row.result,
      competition: row.competition,
      kickoffAt: row.kickoff_at,
      venue: row.venue
    }));

    const summary = summarize(matches);

    return teamMatchStatsResponseSchema.parse({
      item: {
        teamId,
        teamName,
        filters: { competition, result },
        summary,
        chart: {
          won: summary.total.won,
          drawn: summary.total.drawn,
          lost: summary.total.lost
        },
        matches
      },
      meta: {
        source: 'mysql'
      }
    });
  }

  async replaceAllForTeam(teamId: string, matches: TeamMatch[], syncedAt: Date): Promise<void> {
    await this.knex.transaction(async (trx) => {
      await trx('team_matches').where({ team_id: teamId }).del();
      if (matches.length === 0) return;

      await trx('team_matches').insert(
        matches.map((match) => ({
          match_id: match.matchId,
          team_id: match.teamId,
          team_name: match.teamName,
          opponent_name: match.opponentName,
          is_home: match.isHome,
          team_score: match.teamScore,
          opponent_score: match.opponentScore,
          result: match.result,
          competition: match.competition,
          kickoff_at: match.kickoffAt,
          venue: match.venue,
          synced_at: syncedAt
        }))
      );
    });
  }
}
