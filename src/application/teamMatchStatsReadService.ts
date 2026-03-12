import { MatchCompetition, MatchResultFilter, TeamMatchStatsResponse } from '../domain/types.js';
import { TeamMatchStatsRepository } from '../db/repositories/teamMatchStatsRepository.js';
import { GetTeamMatchStatsUseCase } from './getTeamMatchStatsUseCase.js';
import { MemoryCache, memoryCache } from '../shared/memoryCache.js';

export interface TeamMatchStatsReadServiceDeps {
  repository?: TeamMatchStatsRepository;
  onlineUseCase?: GetTeamMatchStatsUseCase;
  cache?: MemoryCache;
}

export class TeamMatchStatsReadService {
  private readonly repository: TeamMatchStatsRepository;
  private readonly cache: MemoryCache;

  constructor(private readonly deps: TeamMatchStatsReadServiceDeps) {
    this.repository = deps.repository ?? new TeamMatchStatsRepository();
    this.cache = deps.cache ?? memoryCache;
  }

  async get(
    teamId: string,
    competition: MatchCompetition = 'all',
    result: MatchResultFilter = 'all'
  ): Promise<TeamMatchStatsResponse> {
    const cacheKey = `team-match-stats:${teamId}:${competition}:${result}`;
    return this.cache.remember(cacheKey, 300, async () => {
      const dbPayload = await this.repository.get(teamId, competition, result);
      if (dbPayload) {
        return dbPayload;
      }

      if (!this.deps.onlineUseCase) {
        throw new Error(`Team match stats ${teamId} not available`);
      }

      const teamName = await this.repository.findTeamName(teamId);
      return this.deps.onlineUseCase.execute(teamId, competition, result, teamName ?? undefined);
    });
  }
}
