import { describe, expect, it } from "vitest";
import {
  addWorkingDays,
  getAttendanceSlot,
  getWeekStart,
  getWorkingDatesBetween,
  isMonday,
  normalizeClosingPeriod,
} from "./dateUtils.js";

describe("dateUtils", () => {
  it("valida corretamente se a data é uma segunda-feira", () => {
    expect(isMonday("2026-08-03")).toBe(true); // Monday
    expect(isMonday("2026-08-04")).toBe(false); // Tuesday
    expect(isMonday("2026-08-09")).toBe(false); // Sunday
    expect(isMonday("")).toBe(false);
    expect(isMonday(null)).toBe(false);
  });

  it("retorna a segunda-feira correta para qualquer dia da semana", () => {
    // 2026-08-05 is Wednesday -> Monday is 2026-08-03
    const date = new Date(Date.UTC(2026, 7, 5, 12, 0, 0));
    expect(getWeekStart(date)).toBe("2026-08-03");

    // 2026-08-09 is Sunday -> Monday is 2026-08-03
    const sunday = new Date(Date.UTC(2026, 7, 9, 12, 0, 0));
    expect(getWeekStart(sunday)).toBe("2026-08-03");
  });

  it("soma dias trabalhados pulando apenas domingos", () => {
    // Starting on Monday 2026-08-03, 6 working days (Mon to Sat) -> 2026-08-08
    expect(addWorkingDays("2026-08-03", 6)).toBe("2026-08-08");

    // Starting on Monday 2026-08-03, 12 working days (skips Sunday 2026-08-09) -> 2026-08-15
    expect(addWorkingDays("2026-08-03", 12)).toBe("2026-08-15");
  });

  it("gera lista de datas trabalhadas excluindo domingos", () => {
    const dates = getWorkingDatesBetween("2026-08-08", "2026-08-10");
    // 2026-08-08 (Saturday), 2026-08-09 (Sunday - skipped), 2026-08-10 (Monday)
    expect(dates).toEqual(["2026-08-08", "2026-08-10"]);
  });

  it("mapeia a data para seu slot de presença (segunda-feira da semana e chave do dia)", () => {
    // 2026-08-04 is Tuesday
    const slot = getAttendanceSlot("2026-08-04");
    expect(slot.weekStart).toBe("2026-08-03");
    expect(slot.day).toBe("ter");
  });

  it("normaliza períodos de fechamento garantindo semanal ou quinzenal", () => {
    expect(normalizeClosingPeriod("semanal")).toBe("semanal");
    expect(normalizeClosingPeriod("quinzenal")).toBe("quinzenal");
    expect(normalizeClosingPeriod("invalido")).toBe("quinzenal");
    expect(normalizeClosingPeriod(undefined)).toBe("quinzenal");
  });
});
