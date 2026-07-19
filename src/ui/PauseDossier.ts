export interface PauseDossierMetric {
  readonly label: string;
  readonly value: string;
  readonly tone?: 'standard' | 'good' | 'warning';
}

export interface PauseDossierEntry {
  readonly label: string;
  readonly value: string;
  readonly tone?: 'standard' | 'warning';
}

export interface PauseDossierSection {
  readonly id: 'operation' | 'sector' | 'ship' | 'ledger';
  readonly eyebrow: string;
  readonly title: string;
  readonly entries: readonly PauseDossierEntry[];
}

export interface GameplayPauseDossier {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly metrics: readonly PauseDossierMetric[];
  readonly sections: readonly PauseDossierSection[];
}
