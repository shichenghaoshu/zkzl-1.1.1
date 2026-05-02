import { describe, expect, it } from "vitest";
import { pathToRoute, routePaths } from "./routes";

describe("app routes", () => {
  it("maps legal and help paths to stable app routes", () => {
    expect(routePaths.help).toBe("/help");
    expect(routePaths.legalPrivacy).toBe("/legal/privacy");
    expect(routePaths.legalTerms).toBe("/legal/terms");
    expect(routePaths.legalChildren).toBe("/legal/children");
    expect(routePaths.legalCopyright).toBe("/legal/copyright");
    expect(pathToRoute("/help")).toBe("help");
    expect(pathToRoute("/legal/privacy")).toBe("legalPrivacy");
  });

  it("routes unknown paths to the Chinese not found page", () => {
    expect(pathToRoute("/unknown-class-link")).toBe("notFound");
  });
});
