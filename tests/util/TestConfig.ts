import { NukeMagnitude } from "../../src/core/configuration/Config";
import { DefaultConfig } from "../../src/core/configuration/DefaultConfig";
import {
  Game,
  Player,
  TerraNullius,
  Tick,
  UnitType,
} from "../../src/core/game/Game";
import { TileRef } from "../../src/core/game/GameMap";

export class TestConfig extends DefaultConfig {
  private _proximityBonusPortsNb: number = 0;
  private _defaultNukeSpeed: number = 4;
  private _hamletHoldDurationTicks?: Tick;
  private _hamletCheckIntervalTicks?: Tick;
  private _hamletChecksPerInterval?: number;

  samHittingChance(): number {
    return 1;
  }

  radiusPortSpawn(): number {
    return 1;
  }

  proximityBonusPortsNb(totalPorts: number): number {
    return this._proximityBonusPortsNb;
  }

  // Specific to TestConfig
  setProximityBonusPortsNb(nb: number): void {
    this._proximityBonusPortsNb = nb;
  }

  nukeMagnitudes(_: UnitType): NukeMagnitude {
    return { inner: 1, outer: 1 };
  }

  setDefaultNukeSpeed(speed: number): void {
    this._defaultNukeSpeed = speed;
  }

  defaultNukeSpeed(): number {
    return this._defaultNukeSpeed;
  }

  defaultNukeTargetableRange(): number {
    return 20;
  }

  defaultSamRange(): number {
    return 20;
  }

  hamletHoldDurationTicks(): Tick {
    return this._hamletHoldDurationTicks ?? super.hamletHoldDurationTicks();
  }

  setHamletHoldDurationTicks(ticks: Tick): void {
    this._hamletHoldDurationTicks = ticks;
  }

  hamletCheckIntervalTicks(): Tick {
    return this._hamletCheckIntervalTicks ?? super.hamletCheckIntervalTicks();
  }

  setHamletCheckIntervalTicks(ticks: Tick): void {
    this._hamletCheckIntervalTicks = ticks;
  }

  hamletChecksPerInterval(): number {
    return this._hamletChecksPerInterval ?? super.hamletChecksPerInterval();
  }

  setHamletChecksPerInterval(checks: number): void {
    this._hamletChecksPerInterval = checks;
  }

  spawnImmunityDuration(): Tick {
    return 0;
  }

  attackLogic(
    gm: Game,
    attackTroops: number,
    attacker: Player,
    defender: Player | TerraNullius,
    tileToConquer: TileRef,
  ): {
    attackerTroopLoss: number;
    defenderTroopLoss: number;
    tilesPerTickUsed: number;
  } {
    return { attackerTroopLoss: 1, defenderTroopLoss: 1, tilesPerTickUsed: 1 };
  }

  attackTilesPerTick(
    attackTroops: number,
    attacker: Player,
    defender: Player | TerraNullius,
    numAdjacentTilesWithEnemy: number,
  ): number {
    return 1;
  }
}
