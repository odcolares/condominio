export type TenantSlug = 'condominio' | 'predio' | 'residencial';

// Base configuration for each tenant
export interface TenantConfig {
  slug: TenantSlug;
  name: string;
  seed_prng: number; // Seed para reproducibilidade
  blocos: string[];
  unidades: number;
  vagas: number;
  registros: {
    visitantes: number;
    acessos: number;
    encomendas: number;
    ocorrencias: number;
    restricoes: number;
    reservas: number;
    comunicados: number;
    notificacoes: number;
    preautorizacoes: number;
  };
}

// Tenant configurations - one per tenant
export const TENANTS: TenantConfig[] = [
  {
    slug: 'condominio',
    name: 'Condominio Principal',
    seed_prng: 12345,
    blocos: ['A', 'B', 'C', 'D', 'E'],
    unidades: 50,
    vagas: 80,
    registros: {
      visitantes: 20,
      acessos: 100,
      encomendas: 15,
      ocorrencias: 8,
      restricoes: 5,
      reservas: 12,
      comunicados: 6,
      notificacoes: 20,
      preautorizacoes: 8,
    },
  },
];

// Função para definir o schema ativo no banco (para future Supabase integration)
export function setSearchPath(schema: string): Promise<void> {
  // TODO: Implementar quando integrar com Supabase
  // await supabase.rpc('set_config', { key: 'search_path', value: schema });
  return Promise.resolve();
}