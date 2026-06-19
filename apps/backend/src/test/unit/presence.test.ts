import { describe, it, expect, beforeEach } from "vitest";
import { addConnection, removeConnection, setStatus, getStatus, getMany, _reset } from "../../realtime/presence";

beforeEach(() => _reset());

describe("Phase L — presence registry", () => {
  it("marks a user online on connect and offline when the last socket closes", () => {
    expect(getStatus("u1")).toBe("offline");
    addConnection("u1", "g1");
    expect(getStatus("u1")).toBe("online");
    // second tab/device
    addConnection("u1", "g1");
    removeConnection("u1");
    expect(getStatus("u1")).toBe("online"); // still one socket open
    removeConnection("u1");
    expect(getStatus("u1")).toBe("offline");
  });

  it("supports away/active transitions only while connected", () => {
    addConnection("u1", "g1");
    expect(setStatus("u1", "away")).toBe("away");
    expect(getStatus("u1")).toBe("away");
    expect(setStatus("u1", "online")).toBe("online");
    removeConnection("u1");
    // away on a disconnected user is ignored → offline
    expect(setStatus("u1", "away")).toBe("offline");
  });

  it("returns a status map for many users", () => {
    addConnection("a", "g1");
    addConnection("b", "g1");
    setStatus("b", "away");
    expect(getMany(["a", "b", "c"])).toEqual({ a: "online", b: "away", c: "offline" });
  });
});
