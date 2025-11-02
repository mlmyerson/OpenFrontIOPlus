import { DefensePostExecution } from "../../../src/core/execution/DefensePostExecution";
import { PlayerExecution } from "../../../src/core/execution/PlayerExecution";
import {
  Game,
  Player,
  PlayerInfo,
  PlayerType,
  UnitType,
} from "../../../src/core/game/Game";
import { setup } from "../../util/Setup";
import { TestConfig } from "../../util/TestConfig";
import { executeTicks } from "../../util/utils";

function findInteriorLandTile(game: Game) {
  for (let x = 10; x < game.width() - 10; x++) {
    for (let y = 10; y < game.height() - 10; y++) {
      const candidate = game.ref(x, y);
      if (!game.isLand(candidate)) {
        continue;
      }
      const neighbors = game.neighbors(candidate);
      if (neighbors.every((neighbor) => game.isLand(neighbor))) {
        return candidate;
      }
    }
  }
  throw new Error("Failed to locate interior land tile for hamlet test");
}

let game: Game;
let player: Player;
let otherPlayer: Player;
let config: TestConfig;

describe("PlayerExecution", () => {
  beforeEach(async () => {
    game = await setup(
      "big_plains",
      {
        infiniteGold: true,
        instantBuild: true,
      },
      [
        new PlayerInfo("player", PlayerType.Human, "client_id1", "player_id"),
        new PlayerInfo("other", PlayerType.Human, "client_id2", "other_id"),
      ],
    );

    while (game.inSpawnPhase()) {
      game.executeNextTick();
    }

    player = game.player("player_id");
    otherPlayer = game.player("other_id");
    config = game.config() as TestConfig;
    config.setHamletHoldDurationTicks(5);
    config.setHamletCheckIntervalTicks(1);
    config.setHamletChecksPerInterval(100);

    game.addExecution(new PlayerExecution(player));
  });

  test("DefensePost lv. 1 is destroyed when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const defensePost = player.buildUnit(UnitType.DefensePost, tile, {});

    game.executeNextTick();
    expect(game.unitCount(UnitType.DefensePost)).toBe(1);
    expect(defensePost.level()).toBe(1);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(game.unitCount(UnitType.DefensePost)).toBe(0);
  });

  test("DefensePost lv. 2+ is downgraded when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const defensePost = player.buildUnit(UnitType.DefensePost, tile, {});
    defensePost.increaseLevel();

    expect(defensePost.level()).toBe(2);
    expect(game.unitCount(UnitType.DefensePost)).toBe(2); // unitCount sums levels
    expect(player.units(UnitType.DefensePost)).toHaveLength(1);
    expect(defensePost.isActive()).toBe(true);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(defensePost.level()).toBe(1);
    expect(game.unitCount(UnitType.DefensePost)).toBe(1);
    expect(otherPlayer.units(UnitType.DefensePost)).toHaveLength(1);
    expect(defensePost.owner()).toBe(otherPlayer);
    expect(defensePost.isActive()).toBe(true);
  });

  test("Non-DefensePost structures are transferred (not downgraded) when tile owner changes", () => {
    const tile = game.ref(50, 50);
    player.conquer(tile);
    const city = player.buildUnit(UnitType.City, tile, {});

    expect(game.unitCount(UnitType.City)).toBe(1);
    expect(city.level()).toBe(1);
    expect(city.owner()).toBe(player);
    expect(city.isActive()).toBe(true);

    otherPlayer.conquer(tile);
    executeTicks(game, 2);

    expect(game.unitCount(UnitType.City)).toBe(1);
    expect(city.level()).toBe(1);
    expect(city.owner()).toBe(otherPlayer);
    expect(city.isActive()).toBe(true);
  });

  test("DefensePost periodically drains enemy troops", () => {
    const friendlyTile = game.ref(40, 40);
    const enemyTile = game.ref(44, 40);

    player.conquer(friendlyTile);
    otherPlayer.conquer(enemyTile);

    const initialTroops = otherPlayer.troops();

    game.addExecution(new DefensePostExecution(player, friendlyTile));

    const ticksToRun = game.config().defensePostShellAttackRate() + 5;
    executeTicks(game, ticksToRun);

    expect(otherPlayer.troops()).toBeLessThan(initialTroops);
  });

  test("Recruitment centers increase troop growth rate", () => {
    const tile = game.ref(55, 55);
    player.conquer(tile);

    const baseline = game.config().troopIncreaseRate(player);

    player.buildUnit(UnitType.RecruitmentCenter, tile, {});

    const boosted = game.config().troopIncreaseRate(player);

    expect(boosted).toBeGreaterThan(baseline);
  });

  test("Hamlets spawn on long-held safe tiles", () => {
    const tile = findInteriorLandTile(game);

    player.conquer(tile);
    for (const neighbor of game.neighbors(tile)) {
      if (game.isLand(neighbor)) {
        player.conquer(neighbor);
      }
    }

    const ticksToWait =
      config.hamletHoldDurationTicks() + config.hamletCheckIntervalTicks() + 5;
    executeTicks(game, ticksToWait);

    const hamlets = player.units(UnitType.Hamlet);
    expect(hamlets.length).toBeGreaterThanOrEqual(1);
    expect(hamlets.some((unit) => unit.tile() === tile)).toBe(true);
  });
});
