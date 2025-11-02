import { Execution, Game, Player, Unit, UnitType } from "../game/Game";
import { TileRef } from "../game/GameMap";

export class RecruitmentCenterExecution implements Execution {
  private mg: Game;
  private structure: Unit | null = null;
  private active = true;

  constructor(
    private player: Player,
    private tile: TileRef,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (this.structure === null) {
      const spawnTile = this.player.canBuild(
        UnitType.RecruitmentCenter,
        this.tile,
      );
      if (spawnTile === false) {
        console.warn("cannot build recruitment center");
        this.active = false;
        return;
      }
      this.structure = this.player.buildUnit(
        UnitType.RecruitmentCenter,
        spawnTile,
        {},
      );
    }

    if (!this.structure.isActive()) {
      this.active = false;
      return;
    }

    if (this.player !== this.structure.owner()) {
      this.player = this.structure.owner();
    }
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}
