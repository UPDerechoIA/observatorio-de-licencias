import { describe, it, expect } from "vitest";
import { parseLicense } from "../src/lib/parser";
import { classifyClause } from "../src/lib/clauseDirection";

const baseParams = {
  id: "dir-test-2026-06-15",
  providerName: "TestProvider",
  productName: "TestProduct",
  productTier: "Free",
  documentType: "Terms of Use",
  sourceUrl: null,
  retrievedAt: "2026-06-15",
  rawTextPath: "data/raw/dir-test-2026-06-15.txt",
};

const parse = (rawText: string) => parseLicense({ ...baseParams, rawText });

describe("classifyClause: dirección por sujeto, modal solo refina", () => {
  it("prohibición al usuario de entrenar/destilar => prohibited_use (usuario)", () => {
    const d = classifyClause("You may not use the outputs to train, scrape or distill a model.");
    expect(d.clauseFunction).toBe("prohibited_use");
    expect(d.obligationTarget).toBe("user");
  });

  it("prohibición al usuario de violar privacidad => prohibited_use (usuario)", () => {
    const d = classifyClause("You may not violate the privacy rights of others.");
    expect(d.clauseFunction).toBe("prohibited_use");
    expect(d.obligationTarget).toBe("user");
  });

  it("uso de datos por el proveedor para entrenar => provider_data_use", () => {
    const d = classifyClause("We may use your content to train and improve our models.");
    expect(d.clauseFunction).toBe("provider_data_use");
    expect(d.actor).toBe("provider");
  });

  it("tratamiento de datos personales por el proveedor => privacy_policy", () => {
    const d = classifyClause("We collect and use personal information to provide the service.");
    expect(d.clauseFunction).toBe("privacy_policy");
    expect(d.actor).toBe("provider");
  });

  it("negación del proveedor ('we do not sell') sigue siendo privacy_policy, no restricción", () => {
    const d = classifyClause("We do not sell your personal information to third parties.");
    expect(d.clauseFunction).toBe("privacy_policy");
    expect(d.actor).toBe("provider");
  });
});

describe("parser: falsos positivos de dirección (criterios de aceptación)", () => {
  it("'user may not use outputs to train a model' NO activa training_use del proveedor", () => {
    const a = parse("The user may not use outputs to train a model.");
    expect(a.categories.training_use.status).toBe("not_found");
  });

  it("'we may use your content to train/improve models' SÍ activa training_use del proveedor", () => {
    const a = parse("We may use your content to train and improve our models.");
    expect(a.categories.training_use.status).toBe("found");
    expect(a.categories.training_use.clauseFunction).toBe("provider_data_use");
    expect(a.categories.training_use.evidence.length).toBeGreaterThan(0);
  });

  it("'you may not violate privacy rights' NO activa privacidad del usuario", () => {
    const a = parse("You may not violate privacy rights of any third party.");
    expect(a.categories.privacy.status).toBe("not_found");
  });

  it("'we collect and use personal information' SÍ activa privacidad del proveedor", () => {
    const a = parse("We collect and use personal information about you to operate the service.");
    expect(a.categories.privacy.status).toBe("found");
    expect(a.categories.privacy.clauseFunction).toBe("privacy_policy");
  });

  it("la restricción al usuario se RECLASIFICA visiblemente como uso prohibido", () => {
    const scraping = parse("Users may not use outputs to train, scrape or distill a model.");
    expect(scraping.categories.training_use.status).toBe("not_found");
    expect(scraping.categories.prohibited_content.status).toBe("found");
    expect(scraping.categories.prohibited_content.clauseFunction).toBe("prohibited_use");
    expect(scraping.categories.prohibited_content.evidence.length).toBeGreaterThan(0);

    const privacy = parse("You may not violate the privacy rights of others.");
    expect(privacy.categories.privacy.status).toBe("not_found");
    expect(privacy.categories.prohibited_content.status).toBe("found");
    expect(privacy.categories.prohibited_content.clauseFunction).toBe("prohibited_use");
  });

  it("una prohibición de entrenar al usuario no contamina el perfil de privacidad", () => {
    const a = parse("You may not use the service or its outputs to train a competing model.");
    expect(a.privacy.signals).not.toContain("broad_training_use");
  });
});
