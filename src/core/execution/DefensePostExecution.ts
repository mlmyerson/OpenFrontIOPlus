import { Execution, Game, Player, Unit, UnitType } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { GameUpdateType } from "../game/GameUpdates";
import { PseudoRandom } from "../PseudoRandom";

export class DefensePostExecution implements Execution {
  private mg: Game;
  private post: Unit | null = null;
  private active: boolean = true;
  private lastTroopDrainTick = 0;
  private random: PseudoRandom | null = null;

  constructor(
    private player: Player,
    private tile: TileRef,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.random = new PseudoRandom(mg.ticks() ^ this.tile);
    this.lastTroopDrainTick = ticks;
  }

  tick(ticks: number): void {
    if (this.post === null) {
      const spawnTile = this.player.canBuild(UnitType.DefensePost, this.tile);
      if (spawnTile === false) {
        console.warn("cannot build Defense Post");
        this.active = false;
        return;
      }
      this.post = this.player.buildUnit(UnitType.DefensePost, spawnTile, {});
    }
    if (!this.post.isActive()) {
      this.active = false;
      return;
    }

    if (this.player !== this.post.owner()) {
      this.player = this.post.owner();
    }

    this.tryTroopDrain();
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  private tryTroopDrain(): void {
    if (this.post === null || this.random === null) {
      return;
    }

    const cooldown = this.mg.config().defensePostShellAttackRate();
    if (this.mg.ticks() - this.lastTroopDrainTick < cooldown) {
      return;
    }

    const targetTile = this.pickEnemyTile();
    if (targetTile === null) {
      return;
    }

    const targetOwner = this.mg.owner(targetTile);
    if (!targetOwner.isPlayer()) {
      return;
    }

    const percent = this.mg.config().defensePostTroopDrainPercent();
    const minDrain = this.mg.config().defensePostTroopDrainMinimum();

    let drainAmount = Math.floor(targetOwner.troops() * percent);
    drainAmount = Math.max(drainAmount, minDrain);
    drainAmount = Math.min(drainAmount, targetOwner.troops());

    if (drainAmount <= 0) {
      this.lastTroopDrainTick = this.mg.ticks();
      return;
    }

    const removed = targetOwner.removeTroops(drainAmount);

    this.lastTroopDrainTick = this.mg.ticks();

    if (removed <= 0) {
      return;
    }

    this.mg.addUpdate({
      type: GameUpdateType.DefensePostTracer,
      origin: this.post.tile(),
      target: targetTile,
    });
  }

  private pickEnemyTile(): TileRef | null {
    if (this.post === null || this.random === null) {
      return null;
    }

    const range = this.mg.config().defensePostTargettingRange();
    const postTile = this.post.tile();
    const centerX = this.mg.x(postTile);
    const centerY = this.mg.y(postTile);
    const owner = this.post.owner();

    const candidates: TileRef[] = [];

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        if (Math.abs(dx) + Math.abs(dy) > range) {
          continue;
        }
        const x = centerX + dx;
        const y = centerY + dy;
        if (!this.mg.isValidCoord(x, y)) {
          continue;
        }
        const tile = this.mg.ref(x, y);
        if (!this.mg.hasOwner(tile) || !this.mg.isLand(tile)) {
          continue;
        }
        const tileOwner = this.mg.owner(tile);
        if (!tileOwner.isPlayer()) {
          continue;
        }
        if (tileOwner === owner || owner.isFriendly(tileOwner)) {
          continue;
        }
        candidates.push(tile);
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    const index = this.random.nextInt(0, candidates.length);
    return candidates[index];
  }
}
