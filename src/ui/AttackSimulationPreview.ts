import type { FoundryAttackSimulationModel } from './FoundryPresentation';
import { createShipPreviewElement, type ShipPreviewModel } from './ShipPreview';
import { isPhaseProjectile } from '../game/PhaseProjectile';

export interface AttackSimulationPreviewOptions {
  readonly previewModel: ShipPreviewModel;
  readonly shipRadius: number;
  readonly simulation: FoundryAttackSimulationModel;
  readonly testId: string;
  readonly projectileLayerTestId?: string;
  readonly projectileTestId?: string;
  readonly className?: string;
  readonly liveLabel?: string;
}

export function createAttackSimulationPreviewElement(
  ownerDocument: Document,
  options: AttackSimulationPreviewOptions
): HTMLElement {
  const { previewModel, simulation } = options;
  const previewFrame = ownerDocument.createElement('div');
  previewFrame.className = [
    'ship-preview-frame',
    'ship-preview-frame-hero',
    'attack-simulation-preview',
    options.className
  ]
    .filter((className): className is string => Boolean(className))
    .join(' ');
  previewFrame.dataset.testid = options.testId;
  previewFrame.style.setProperty('--ship-primary', previewModel.primaryColor);
  previewFrame.style.setProperty('--ship-secondary', previewModel.secondaryColor);
  previewFrame.style.setProperty('--ship-trim', previewModel.trimColor);
  previewFrame.style.setProperty('--ship-engine', previewModel.engineColor);
  previewFrame.style.setProperty(
    '--attack-camera-aspect',
    `${simulation.cameraWidth} / ${simulation.cameraHeight}`
  );
  previewFrame.style.setProperty(
    '--attack-ship-frame-width',
    `${((options.shipRadius * 5) / simulation.cameraWidth) * 100}%`
  );
  previewFrame.dataset.cameraWidth = String(simulation.cameraWidth);
  previewFrame.dataset.cameraHeight = String(simulation.cameraHeight);
  previewFrame.dataset.shipRadius = String(options.shipRadius);
  previewFrame.setAttribute('role', 'group');
  previewFrame.setAttribute('aria-label', simulation.ariaLabel);

  const projectileLayer = ownerDocument.createElement('div');
  projectileLayer.className = 'attack-simulation-projectile-layer';
  if (options.projectileLayerTestId) {
    projectileLayer.dataset.testid = options.projectileLayerTestId;
  }
  projectileLayer.dataset.volleySize = String(simulation.volleySize);
  projectileLayer.dataset.fireCooldown = String(simulation.fireCooldownSeconds);
  projectileLayer.setAttribute('aria-hidden', 'true');

  for (const projectile of simulation.projectiles) {
    const shot = ownerDocument.createElement('span');
    shot.className = 'attack-simulation-projectile';
    if (projectile.waveIndex > 0) shot.classList.add('attack-simulation-projectile-echo');
    if (options.projectileTestId) shot.dataset.testid = options.projectileTestId;
    shot.dataset.projectileIndex = String(projectile.projectileIndex);
    shot.dataset.waveIndex = String(projectile.waveIndex);
    shot.dataset.velocity = `${projectile.vx},${projectile.vy}`;
    shot.dataset.damage = String(projectile.damage);
    shot.dataset.radius = String(projectile.radius);
    shot.dataset.ttl = String(projectile.ttl);
    shot.dataset.tags = projectile.tags.join(' ');
    shot.dataset.flightKind = projectile.flightKind;
    shot.style.setProperty('--shot-start-x', `${projectile.startXPercent}%`);
    shot.style.setProperty('--shot-end-x', `${projectile.endXPercent}%`);
    shot.style.setProperty('--shot-end-rise', `${projectile.endRisePercent}%`);
    shot.style.setProperty('--shot-rest-x', `${projectile.restXPercent}%`);
    shot.style.setProperty('--shot-rest-rise', `${projectile.restRisePercent}%`);
    shot.style.setProperty('--shot-performance-x', `${projectile.performanceXPercent}%`);
    shot.style.setProperty('--shot-performance-rise', `${projectile.performanceRisePercent}%`);
    shot.style.setProperty('--shot-size', `${projectile.displayDiameterPercent}%`);
    shot.style.setProperty('--shot-heading', `${projectile.headingDegrees}deg`);
    shot.style.setProperty('--shot-duration', `${projectile.durationSeconds}s`);
    shot.style.setProperty('--shot-delay', `${projectile.delaySeconds}s`);
    if (isPhaseProjectile(projectile.tags)) {
      shot.classList.add('attack-simulation-projectile-phase');
      const phaseShell = ownerDocument.createElement('span');
      phaseShell.className = 'attack-simulation-phase-shell';
      phaseShell.setAttribute('aria-hidden', 'true');
      shot.append(phaseShell);
    }
    projectileLayer.append(shot);
  }

  const targeting = ownerDocument.createElement('span');
  targeting.className = 'attack-simulation-target-reticle';
  targeting.setAttribute('aria-hidden', 'true');

  const liveFire = ownerDocument.createElement('span');
  liveFire.className = 'attack-simulation-live-label';
  liveFire.textContent = options.liveLabel ?? 'LIVE FIRE';
  liveFire.setAttribute('aria-hidden', 'true');

  previewFrame.append(
    projectileLayer,
    createShipPreviewElement(ownerDocument, previewModel, { mode: 'combat' }),
    targeting,
    liveFire
  );
  return previewFrame;
}
