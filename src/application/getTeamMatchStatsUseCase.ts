import {
  MatchCompetition,
  MatchResultFilter,
  TeamMatchStatsResponse,
  teamMatchStatsResponseSchema
} from '../domain/types.js';
import { TeamMatchStatsParser } from '../gesdep/parsers/teamMatchStatsParser.js';
import { saveHtmlSnapshot } from '../gesdep/utils/artifacts.js';

export interface TeamMatchStatsNavigator {
  fetchTeamMatchStatsHtml(
    teamId: string,
    competition: MatchCompetition,
    result: MatchResultFilter,
    teamName?: string
  ): Promise<string>;
}

export interface GetTeamMatchStatsUseCaseDeps {
  navigator: TeamMatchStatsNavigator;
  parser?: TeamMatchStatsParser;
}

export class GetTeamMatchStatsUseCase {
  private readonly parser: TeamMatchStatsParser;

  constructor(private readonly deps: GetTeamMatchStatsUseCaseDeps) {
    this.parser = deps.parser ?? new TeamMatchStatsParser();
  }

  async execute(
    teamId: string,
    competition: MatchCompetition = 'all',
    result: MatchResultFilter = 'all',
    teamName?: string
  ): Promise<TeamMatchStatsResponse> {
    const html = await this.deps.navigator.fetchTeamMatchStatsHtml(teamId, competition, result, teamName);

    try {
      return teamMatchStatsResponseSchema.parse({
        item: this.parser.parse(html),
        meta: {
          source: 'gesdep'
        }
      });
    } catch (error) {
      const snapshotPath = await saveHtmlSnapshot(html, 'team-match-stats-parse-failed');
      if (error instanceof Error) {
        error.message = `${error.message}. HTML snapshot saved at ${snapshotPath}`;
      }
      throw error;
    }
  }
}
