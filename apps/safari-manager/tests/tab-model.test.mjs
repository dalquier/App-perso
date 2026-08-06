import test from "node:test"; import assert from "node:assert/strict";
import { modelTab, filterTabs, safeClosableIds } from "../extension/shared/tab-model.js";
test("modélise titre et URL manquants", () => assert.deepEqual(modelTab({ id: 3, active: true }), { id:3, windowId:null, active:true, title:"Onglet sans titre", url:"", domain:"URL non accessible" }));
test("utilise le domaine comme titre de repli et conserve windowId", () => { const tab=modelTab({id:1,windowId:4,url:"https://Example.com/a"}); assert.equal(tab.title,"example.com"); assert.equal(tab.windowId,4); });
test("recherche sans casse dans titre domaine et URL", () => { const tabs=[modelTab({id:1,title:"Actualités",url:"https://news.example/a"})]; assert.equal(filterTabs(tabs,"ACTUAL").length,1); assert.equal(filterTabs(tabs,"NEWS.EXAMPLE").length,1); });
test("retourne uniquement les identifiants sélectionnés encore sûrs", () => assert.deepEqual(safeClosableIds([{id:1},{id:2}], new Set([2,3,"1"])), [2]));
