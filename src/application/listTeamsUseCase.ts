import { ListTeamsResponse, listTeamsResponseSchema } from '../domain/types.js';
import { TeamsParser } from '../gesdep/parsers/teamsParser.js';
import { saveHtmlSnapshot } from '../gesdep/utils/artifacts.js';
import { ParsingError } from '../shared/errors.js';

export interface TeamsNavigator {
  fetchTeamsHtml(): Promise<string>;
}

export interface ListTeamsUseCaseDeps {
  navigator: TeamsNavigator;
  parser?: TeamsParser;
}

export class ListTeamsUseCase {
  private readonly parser: TeamsParser;

  constructor(private readonly deps: ListTeamsUseCaseDeps) {
    this.parser = deps.parser ?? new TeamsParser();
  }

  async execute(): Promise<ListTeamsResponse> {
    const html = await this.deps.navigator.fetchTeamsHtml();

    try {
      const items = this.parser.parse(html);
      return listTeamsResponseSchema.parse({
        items,
        meta: {
          source: 'gesdep',
          count: items.length
        }
      });
    } catch (error) {
      if (error instanceof ParsingError) {
        const snapshotPath = await saveHtmlSnapshot(html, 'teams-parse-failed');
        error.context = { ...error.context, snapshotPath };
      }

      throw error;
    }
  }
}
