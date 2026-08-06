import test from "node:test"; import assert from "node:assert/strict";
import { normalizeUrl, domainFromUrl } from "../extension/shared/url-utils.js";
test("normalise protocole, hôte et port HTTPS par défaut", () => assert.equal(normalizeUrl("HTTPS://Example.COM:443/a"), "https://example.com/a"));
test("conserve chemin et paramètres, y compris tracking", () => assert.equal(normalizeUrl("https://example.com/a?utm_source=x&b=2"), "https://example.com/a?utm_source=x&b=2"));
test("supprime le fragment", () => assert.equal(normalizeUrl("http://example.com:80/a?q=1#part"), "http://example.com/a?q=1"));
test("rejette URL absente, invalide ou non web", () => { assert.equal(normalizeUrl(), null); assert.equal(normalizeUrl("x"), null); assert.equal(normalizeUrl("file:///a"), null); });
test("extrait le domaine sans inventer une valeur", () => { assert.equal(domainFromUrl("https://example.com/a"), "example.com"); assert.equal(domainFromUrl(""), "Domaine indisponible"); });
