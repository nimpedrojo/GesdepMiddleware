import { describe, expect, it, vi } from 'vitest';
import { TeamMatchStatsReadService } from '../src/application/teamMatchStatsReadService.js';

describe('TeamMatchStatsReadService', () => {
  it('returns mysql payload when available', async () => {
    const service = new TeamMatchStatsReadService({
      repository: {
        get: vi.fn().mockResolvedValue({
          item: {
            teamId: '636',
            teamName: 'JUVENIL PREFERENTE',
            filters: { competition: 'all', result: 'all' },
            stats: { total: {}, local: {}, visitante: {} }
          },
          meta: { source: 'mysql' as const }
        })
      } as any
    });

    await expect(service.get('636')).resolves.toMatchObject({ meta: { source: 'mysql' } });
  });

  it('falls back to gesdep when mysql is empty', async () => {
    const execute = vi.fn().mockResolvedValue({
      item: {
        teamId: '636',
        teamName: 'JUVENIL PREFERENTE',
        filters: { competition: 'league', result: 'won' },
        stats: { total: {}, local: {}, visitante: {} }
      },
      meta: { source: 'gesdep' as const }
    });
    const service = new TeamMatchStatsReadService({
      repository: {
        get: vi.fn().mockResolvedValue(null),
        findTeamName: vi.fn().mockResolvedValue('JUVENIL PREFERENTE')
      } as any,
      onlineUseCase: {
        execute
      } as any
    });

    await expect(service.get('636', 'league', 'won')).resolves.toMatchObject({ meta: { source: 'gesdep' } });
    expect(execute).toHaveBeenCalledWith('636', 'league', 'won', 'JUVENIL PREFERENTE');
  });
});
