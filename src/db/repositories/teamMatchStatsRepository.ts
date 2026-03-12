import { Knex } from 'knex';
import {
  MatchCompetition,
  MatchResultFilter,
  TeamMatchStatsResponse,
  teamMatchStatsResponseSchema
} from '../../domain/types.js';
import { db } from '../knex.js';

type SnapshotRow = {
  team_id: string;
  competition: MatchCompetition;
  result: MatchResultFilter;
  team_name: string | null;
  total_played: number;
  total_won: number;
  total_drawn: number;
  total_lost: number;
  total_goals_for: number;
  total_goals_against: number;
  total_points: number;
  home_played: number;
  home_won: number;
  home_drawn: number;
  home_lost: number;
  home_goals_for: number;
  home_goals_against: number;
  home_points: number;
  away_played: number;
  away_won: number;
  away_drawn: number;
  away_lost: number;
  away_goals_for: number;
  away_goals_against: number;
  away_points: number;
};

export class TeamMatchStatsRepository {
  constructor(private readonly knex: Knex = db) {}

  async findTeamName(teamId: string): Promise<string | null> {
    const team = await this.knex('teams').select('name').where({ id: teamId }).first();
    return team?.name ?? null;
  }

  async get(teamId: string, competition: MatchCompetition, result: MatchResultFilter): Promise<TeamMatchStatsResponse | null> {
    const row = await this.knex<SnapshotRow>('team_match_stat_snapshots')
      .select('*')
      .where({ team_id: teamId, competition, result })
      .first();

    if (!row) {
      return null;
    }

    return teamMatchStatsResponseSchema.parse({
      item: {
        teamId,
        teamName: row.team_name,
        filters: {
          competition,
          result
        },
        summary: {
          total: {
            played: row.total_played,
            won: row.total_won,
            drawn: row.total_drawn,
            lost: row.total_lost,
            goalsFor: row.total_goals_for,
            goalsAgainst: row.total_goals_against,
            points: row.total_points
          },
          home: {
            played: row.home_played,
            won: row.home_won,
            drawn: row.home_drawn,
            lost: row.home_lost,
            goalsFor: row.home_goals_for,
            goalsAgainst: row.home_goals_against,
            points: row.home_points
          },
          away: {
            played: row.away_played,
            won: row.away_won,
            drawn: row.away_drawn,
            lost: row.away_lost,
            goalsFor: row.away_goals_for,
            goalsAgainst: row.away_goals_against,
            points: row.away_points
          }
        },
        chart: {
          won: row.total_won,
          drawn: row.total_drawn,
          lost: row.total_lost
        }
      },
      meta: {
        source: 'mysql'
      }
    });
  }

  async replaceSnapshot(
    teamId: string,
    competition: MatchCompetition,
    result: MatchResultFilter,
    payload: TeamMatchStatsResponse['item'],
    syncedAt: Date
  ): Promise<void> {
    await this.knex('team_match_stat_snapshots')
      .insert({
        team_id: teamId,
        competition,
        result,
        team_name: payload.teamName,
        total_played: payload.summary.total.played,
        total_won: payload.summary.total.won,
        total_drawn: payload.summary.total.drawn,
        total_lost: payload.summary.total.lost,
        total_goals_for: payload.summary.total.goalsFor,
        total_goals_against: payload.summary.total.goalsAgainst,
        total_points: payload.summary.total.points,
        home_played: payload.summary.home.played,
        home_won: payload.summary.home.won,
        home_drawn: payload.summary.home.drawn,
        home_lost: payload.summary.home.lost,
        home_goals_for: payload.summary.home.goalsFor,
        home_goals_against: payload.summary.home.goalsAgainst,
        home_points: payload.summary.home.points,
        away_played: payload.summary.away.played,
        away_won: payload.summary.away.won,
        away_drawn: payload.summary.away.drawn,
        away_lost: payload.summary.away.lost,
        away_goals_for: payload.summary.away.goalsFor,
        away_goals_against: payload.summary.away.goalsAgainst,
        away_points: payload.summary.away.points,
        synced_at: syncedAt
      })
      .onConflict(['team_id', 'competition', 'result'])
      .merge({
        team_name: payload.teamName,
        total_played: payload.summary.total.played,
        total_won: payload.summary.total.won,
        total_drawn: payload.summary.total.drawn,
        total_lost: payload.summary.total.lost,
        total_goals_for: payload.summary.total.goalsFor,
        total_goals_against: payload.summary.total.goalsAgainst,
        total_points: payload.summary.total.points,
        home_played: payload.summary.home.played,
        home_won: payload.summary.home.won,
        home_drawn: payload.summary.home.drawn,
        home_lost: payload.summary.home.lost,
        home_goals_for: payload.summary.home.goalsFor,
        home_goals_against: payload.summary.home.goalsAgainst,
        home_points: payload.summary.home.points,
        away_played: payload.summary.away.played,
        away_won: payload.summary.away.won,
        away_drawn: payload.summary.away.drawn,
        away_lost: payload.summary.away.lost,
        away_goals_for: payload.summary.away.goalsFor,
        away_goals_against: payload.summary.away.goalsAgainst,
        away_points: payload.summary.away.points,
        synced_at: syncedAt
      });
  }
}
