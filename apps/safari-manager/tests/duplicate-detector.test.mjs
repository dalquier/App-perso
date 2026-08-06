import test from "node:test"; import assert from "node:assert/strict";
import { duplicateGroups, duplicateRemovalPlan } from "../extension/shared/duplicate-detector.js";
test("regroupe seulement les URL normalisées identiques", () => { const groups=duplicateGroups([{id:1,url:"https://EXAMPLE.com/a#x"},{id:2,url:"https://example.com/a"},{id:3,url:"https://example.com/b"}]); assert.equal(groups.length,1); assert.deepEqual(groups[0].tabs.map(t=>t.id),[1,2]); });
test("ne regroupe pas des requêtes différentes", () => assert.equal(duplicateGroups([{id:1,url:"https://e.test/?a=1"},{id:2,url:"https://e.test/?a=2"}]).length,0));
test("conserve l'onglet actif et sélectionne sûrement les autres", () => assert.deepEqual(duplicateRemovalPlan([{tabs:[{id:1},{id:2,active:true},{id:null}]}]),{keep:[2],remove:[1]}));
test("conserve sinon le premier présenté", () => assert.deepEqual(duplicateRemovalPlan([{tabs:[{id:4},{id:5}]}]),{keep:[4],remove:[5]}));
