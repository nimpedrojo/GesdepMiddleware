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
        stats: {
          total: {
            PJ: row.total_played,
            GA: row.total_won,
            EM: row.total_drawn,
            PE: row.total_lost,
            GF: row.total_goals_for,
            GC: row.total_goals_against,
            PTS: row.total_points
          },
          local: {
            PJ: row.home_played,
            GA: row.home_won,
            EM: row.home_drawn,
            PE: row.home_lost,
            GF: row.home_goals_for,
            GC: row.home_goals_against,
            PTS: row.home_points
          },
          visitante: {
            PJ: row.away_played,
            GA: row.away_won,
            EM: row.away_drawn,
            PE: row.away_lost,
            GF: row.away_goals_for,
            GC: row.away_goals_against,
            PTS: row.away_points
          }
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
        total_played: payload.stats.total.PJ,
        total_won: payload.stats.total.GA,
        total_drawn: payload.stats.total.EM,
        total_lost: payload.stats.total.PE,
        total_goals_for: payload.stats.total.GF,
        total_goals_against: payload.stats.total.GC,
        total_points: payload.stats.total.PTS,
        home_played: payload.stats.local.PJ,
        home_won: payload.stats.local.GA,
        home_drawn: payload.stats.local.EM,
        home_lost: payload.stats.local.PE,
        home_goals_for: payload.stats.local.GF,
        home_goals_against: payload.stats.local.GC,
        home_points: payload.stats.local.PTS,
        away_played: payload.stats.visitante.PJ,
        away_won: payload.stats.visitante.GA,
        away_drawn: payload.stats.visitante.EM,
        away_lost: payload.stats.visitante.PE,
        away_goals_for: payload.stats.visitante.GF,
        away_goals_against: payload.stats.visitante.GC,
        away_points: payload.stats.visitante.PTS,
        synced_at: syncedAt
      })
      .onConflict(['team_id', 'competition', 'result'])
      .merge({
        team_name: payload.teamName,
        total_played: payload.stats.total.PJ,
        total_won: payload.stats.total.GA,
        total_drawn: payload.stats.total.EM,
        total_lost: payload.stats.total.PE,
        total_goals_for: payload.stats.total.GF,
        total_goals_against: payload.stats.total.GC,
        total_points: payload.stats.total.PTS,
        home_played: payload.stats.local.PJ,
        home_won: payload.stats.local.GA,
        home_drawn: payload.stats.local.EM,
        home_lost: payload.stats.local.PE,
        home_goals_for: payload.stats.local.GF,
        home_goals_against: payload.stats.local.GC,
        home_points: payload.stats.local.PTS,
        away_played: payload.stats.visitante.PJ,
        away_won: payload.stats.visitante.GA,
        away_drawn: payload.stats.visitante.EM,
        away_lost: payload.stats.visitante.PE,
        away_goals_for: payload.stats.visitante.GF,
        away_goals_against: payload.stats.visitante.GC,
        away_points: payload.stats.visitante.PTS,
        synced_at: syncedAt
      });
  }
}
