import { load, type CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { TeamItem } from '../../domain/types.js';
import { selectors } from '../selectors/index.js';
import { ParsingError } from '../../shared/errors.js';

const normalizeText = (value?: string) => {
  const normalized = value?.replace(/\s+/g, ' ').trim() ?? '';
  return normalized.length > 0 ? normalized : null;
};

const extractTeamIdFromHref = (href?: string | null) => {
  if (!href) {
    return null;
  }

  const match = href.match(/[?&]idequ=([^&]+)/i);
  return match?.[1] ?? null;
};

const extractSeason = (value: string | null) => {
  if (!value) {
    return null;
  }

  const match = value.match(/temporada\s+(.+)$/i);
  return match?.[1]?.trim() ?? value;
};

export class TeamsParser {
  parse(html: string): TeamItem[] {
    const $ = load(html);
    const list = $(selectors.teams.list).first();

    if (list.length === 0) {
      throw new ParsingError('Invalid teams page structure: teams list not found', {
        selector: selectors.teams.list
      });
    }

    const itemsRoot = list.find(selectors.teams.item);
    if (itemsRoot.length === 0) {
      throw new ParsingError('Invalid teams page structure: teams items not found', {
        selector: selectors.teams.item
      });
    }

    const panelTitle = normalizeText($(selectors.teams.activePanelTitle).first().text());
    const status = panelTitle?.toLowerCase().includes('activos') ? 'active' : null;
    const season = extractSeason(normalizeText($(selectors.teams.season).first().text()));
    const items: TeamItem[] = [];

    itemsRoot.each((_index, row) => {
      const link = $(row).find(selectors.teams.link).first();
      const id = extractTeamIdFromHref(link.attr('href'));
      const name = normalizeText(link.find(selectors.teams.name).first().text());

      if (!id || !name) {
        return;
      }

      items.push({
        id,
        name,
        category: null,
        season,
        status
      });
    });

    return items;
  }
}
